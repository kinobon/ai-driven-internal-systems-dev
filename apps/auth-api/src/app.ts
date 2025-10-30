import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import {
  issueAccessToken,
  verifyAccessToken,
  RBAC_ROLES,
  ROLE_DESCRIPTIONS,
  type RbacRole
} from '@repo/core';
import { getAuthConfig } from './config.js';

const defaultAuthorizationCodes: ReadonlyArray<[string, string]> = [
  ['demo-code', 'demo-user']
];

const authorizationCodeStore = new Map<string, string>(defaultAuthorizationCodes);

type UserRecord = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  roles: RbacRole[];
};

const defaultUsers: ReadonlyArray<[string, UserRecord]> = [
  [
    'demo-user',
    {
      id: 'demo-user',
      username: 'demo',
      email: 'demo.user@example.com',
      displayName: 'Demo User',
      roles: ['employee', 'manager']
    }
  ]
];

const userStore = new Map(defaultUsers);

type RefreshTokenRecord = {
  token: string;
  userId: string;
  audience: string;
  expiresAt: Date;
  revokedAt?: Date;
};

const refreshTokenStore = new Map<string, RefreshTokenRecord>();

const defaultCustomRoles: ReadonlyArray<[
  string,
  {
    key: string;
    displayName: string;
    description?: string;
  }
]> = [];

const customRoleStore = new Map(defaultCustomRoles);

export const resetAuthState = () => {
  authorizationCodeStore.clear();
  for (const [code, userId] of defaultAuthorizationCodes) {
    authorizationCodeStore.set(code, userId);
  }

  userStore.clear();
  for (const [userId, user] of defaultUsers) {
    userStore.set(userId, user);
  }

  refreshTokenStore.clear();
  customRoleStore.clear();
  for (const [roleKey, role] of defaultCustomRoles) {
    customRoleStore.set(roleKey, role);
  }
};

const tokenRequestSchema = z.object({
  grant_type: z.enum(['authorization_code', 'refresh_token']),
  code: z.string().optional(),
  refresh_token: z.string().optional(),
  client_id: z.string().optional(),
  redirect_uri: z.string().optional(),
  code_verifier: z.string().optional()
});

const revokeRequestSchema = z.object({
  token: z.string()
});

const roleRegistrationSchema = z.object({
  key: z
    .string()
    .min(3)
    .regex(/^[a-z0-9:_-]+$/),
  displayName: z.string().min(3),
  description: z.string().optional()
});

const config = getAuthConfig();

const app = new Hono();

app.get('/', (c) => c.json({ status: 'ok' }));

app.post('/oauth/token', async (c) => {
  const parsed = tokenRequestSchema.safeParse(await c.req.json());

  if (!parsed.success) {
    return c.json(
      {
        error: 'invalid_request',
        error_description: parsed.error.flatten()
      },
      400
    );
  }

  const payload = parsed.data;
  if (payload.grant_type === 'authorization_code') {
    if (!payload.code) {
      return c.json({ error: 'invalid_request', error_description: 'code is required' }, 400);
    }

    const userId = authorizationCodeStore.get(payload.code);
    if (!userId) {
      return c.json({ error: 'invalid_grant', error_description: 'code not found or expired' }, 400);
    }

    const user = userStore.get(userId);
    if (!user) {
      return c.json({ error: 'invalid_grant', error_description: 'user not found' }, 400);
    }

    authorizationCodeStore.delete(payload.code);

    const tokens = await issueTokensForUser(user, payload.audience ?? config.audience);

    return c.json(tokens);
  }

  if (payload.grant_type === 'refresh_token') {
    if (!payload.refresh_token) {
      return c.json({ error: 'invalid_request', error_description: 'refresh_token is required' }, 400);
    }

    const existing = refreshTokenStore.get(payload.refresh_token);
    if (!existing) {
      return c.json({ error: 'invalid_grant', error_description: 'refresh token not found' }, 400);
    }

    if (existing.revokedAt) {
      return c.json({ error: 'invalid_grant', error_description: 'refresh token revoked' }, 400);
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      refreshTokenStore.delete(payload.refresh_token);
      return c.json({ error: 'invalid_grant', error_description: 'refresh token expired' }, 400);
    }

    const user = userStore.get(existing.userId);
    if (!user) {
      return c.json({ error: 'invalid_grant', error_description: 'user not found' }, 400);
    }

    const tokens = await issueTokensForUser(user, existing.audience);

    refreshTokenStore.delete(payload.refresh_token);

    return c.json(tokens);
  }

  return c.json({ error: 'unsupported_grant_type' }, 400);
});

app.post('/oauth/revoke', async (c) => {
  const parsed = revokeRequestSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json(
      {
        error: 'invalid_request',
        error_description: parsed.error.flatten()
      },
      400
    );
  }

  const record = refreshTokenStore.get(parsed.data.token);
  if (!record) {
    return c.json({ status: 'ignored', reason: 'token not found' }, 200);
  }

  record.revokedAt = new Date();
  refreshTokenStore.set(record.token, record);
  return c.json({ status: 'revoked' });
});

app.get('/userinfo', async (c) => {
  const authorization = c.req.header('authorization');
  if (!authorization) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const token = authorization.replace(/^Bearer\s+/i, '');
  try {
    const payload = await verifyAccessToken({
      token,
      issuer: config.issuer,
      signingKey: config.signingKey,
      audience: config.audience
    });

    const user = userStore.get(String(payload.sub));

    return c.json({
      sub: payload.sub,
      name: payload['name'] ?? user?.displayName ?? 'Unknown User',
      email: payload['email'] ?? user?.email ?? 'unknown@example.com',
      roles: payload['roles'] ?? user?.roles ?? []
    });
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }
});

app.get('/rbac/roles', (c) => {
  const builtinRoles = RBAC_ROLES.map((role) => ({
    key: role,
    displayName: role,
    description: ROLE_DESCRIPTIONS[role]
  }));
  const dynamicRoles = Array.from(customRoleStore.values());
  return c.json({ roles: [...builtinRoles, ...dynamicRoles] });
});

app.post('/rbac/roles', async (c) => {
  const payload = roleRegistrationSchema.safeParse(await c.req.json());
  if (!payload.success) {
    return c.json(
      {
        error: 'invalid_request',
        error_description: payload.error.flatten()
      },
      400
    );
  }

  const data = payload.data;
  if (RBAC_ROLES.includes(data.key as RbacRole) || customRoleStore.has(data.key)) {
    return c.json({ error: 'conflict', error_description: 'role already exists' }, 409);
  }

  customRoleStore.set(data.key, data);
  return c.json({ status: 'created', role: data }, 201);
});

const issueTokensForUser = async (
  user: {
    id: string;
    roles: RbacRole[];
    email: string;
    displayName: string;
  },
  audience: string | string[]
) => {
  const accessToken = await issueAccessToken({
    subject: user.id,
    audience,
    roles: user.roles,
    issuer: config.issuer,
    signingKey: config.signingKey,
    ttlSeconds: config.accessTokenTtlSeconds,
    claims: {
      email: user.email,
      name: user.displayName
    }
  });

  const refreshToken = `rt_${randomUUID()}`;
  refreshTokenStore.set(refreshToken, {
    token: refreshToken,
    userId: user.id,
    audience: Array.isArray(audience) ? audience[0] : audience,
    expiresAt: new Date(Date.now() + config.accessTokenTtlSeconds * 10 * 1000)
  });

  return {
    token_type: 'Bearer',
    access_token: accessToken,
    expires_in: config.accessTokenTtlSeconds,
    refresh_token: refreshToken,
    scope: 'openid profile email offline_access'
  };
};

export type AuthApp = typeof app;

export { app };

export const authStores = {
  authorizationCodeStore,
  userStore,
  refreshTokenStore,
  customRoleStore
};

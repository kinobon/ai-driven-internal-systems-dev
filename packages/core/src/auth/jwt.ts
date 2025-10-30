import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { RBAC_ROLES, type RbacRole } from './roles.js';

export type IssueTokenParams = {
  subject: string;
  audience?: string | string[];
  roles: RbacRole[];
  claims?: Record<string, unknown>;
  ttlSeconds: number;
  issuer: string;
  signingKey: string;
};

export type VerifyTokenParams = {
  token: string;
  audience?: string | string[];
  issuer: string;
  signingKey: string;
};

const encoder = new TextEncoder();

const toKey = (signingKey: string) => encoder.encode(signingKey);

export const issueAccessToken = async ({
  subject,
  audience,
  roles,
  claims,
  ttlSeconds,
  issuer,
  signingKey
}: IssueTokenParams): Promise<string> => {
  const roleSet = new Set<RbacRole>(RBAC_ROLES);
  const filteredRoles = roles.filter((role) => roleSet.has(role));

  const signer = new SignJWT({
    ...claims,
    roles: filteredRoles
  });

  if (audience) {
    signer.setAudience(audience);
  }

  return signer
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(subject)
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(toKey(signingKey));
};

export const verifyAccessToken = async ({
  token,
  audience,
  issuer,
  signingKey
}: VerifyTokenParams): Promise<JWTPayload> => {
  const { payload } = await jwtVerify(token, toKey(signingKey), {
    issuer,
    audience
  });

  return payload;
};

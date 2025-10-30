import { describe, expect, it, beforeEach } from 'vitest';
import { app, resetAuthState, authStores } from '../app.js';

const jsonHeaders = { 'content-type': 'application/json' };

describe('Auth Service App', () => {
  beforeEach(() => {
    resetAuthState();
  });

  it('issues access and refresh tokens for authorization_code grant', async () => {
    const response = await app.request('/oauth/token', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'demo-code'
      })
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toMatchObject({
      token_type: 'Bearer',
      scope: expect.stringContaining('openid'),
      access_token: expect.any(String),
      refresh_token: expect.any(String)
    });
  });

  it('returns userinfo for a valid bearer token', async () => {
    const tokenResponse = await app.request('/oauth/token', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'demo-code'
      })
    });

    const { access_token: accessToken } = await tokenResponse.json();

    const userInfoResponse = await app.request('/userinfo', {
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(userInfoResponse.status).toBe(200);
    const userInfo = await userInfoResponse.json();

    expect(userInfo).toMatchObject({
      sub: 'demo-user',
      email: 'demo.user@example.com'
    });
  });

  it('supports refresh_token grant with issued refresh token', async () => {
    const tokenResponse = await app.request('/oauth/token', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'demo-code'
      })
    });

    const { refresh_token: refreshToken } = await tokenResponse.json();

    const refreshResponse = await app.request('/oauth/token', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    expect(refreshResponse.status).toBe(200);
    const refreshed = await refreshResponse.json();

    expect(refreshed.refresh_token).not.toBe(refreshToken);
    expect(refreshed.access_token).toEqual(expect.any(String));
  });

  it('lists builtin and custom roles', async () => {
    authStores.customRoleStore.set('custom_approver', {
      key: 'custom_approver',
      displayName: 'Custom Approver',
      description: 'Handles bespoke approvals'
    });

    const response = await app.request('/rbac/roles');
    expect(response.status).toBe(200);
    const { roles } = await response.json();

    const roleKeys = roles.map((role: { key: string }) => role.key);
    expect(roleKeys).toContain('employee');
    expect(roleKeys).toContain('custom_approver');
  });

  it('revokes refresh tokens and rejects reuse', async () => {
    const tokenResponse = await app.request('/oauth/token', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: 'demo-code'
      })
    });

    const { refresh_token: refreshToken } = await tokenResponse.json();

    const revokeResponse = await app.request('/oauth/revoke', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ token: refreshToken })
    });
    expect(revokeResponse.status).toBe(200);

    const refreshResponse = await app.request('/oauth/token', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    expect(refreshResponse.status).toBe(400);
    const error = await refreshResponse.json();
    expect(error.error).toBe('invalid_grant');
  });
});

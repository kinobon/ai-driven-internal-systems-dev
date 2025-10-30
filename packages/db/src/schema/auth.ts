import type { RbacRole } from '@repo/core';

export type AuthUserStatus = 'active' | 'suspended' | 'disabled';

export type AuthUserRow = {
  id: string;
  username: string;
  employeeCode?: string;
  primaryEmail: string;
  displayName: string;
  status: AuthUserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthRoleRow = {
  id: string;
  key: RbacRole;
  displayName: string;
  description: string;
  createdAt: Date;
};

export type AuthUserRoleRow = {
  userId: string;
  roleId: string;
  grantedBy: string;
  grantedAt: Date;
};

export type AuthRefreshTokenRow = {
  id: string;
  userId: string;
  audience: string;
  tokenHash: string;
  issuedAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
  reason?: string;
};

export type AuthAuditLogAction =
  | 'ISSUE_TOKEN'
  | 'REFRESH_TOKEN'
  | 'REVOKE_TOKEN'
  | 'VERIFY_TOKEN'
  | 'ASSIGN_ROLE'
  | 'REMOVE_ROLE';

export type AuthAuditLogRow = {
  id: string;
  action: AuthAuditLogAction;
  actorId: string;
  targetId?: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
};

export const AUTH_TABLES = {
  users: 'auth_users',
  roles: 'auth_roles',
  userRoles: 'auth_user_roles',
  refreshTokens: 'auth_refresh_tokens',
  auditLogs: 'auth_audit_logs'
} as const;

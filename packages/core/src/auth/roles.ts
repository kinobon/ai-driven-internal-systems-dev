export const RBAC_ROLES = [
  'employee',
  'manager',
  'hr_admin',
  'finance_admin',
  'system_admin'
] as const;

export type RbacRole = (typeof RBAC_ROLES)[number];

export const ROLE_DESCRIPTIONS: Record<RbacRole, string> = {
  employee: '一般社員向けの標準権限',
  manager: '部門マネージャ向けの承認・レポート権限',
  hr_admin: '人事部門の管理者権限',
  finance_admin: '経理部門の管理者権限',
  system_admin: 'システム運用者向けの全権限'
};

export type EmployeeConfig = {
  allowDuplicateEmail: boolean;
};

const defaultConfig: EmployeeConfig = {
  allowDuplicateEmail: process.env.EMPLOYEE_ALLOW_DUPLICATE_EMAIL === 'true'
};

export const getEmployeeConfig = (): EmployeeConfig => defaultConfig;

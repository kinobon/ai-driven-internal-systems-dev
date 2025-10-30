import type { EmployeeStatus } from '@repo/core';

export type EmployeeRow = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  title: string;
  status: EmployeeStatus;
  managerId?: string | null;
  phone?: string | null;
  joinedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DepartmentRow = {
  id: string;
  name: string;
  description?: string | null;
  managerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JobGradeRow = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const EMPLOYEE_TABLES = {
  employees: 'employees',
  departments: 'employee_departments',
  jobGrades: 'employee_job_grades'
} as const;

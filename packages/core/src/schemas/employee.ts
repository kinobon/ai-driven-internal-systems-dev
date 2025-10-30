import { z } from 'zod';

export const employeeStatusSchema = z.enum(['active', 'on_leave', 'terminated', 'probation']);

export const employeeBaseSchema = z.object({
  employeeCode: z
    .string()
    .min(1, 'employeeCode is required')
    .max(64, 'employeeCode must be 64 characters or fewer'),
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  email: z.string().email('email must be a valid email address'),
  departmentId: z.string().min(1, 'departmentId is required'),
  title: z.string().min(1, 'title is required'),
  status: employeeStatusSchema.optional(),
  phone: z.string().optional(),
  managerId: z.string().min(1, 'managerId must be provided when set').optional(),
  joinedDate: z
    .string()
    .datetime({ message: 'joinedDate must follow ISO 8601 format' })
    .optional()
});

export const employeeCreateSchema = employeeBaseSchema;

export const employeeUpdateSchema = employeeBaseSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

export const employeeResponseSchema = employeeBaseSchema.extend({
  id: z.string().min(1, 'id is required'),
  status: employeeStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const departmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string().min(1).optional()
});

export const jobGradeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional()
});

export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type EmployeeResponse = z.infer<typeof employeeResponseSchema>;
export type Department = z.infer<typeof departmentSchema>;
export type JobGrade = z.infer<typeof jobGradeSchema>;

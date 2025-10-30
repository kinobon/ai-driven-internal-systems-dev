import { randomUUID } from 'node:crypto';
import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  employeeCreateSchema,
  employeeUpdateSchema,
  employeeResponseSchema,
  departmentSchema,
  jobGradeSchema,
  type EmployeeResponse,
  type EmployeeCreateInput,
  type EmployeeUpdateInput,
  type Department,
  type JobGrade
} from '@repo/core';
import { getEmployeeConfig } from './config.js';

const now = () => new Date().toISOString();

const defaultDepartments: ReadonlyArray<Department> = [
  {
    id: 'd-people-ops',
    name: 'People Operations',
    description: 'Human resources and people success team',
    managerId: undefined
  },
  {
    id: 'd-engineering',
    name: 'Engineering',
    description: 'Product engineering organization',
    managerId: undefined
  }
];

const defaultJobGrades: ReadonlyArray<JobGrade> = [
  { id: 'g-ic-3', name: 'IC-3', description: 'Software Engineer III' },
  { id: 'g-m-2', name: 'M-2', description: 'Manager II' }
];

type EmployeeRecord = EmployeeResponse;

const defaultEmployees: ReadonlyArray<EmployeeRecord> = [
  {
    id: 'emp-demo-001',
    employeeCode: 'E0001',
    firstName: 'Taro',
    lastName: 'Yamada',
    email: 'taro.yamada@example.com',
    departmentId: 'd-engineering',
    title: 'Engineering Manager',
    status: 'active',
    phone: '+81-3-1234-5678',
    managerId: undefined,
    joinedDate: '2023-04-01T00:00:00.000Z',
    createdAt: '2023-04-01T00:00:00.000Z',
    updatedAt: '2023-04-01T00:00:00.000Z'
  },
  {
    id: 'emp-demo-002',
    employeeCode: 'E0002',
    firstName: 'Hanako',
    lastName: 'Sato',
    email: 'hanako.sato@example.com',
    departmentId: 'd-people-ops',
    title: 'HR Specialist',
    status: 'on_leave',
    phone: undefined,
    managerId: 'emp-demo-001',
    joinedDate: '2024-01-10T00:00:00.000Z',
    createdAt: '2024-01-10T00:00:00.000Z',
    updatedAt: '2024-07-15T00:00:00.000Z'
  }
];

const employeeStore = new Map<string, EmployeeRecord>(defaultEmployees.map((emp) => [emp.id, emp]));
const departmentStore = new Map<string, Department>(defaultDepartments.map((dep) => [dep.id, dep]));
const jobGradeStore = new Map<string, JobGrade>(defaultJobGrades.map((grade) => [grade.id, grade]));

const config = getEmployeeConfig();

const app = new Hono();

type FlattenedErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
};

const parseJsonBody = async <T>(
  c: Context,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: FlattenedErrors }> => {
  try {
    const json = await c.req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten() };
    }

    return { success: true, data: parsed.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: {
          formErrors: ['invalid_json'],
          fieldErrors: {}
        }
      };
    }
    throw error;
  }
};

const toResponse = (record: EmployeeRecord) => employeeResponseSchema.parse(record);

const createRecord = (input: EmployeeCreateInput): EmployeeRecord => {
  const timestamp = now();
  return {
    id: randomUUID(),
    employeeCode: input.employeeCode,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    departmentId: input.departmentId,
    title: input.title,
    status: input.status ?? 'active',
    phone: input.phone,
    managerId: input.managerId,
    joinedDate: input.joinedDate,
    createdAt: timestamp,
    updatedAt: timestamp
  } satisfies EmployeeRecord;
};

const applyUpdate = (
  existing: EmployeeRecord,
  patch: EmployeeUpdateInput
): EmployeeRecord => {
  const next: EmployeeRecord = { ...existing };

  for (const [key, value] of Object.entries(patch) as [
    keyof EmployeeUpdateInput,
    EmployeeUpdateInput[keyof EmployeeUpdateInput]
  ][]) {
    if (value !== undefined) {
      // @ts-expect-error dynamic assignment aligns with EmployeeRecord keys
      next[key] = value;
    }
  }

  next.status = patch.status ?? existing.status;
  next.updatedAt = now();

  return next;
};

const allowDuplicateEmail = () => config.allowDuplicateEmail;

const ensureEmailUnique = (email: string, employeeId?: string) => {
  if (allowDuplicateEmail()) return;

  for (const record of employeeStore.values()) {
    if (record.email === email && record.id !== employeeId) {
      throw Object.assign(new Error('duplicate_email'), { status: 409 });
    }
  }
};

app.get('/', (c) =>
  c.json({
    status: 'ok',
    employees: employeeStore.size,
    departments: departmentStore.size
  })
);

app.get('/employees', (c) => {
  const employees = Array.from(employeeStore.values()).map(toResponse);
  return c.json({ employees });
});

app.post('/employees', async (c) => {
  const parsed = await parseJsonBody(c, employeeCreateSchema);
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error }, 400);
  }

  try {
    ensureEmailUnique(parsed.data.email);
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 409) {
      return c.json({ error: 'conflict', message: 'email must be unique' }, 409);
    }
    throw error;
  }

  const record = createRecord(parsed.data);
  employeeStore.set(record.id, record);

  return c.json({ employee: toResponse(record) }, 201);
});

app.get('/employees/:id', (c) => {
  const employee = employeeStore.get(c.req.param('id'));
  if (!employee) {
    return c.json({ error: 'not_found' }, 404);
  }

  return c.json({ employee: toResponse(employee) });
});

app.patch('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const existing = employeeStore.get(id);
  if (!existing) {
    return c.json({ error: 'not_found' }, 404);
  }

  const parsed = await parseJsonBody(c, employeeUpdateSchema);
  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error }, 400);
  }

  if (parsed.data.email) {
    try {
      ensureEmailUnique(parsed.data.email, id);
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 409) {
        return c.json({ error: 'conflict', message: 'email must be unique' }, 409);
      }
      throw error;
    }
  }

  const updated = applyUpdate(existing, parsed.data);
  employeeStore.set(id, updated);

  return c.json({ employee: toResponse(updated) });
});

app.get('/metadata/departments', (c) => {
  const departments = Array.from(departmentStore.values()).map((dept) => departmentSchema.parse(dept));
  return c.json({ departments });
});

app.get('/metadata/job-grades', (c) => {
  const jobGrades = Array.from(jobGradeStore.values()).map((grade) => jobGradeSchema.parse(grade));
  return c.json({ jobGrades });
});

export const resetEmployeeState = () => {
  employeeStore.clear();
  for (const employee of defaultEmployees) {
    employeeStore.set(employee.id, { ...employee });
  }

  departmentStore.clear();
  for (const department of defaultDepartments) {
    departmentStore.set(department.id, { ...department });
  }

  jobGradeStore.clear();
  for (const jobGrade of defaultJobGrades) {
    jobGradeStore.set(jobGrade.id, { ...jobGrade });
  }
};

export const employeeStores = {
  employeeStore,
  departmentStore,
  jobGradeStore
};

export type EmployeeApp = typeof app;

export { app };

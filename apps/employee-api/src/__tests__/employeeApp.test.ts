import { beforeEach, describe, expect, it } from 'vitest';
import { app, resetEmployeeState, employeeStores } from '../app.js';

const jsonHeaders = { 'content-type': 'application/json' };

describe('Employee Service App', () => {
  beforeEach(() => {
    resetEmployeeState();
  });

  it('lists employees with initial seed data', async () => {
    const response = await app.request('/employees');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.employees)).toBe(true);
    expect(body.employees.length).toBeGreaterThan(0);
  });

  it('creates a new employee via POST', async () => {
    const createResponse = await app.request('/employees', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        employeeCode: 'E0003',
        firstName: 'Akira',
        lastName: 'Suzuki',
        email: 'akira.suzuki@example.com',
        departmentId: 'd-engineering',
        title: 'Software Engineer',
        status: 'probation'
      })
    });

    expect(createResponse.status).toBe(201);
    const body = await createResponse.json();
    expect(body.employee).toMatchObject({
      employeeCode: 'E0003',
      status: 'probation'
    });

    expect(employeeStores.employeeStore.size).toBeGreaterThan(2);
  });

  it('rejects invalid payloads', async () => {
    const response = await app.request('/employees', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({})
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('invalid_request');
  });

  it('returns 404 for missing employee', async () => {
    const response = await app.request('/employees/unknown');
    expect(response.status).toBe(404);
  });

  it('updates employee fields with PATCH', async () => {
    const [existing] = Array.from(employeeStores.employeeStore.values());

    const response = await app.request(`/employees/${existing.id}`, {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ title: 'Updated Title' })
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.employee.title).toBe('Updated Title');
  });

  it('prevents duplicate emails when config disallows', async () => {
    const [existing] = Array.from(employeeStores.employeeStore.values());

    const response = await app.request('/employees', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        employeeCode: 'E0099',
        firstName: 'Dup',
        lastName: 'Email',
        email: existing.email,
        departmentId: existing.departmentId,
        title: 'Tester'
      })
    });

    expect(response.status).toBe(409);
  });

  it('exposes metadata endpoints', async () => {
    const departmentsRes = await app.request('/metadata/departments');
    expect(departmentsRes.status).toBe(200);
    const departments = await departmentsRes.json();
    expect(Array.isArray(departments.departments)).toBe(true);

    const jobGradesRes = await app.request('/metadata/job-grades');
    expect(jobGradesRes.status).toBe(200);
    const jobGrades = await jobGradesRes.json();
    expect(Array.isArray(jobGrades.jobGrades)).toBe(true);
  });
});

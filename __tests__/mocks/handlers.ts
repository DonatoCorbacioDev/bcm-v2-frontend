import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8090/api/v1';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    if (body.username === 'admin@example.com' && body.password === 'password123') {
      return HttpResponse.json({ token: 'fake-jwt-token' });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      id: 1,
      username: 'admin@example.com',
      managerId: 1,
      role: 'ADMIN',
      roleId: 1,
      verified: true,
      createdAt: '2024-01-01T00:00:00Z',
    });
  }),

  // Users
  http.get(`${BASE}/users`, () => {
    return HttpResponse.json([
      {
        id: 1,
        username: 'alice@example.com',
        managerId: 1,
        role: 'ADMIN',
        roleId: 1,
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        username: 'bob@example.com',
        managerId: 2,
        role: 'VIEWER',
        roleId: 2,
        verified: false,
        createdAt: '2024-02-01T00:00:00Z',
      },
    ]);
  }),

  // Managers
  http.get(`${BASE}/managers`, () => {
    return HttpResponse.json([
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '0000',
        department: 'IT',
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '1111',
        department: 'HR',
      },
    ]);
  }),
];

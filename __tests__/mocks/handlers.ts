import { http, HttpResponse } from 'msw';
import { uid } from "./ids";

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
      id: uid(1),
      username: 'admin@example.com',
      managerId: uid(1),
      role: 'ADMIN',
      roleId: uid(1),
      verified: true,
      createdAt: '2024-01-01T00:00:00Z',
    });
  }),

  // Users
  http.get(`${BASE}/users`, () => {
    return HttpResponse.json([
      {
        id: uid(1),
        username: 'alice@example.com',
        managerId: uid(1),
        role: 'ADMIN',
        roleId: uid(1),
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: uid(2),
        username: 'bob@example.com',
        managerId: uid(2),
        role: 'VIEWER',
        roleId: uid(2),
        verified: false,
        createdAt: '2024-02-01T00:00:00Z',
      },
    ]);
  }),

  // Managers
  http.get(`${BASE}/managers`, () => {
    return HttpResponse.json([
      {
        id: uid(1),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '0000',
        department: 'IT',
      },
      {
        id: uid(2),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '1111',
        department: 'HR',
      },
    ]);
  }),
];

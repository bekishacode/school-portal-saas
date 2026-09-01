import { authedFetch } from './api-client';

export interface SchoolUser {
  id: string;
  schoolId: string | null;
  role: string;
  fullName: string;
  username: string;
  email: string;
  phone: string | null;
  grade: string | null;
  section: string | null;
  department: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export type CreatableSchoolRole =
  | 'teacher'
  | 'registrar'
  | 'student'
  | 'parent'
  | 'librarian'
  | 'accountant';

export async function listUsers(token: string, role?: string): Promise<SchoolUser[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : '';
  return authedFetch(`/users${query}`, token);
}

export async function createUser(
  token: string,
  input: {
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    password: string;
    role: CreatableSchoolRole;
    grade?: string;
    section?: string;
    department?: string;
  },
): Promise<SchoolUser> {
  return authedFetch('/users', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

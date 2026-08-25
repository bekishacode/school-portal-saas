import { SetMetadata } from '@nestjs/common';

export enum Role {
  SUPER_ADMIN = 'super_admin', // you - manages all tenants
  SCHOOL_ADMIN = 'school_admin',
  REGISTRAR = 'registrar',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
  LIBRARIAN = 'librarian',
  ACCOUNTANT = 'accountant',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

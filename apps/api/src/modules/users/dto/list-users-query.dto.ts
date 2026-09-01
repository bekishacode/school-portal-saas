import { IsIn, IsOptional } from 'class-validator';

export const SCHOOL_LISTABLE_ROLES = [
  'school_admin',
  'registrar',
  'teacher',
  'student',
  'parent',
  'librarian',
  'accountant',
] as const;

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(SCHOOL_LISTABLE_ROLES, {
    message: 'role must be a valid school role',
  })
  role?: (typeof SCHOOL_LISTABLE_ROLES)[number];
}

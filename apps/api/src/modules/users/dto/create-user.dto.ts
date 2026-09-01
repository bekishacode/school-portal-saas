import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const SCHOOL_CREATABLE_ROLES = [
  'registrar',
  'teacher',
  'student',
  'parent',
  'librarian',
  'accountant',
] as const;

export type SchoolCreatableRole = (typeof SCHOOL_CREATABLE_ROLES)[number];

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsIn(SCHOOL_CREATABLE_ROLES, {
    message: 'Role must be teacher, registrar, student, parent, librarian, or accountant',
  })
  role: SchoolCreatableRole;
}

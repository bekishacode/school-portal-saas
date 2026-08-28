import { IsEmail, IsString, MinLength } from 'class-validator';

// Used by super_admin to onboard a new school + its first admin user.
// Not public - this is the replacement for the old open self-registration.
export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  schoolName: string;

  @IsString()
  @MinLength(2)
  adminFullName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  adminPassword: string;
}

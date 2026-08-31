import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  password: string;

  // Resolved by the frontend from the subdomain being logged in from.
  // Optional so platform/root-domain login (super_admin) still works
  // without one.
  @IsOptional()
  @IsString()
  schoolId?: string;
}

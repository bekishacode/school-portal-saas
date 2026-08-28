import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  // Admin-only: onboarding a new school is something WE do, not
  // something anyone can trigger from a public page.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.createSchoolWithAdmin(dto);
  }

  // Public: lets an unauthenticated tenant login page fetch branding
  // (name/logo/color) before anyone has logged in. No sensitive data.
  @Get('by-subdomain/:subdomain')
  getBySubdomain(@Param('subdomain') subdomain: string) {
    return this.schoolsService.getPublicBySubdomain(subdomain);
  }
}

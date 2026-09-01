import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DailyQuotaGuard } from '../usage/daily-quota.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles, Role } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, DailyQuotaGuard, RolesGuard, TenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(@Req() req: { user: { userId: string; schoolId: string | null; role: string } }, @Body() dto: CreateUserDto) {
    return this.usersService.createForSchool(req.user, dto);
  }

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.REGISTRAR, Role.TEACHER)
  list(
    @Req() req: { user: { userId: string; schoolId: string | null; role: string } },
    @Query() query: ListUsersQueryDto,
  ) {
    return this.usersService.listForSchool(req.user, query);
  }
}

import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DailyQuotaGuard } from '../usage/daily-quota.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // One-time setup only - see AuthService.bootstrapSuperAdmin for the
  // secret + already-exists checks that make this safe to leave deployed.
  @Post('bootstrap-admin')
  bootstrapAdmin(
    @Body() dto: BootstrapAdminDto,
    @Headers('x-bootstrap-secret') secret: string,
  ) {
    return this.authService.bootstrapSuperAdmin(dto, secret);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // DailyQuotaGuard MUST come after JwtAuthGuard - it reads request.user,
  // which JwtAuthGuard populates. Every future protected, tenant-scoped
  // route should follow this same guard order.
  @Get('me')
  @UseGuards(JwtAuthGuard, DailyQuotaGuard)
  me(@Req() req: any) {
    return req.user;
  }
}

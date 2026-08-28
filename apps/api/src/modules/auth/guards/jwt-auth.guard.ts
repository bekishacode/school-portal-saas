import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Marks a route as requiring a valid JWT. Use alongside RolesGuard
// (apps/api/src/common/guards) when a route also needs to restrict
// which roles can access it.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

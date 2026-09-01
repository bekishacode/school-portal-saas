//tenant.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Tenant isolation guard.
 *
 * Every authenticated user belongs to exactly one school (school_id),
 * except super_admin (you), who operates across tenants from the control plane.
 *
 * This guard confirms the authenticated user's school_id matches the
 * school_id being requested/mutated. Pair this with school_id filtering
 * in every repository query - this guard is a second line of defense,
 * not a substitute for scoping queries correctly.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    if (user.role === 'super_admin') return true;

    if (!user.schoolId) {
      throw new ForbiddenException('This action requires a school context');
    }

    const requestedSchoolId =
      request.params?.schoolId || request.body?.schoolId || request.query?.schoolId;

    if (requestedSchoolId && requestedSchoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-tenant access is not allowed');
    }

    return true;
  }
}

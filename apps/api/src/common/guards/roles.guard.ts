import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

/**
 * Enforces role-based access control server-side.
 * Never rely on the frontend hiding a button as your only protection -
 * every protected endpoint should declare its allowed roles with @Roles(...)
 * and this guard checks them here.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // no @Roles() decorator = open to any authenticated user

    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by the JWT auth guard/strategy
    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}

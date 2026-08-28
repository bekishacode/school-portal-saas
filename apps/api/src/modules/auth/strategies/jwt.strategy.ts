import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // user id
  schoolId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Fail loudly at startup rather than silently signing/verifying
      // tokens with 'undefined' as the secret.
      throw new Error('JWT_SECRET is not set - check your .env file');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Whatever this returns becomes `request.user` - shape matches what
  // RolesGuard and TenantGuard (apps/api/src/common/guards) expect.
  async validate(payload: JwtPayload) {
    // schoolId can legitimately be null (super_admin) - only sub and
    // role are required on every token.
    if (!payload?.sub || !payload?.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      userId: payload.sub,
      schoolId: payload.schoolId ?? null,
      role: payload.role,
    };
  }
}

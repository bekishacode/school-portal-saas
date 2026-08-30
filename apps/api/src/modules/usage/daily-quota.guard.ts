import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ApiUsage } from './api-usage.entity';
import { School } from '../schools/school.entity';

// Daily (not per-minute) API call limit, per school, based on subscription
// tier. Deliberately generous and simple at this stage - the goal is to
// stop one runaway script or bug from hammering the API all day, not to
// throttle normal usage.
const DAILY_LIMITS: Record<string, number> = {
  basic: Number(process.env.DAILY_API_LIMIT_BASIC ?? 2000),
  pro: Number(process.env.DAILY_API_LIMIT_PRO ?? 10000),
  enterprise: Number(process.env.DAILY_API_LIMIT_ENTERPRISE ?? 50000),
};

// IMPORTANT: this guard reads request.user, so it must be listed AFTER
// JwtAuthGuard in @UseGuards(JwtAuthGuard, DailyQuotaGuard) on each route -
// guards in the same array run in order, and this one depends on
// JwtAuthGuard having already populated request.user first.
@Injectable()
export class DailyQuotaGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiUsage) private readonly usageRepo: Repository<ApiUsage>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // No user (shouldn't happen if JwtAuthGuard ran first) or a
    // super_admin (platform-level, no schoolId, not subject to a
    // per-school quota) - skip the check entirely.
    if (!user?.schoolId) {
      return true;
    }

    const school = await this.schoolRepo.findOne({ where: { id: user.schoolId } });
    // Fail open rather than block legitimate traffic on a lookup miss -
    // this should be rare and isn't a security boundary.
    if (!school) {
      return true;
    }

    const limit = DAILY_LIMITS[school.subscriptionTier] ?? DAILY_LIMITS.basic;
    const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD

    // Atomic upsert-and-increment in one round trip, so concurrent
    // requests from the same school can't race past the limit.
    const result = await this.usageRepo.manager.query(
      `INSERT INTO api_usage (id, "schoolId", date, count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT ("schoolId", date)
       DO UPDATE SET count = api_usage.count + 1
       RETURNING count`,
      [randomUUID(), user.schoolId, today],
    );

    const currentCount = result[0].count;
    if (currentCount > limit) {
      throw new HttpException(
        'Daily API limit reached for your plan. Try again tomorrow, or upgrade your plan.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

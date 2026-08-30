import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiUsage } from './api-usage.entity';
import { School } from '../schools/school.entity';
import { DailyQuotaGuard } from './daily-quota.guard';

// Global so DailyQuotaGuard can be used in @UseGuards(...) from any
// controller without that controller's module needing to import this one.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApiUsage, School])],
  providers: [DailyQuotaGuard],
  exports: [TypeOrmModule, DailyQuotaGuard],
})
export class UsageModule {}

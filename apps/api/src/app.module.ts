import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { UsageModule } from './modules/usage/usage.module';

// Feature modules still to come: StudentsModule, AcademicModule, GradingModule ...

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 'npm run dev:api' (via --workspace) runs this from apps/api, where
      // there is no .env - the real one lives at the monorepo root. Check
      // both locations so this works whether run from the repo root or
      // from inside apps/api directly.
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // use migrations in production
      extra: {
        // Cheap, tenant-agnostic safety net: stops any single query or
        // forgotten open transaction (from any school) from hogging the
        // database indefinitely.
        statement_timeout: 30000, // 30s max per query
        idle_in_transaction_session_timeout: 60000, // 60s max idle-in-transaction
      },
    }),
    AuthModule,
    SchoolsModule,
    UsageModule,
  ],
})
export class AppModule {}

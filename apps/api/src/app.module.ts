import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature modules will be registered here as they're built:
// AuthModule, SchoolsModule, StudentsModule, AcademicModule, GradingModule ...

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 'npm run dev:api' runs this with cwd = apps/api, where there's no .env -
      // the real one lives at the monorepo root. Check both locations so this
      // works whether run from the repo root or from inside apps/api directly.
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // use migrations in production
    }),
  ],
})
export class AppModule {}

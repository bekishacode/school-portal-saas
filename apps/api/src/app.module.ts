import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';

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
    }),
    AuthModule,
    SchoolsModule,
  ],
})
export class AppModule {}

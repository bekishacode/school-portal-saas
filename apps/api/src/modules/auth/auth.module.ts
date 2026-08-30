import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from './entities/user.entity';
import { SchoolsModule } from '../schools/schools.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SchoolsModule,
    UsageModule,
    PassportModule,
    JwtModule.registerAsync({
      // useFactory defers reading process.env until Nest actually
      // instantiates this module, which happens after ConfigModule has
      // loaded .env - JwtModule.register({secret: process.env...}) would
      // read it synchronously at file-import time, BEFORE ConfigModule
      // runs, and silently get undefined.
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './school.entity';

// Exports TypeOrmModule so other modules (like AuthModule) can inject
// the School repository without duplicating the entity registration.
@Module({
  imports: [TypeOrmModule.forFeature([School])],
  exports: [TypeOrmModule],
})
export class SchoolsModule {}

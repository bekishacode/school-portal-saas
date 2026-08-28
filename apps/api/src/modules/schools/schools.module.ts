import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './school.entity';
import { User } from '../auth/entities/user.entity';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';

@Module({
  imports: [TypeOrmModule.forFeature([School, User])],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [TypeOrmModule, SchoolsService],
})
export class SchoolsModule {}

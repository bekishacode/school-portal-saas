import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { School } from './school.entity';
import { User } from '../auth/entities/user.entity';
import { CreateSchoolDto } from './dto/create-school.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  // Onboards a brand new school + its first school_admin, in one step.
  // Only ever called by a super_admin (enforced at the controller via
  // RolesGuard) - this is the replacement for the old public register.
  async createSchoolWithAdmin(dto: CreateSchoolDto) {
    const existingUsername = await this.userRepo.findOne({ where: { username: dto.adminUsername } });
    if (existingUsername) {
      throw new ConflictException('That username is already taken');
    }

    const existingEmail = await this.userRepo.findOne({ where: { email: dto.adminEmail } });
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const subdomain = this.slugify(dto.schoolName);

    const school = this.schoolRepo.create({
      name: dto.schoolName,
      subdomain,
      subscriptionTier: 'basic',
      isActive: true,
    });
    await this.schoolRepo.save(school);

    const passwordHash = await bcrypt.hash(dto.adminPassword, SALT_ROUNDS);
    const admin = this.userRepo.create({
      schoolId: school.id,
      role: 'school_admin',
      fullName: dto.adminFullName,
      username: dto.adminUsername,
      email: dto.adminEmail,
      phone: dto.adminPhone,
      passwordHash,
    });
    await this.userRepo.save(admin);

    return {
      school: { id: school.id, name: school.name, subdomain: school.subdomain },
      admin: { id: admin.id, fullName: admin.fullName, username: admin.username, email: admin.email },
    };
  }

  // Public - no auth. Returns ONLY branding info, used by an
  // unauthenticated tenant login page to style itself before anyone
  // has logged in. Never return anything sensitive here.
  async getPublicBySubdomain(subdomain: string) {
    const school = await this.schoolRepo.findOne({ where: { subdomain, isActive: true } });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return {
      id: school.id,
      name: school.name,
      subdomain: school.subdomain,
      logoUrl: school.logoUrl,
      coverImageUrl: school.coverImageUrl,
      brandColor: school.brandColor,
    };
  }

  private slugify(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }
}

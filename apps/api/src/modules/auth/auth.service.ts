import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { School } from '../schools/school.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    private readonly jwtService: JwtService,
  ) {}

  // Registers a brand new school AND its first admin user together -
  // this is the "sign up your school" entry point. Every subsequent
  // user (teacher, student, etc.) gets created BY a school_admin later,
  // not through this endpoint.
  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
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

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = this.userRepo.create({
      schoolId: school.id,
      role: 'school_admin',
      fullName: dto.fullName,
      email: dto.email,
      passwordHash,
    });
    await this.userRepo.save(user);

    return this.buildAuthResponse(user, school);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash') // passwordHash is select:false by default
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const school = await this.schoolRepo.findOne({ where: { id: user.schoolId } });
    return this.buildAuthResponse(user, school);
  }

  async findById(userId: string) {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  private buildAuthResponse(user: User, school: School | null) {
    const payload = { sub: user.id, schoolId: user.schoolId, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      school: school
        ? { id: school.id, name: school.name, subdomain: school.subdomain }
        : null,
    };
  }

  private slugify(name: string): string {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    // Append a short random suffix so two schools with similar names
    // (e.g. "Green Valley Academy" twice) don't collide on subdomain.
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${base}-${suffix}`;
  }
}

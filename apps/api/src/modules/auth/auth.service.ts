import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { School } from '../schools/school.entity';
import { LoginDto } from './dto/login.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(School) private readonly schoolRepo: Repository<School>,
    private readonly jwtService: JwtService,
  ) {}

  // One-time setup: creates the very first super_admin. Not JWT-protected
  // (no user exists yet to hold a token) - protected instead by a shared
  // secret from .env, and refuses to run again once any super_admin
  // already exists, so this can't be (ab)used as a backdoor later.
  async bootstrapSuperAdmin(dto: BootstrapAdminDto, providedSecret: string | undefined) {
    const expectedSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid or missing bootstrap secret');
    }

    const existingSuperAdmin = await this.userRepo.findOne({ where: { role: 'super_admin' } });
    if (existingSuperAdmin) {
      throw new ForbiddenException('A super_admin already exists - bootstrap can only run once');
    }

    const existingUsername = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('That username is already taken');
    }

    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({
      schoolId: null,
      role: 'super_admin',
      fullName: dto.fullName,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });
    await this.userRepo.save(user);

    return this.buildAuthResponse(user, null);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash') // passwordHash is select:false by default
      .where('user.username = :username', { username: dto.username })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        user.failedLoginAttempts = 0; // fresh 5 tries once the lock expires
      }
      await this.userRepo.save(user);
      throw new UnauthorizedException('Invalid username or password');
    }

    // Successful login clears any prior failed attempts/lock.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.userRepo.save(user);
    }

    // If the login attempt was made from a specific school's page (the
    // frontend resolves this from the subdomain and passes it along),
    // make sure this user actually belongs to that school. super_admin
    // has no schoolId and can log in from anywhere (e.g. the root domain).
    if (dto.schoolId && user.role !== 'super_admin' && user.schoolId !== dto.schoolId) {
      throw new UnauthorizedException('This account is not part of this school');
    }

    const school = user.schoolId
      ? await this.schoolRepo.findOne({ where: { id: user.schoolId } })
      : null;
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
        username: user.username,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      school: school
        ? { id: school.id, name: school.name, subdomain: school.subdomain }
        : null,
    };
  }
}

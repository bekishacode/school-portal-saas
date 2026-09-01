import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const SALT_ROUNDS = 10;

type Actor = { userId: string; schoolId: string | null; role: string };

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async createForSchool(actor: Actor, dto: CreateUserDto) {
    const schoolId = this.requireSchoolId(actor);

    const existingUsername = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('This username already exists');
    }

    const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({
      schoolId,
      role: dto.role,
      fullName: dto.fullName,
      username: dto.username,
      email: dto.email,
      phone: dto.phone,
      grade: dto.grade,
      section: dto.section,
      department: dto.department,
      passwordHash,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });
    await this.userRepo.save(user);

    const [publicUser] = await this.toPublicUsers([user]);
    return publicUser;
  }

  async listForSchool(actor: Actor, query: ListUsersQueryDto) {
    const schoolId = this.requireSchoolId(actor);

    const users = await this.userRepo.find({
      where: query.role ? { schoolId, role: query.role } : { schoolId },
      order: { fullName: 'ASC' },
    });

    return this.toPublicUsers(users);
  }

  private requireSchoolId(actor: Actor): string {
    if (!actor.schoolId) {
      throw new ForbiddenException('This action requires a school context');
    }
    return actor.schoolId;
  }

  private async toPublicUsers(users: User[]) {
    const actorIds = [
      ...new Set(
        users.flatMap((user) => [user.createdBy, user.updatedBy]).filter((id): id is string => Boolean(id)),
      ),
    ];
    const actors = actorIds.length
      ? await this.userRepo.find({ where: { id: In(actorIds) }, select: ['id', 'fullName'] })
      : [];
    const names = new Map(actors.map((actor) => [actor.id, actor.fullName]));

    return users.map((user) => ({
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone ?? null,
      grade: user.grade ?? null,
      section: user.section ?? null,
      department: user.department ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      createdBy: user.createdBy ? names.get(user.createdBy) ?? null : null,
      updatedBy: user.updatedBy ? names.get(user.updatedBy) ?? null : null,
    }));
  }
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { School } from '../../schools/school.entity';

export type Role =
  | 'super_admin'
  | 'school_admin'
  | 'registrar'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'librarian'
  | 'accountant';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nullable because super_admin (platform-level, manages all tenants)
  // does not belong to any single school. Every other role must have one.
  @Column({ nullable: true })
  schoolId: string | null;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'schoolId' })
  school: School | null;

  @Column({ type: 'varchar' })
  role: Role;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  // Never selected by default - must opt in with a query builder when
  // actually checking a password, so it never accidentally leaks into
  // an API response that returns a User object.
  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

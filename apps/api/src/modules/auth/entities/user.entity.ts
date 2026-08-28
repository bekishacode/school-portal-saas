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

  @Column()
  schoolId: string;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schoolId' })
  school: School;

  @Column({ type: 'varchar' })
  role: Role;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  // Never selected by default - must opt in with { select: true } when
  // actually checking a password, so it never accidentally leaks into
  // an API response that returns a User object.
  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

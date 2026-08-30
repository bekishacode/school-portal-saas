import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

// One row per school per calendar day. Incremented atomically on every
// authenticated request via DailyQuotaGuard.
@Entity('api_usage')
@Unique(['schoolId', 'date'])
export class ApiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  schoolId: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD, UTC

  @Column({ default: 0 })
  count: number;
}

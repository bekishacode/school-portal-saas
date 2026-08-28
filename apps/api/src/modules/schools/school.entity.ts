import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  brandColor?: string;

  @Column({ type: 'varchar', default: 'basic' })
  subscriptionTier: SubscriptionTier;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

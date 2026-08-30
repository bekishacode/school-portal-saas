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

  // Shown on the tenant login page's side panel. No upload UI yet
  // (that's a separate school-settings ticket) - falls back to a
  // brand-colored gradient when not set.
  @Column({ nullable: true })
  coverImageUrl?: string;

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

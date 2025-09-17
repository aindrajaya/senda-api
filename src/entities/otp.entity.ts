import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { AppAdmin } from './app-admin.entity';
import { OtpType } from '../common/enums';

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 6 })
  code: string;

  @Column({
    type: 'enum',
    enum: OtpType,
  })
  type: OtpType;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ nullable: true })
  usedAt: Date;

  // For regular users (customers and team members)
  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  // For app admins
  @ManyToOne(() => AppAdmin, (appAdmin) => appAdmin.otps, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'appAdminId' })
  appAdmin: AppAdmin;

  @Column({ nullable: true })
  appAdminId: string;

  // Contact information for sending OTP
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;
}


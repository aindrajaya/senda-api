import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('equalsmoney_accounts')
export class EqualsMoneyAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // EqualsMoney account details
  @Column({ nullable: true })
  equalsMoneyAccountId: string;

  @Column()
  accountType: string;

  @Column()
  businessLegalName: string;

  @Column()
  businessTradingName: string;

  @Column()
  businessDescription: string;

  @Column({ nullable: true })
  businessWebsite: string;

  @Column()
  businessAddress: string;

  @Column()
  businessCity: string;

  @Column({ nullable: true })
  businessState: string;

  @Column()
  businessPostcode: string;

  @Column()
  businessCountry: string;

  // Contact person details (will be linked to User entity)
  @Column()
  contactFirstName: string;

  @Column()
  contactLastName: string;

  @Column()
  contactEmail: string;

  @Column()
  contactPhone: string;

  @Column()
  contactJobTitle: string;

  @Column()
  contactAddress: string;

  @Column()
  contactCity: string;

  @Column({ nullable: true })
  contactState: string;

  @Column()
  contactPostcode: string;

  @Column()
  contactCountry: string;

  @Column()
  contactDateOfBirth: string;

  // KYC Information
  @Column({ nullable: true })
  kycDocumentType: string;

  @Column({ nullable: true })
  kycDocumentNumber: string;

  @Column()
  kycDocumentCountry: string;

  @Column({ nullable: true })
  kycDocumentExpiryDate: string;

  // EqualsMoney API Response
  @Column('text', { nullable: true })
  equalsMoneyResponse: string; // JSON string of the full API response

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: 'pending' })
  status: string; // pending, approved, rejected

  // Link to User entity
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

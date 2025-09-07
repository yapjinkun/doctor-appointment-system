import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Unique,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hospital } from '../../hospitals/entities/hospital.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  PATIENT = 'patient',
}

@Entity('users')
@Unique('unique_email_hospital', ['email', 'hospitalId'])
@Index('idx_users_email', ['email'])
@Index('idx_users_hospital', ['hospitalId'])
@Index('idx_users_role', ['role'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
  })
  role: UserRole;

  @Column({ type: 'varchar', length: 36, nullable: true })
  hospitalId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ type: 'datetime', nullable: true })
  passwordResetExpires: Date;

  @Column({ type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  lockedUntil: Date;

  // Relations
  @ManyToOne(() => Hospital, (hospital) => hospital.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @OneToOne(() => Staff, (staff) => staff.user)
  staffProfile: Staff;

  @OneToOne(() => Patient, (patient) => patient.user)
  patientProfile: Patient;

  // Methods
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  isAccountLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }
}

import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Hospital } from '../../hospitals/entities/hospital.entity';

export enum StaffPermission {
  MANAGE_DOCTORS = 'manage_doctors',
  MANAGE_APPOINTMENTS = 'manage_appointments',
  MANAGE_STAFF = 'manage_staff',
  MANAGE_HOSPITAL = 'manage_hospital',
  BOOK_ON_BEHALF = 'book_on_behalf',
  MANAGE_PATIENTS = 'manage_patients',
  CANCEL_APPOINTMENTS = 'cancel_appointments',
  MANAGE_SCHEDULES = 'manage_schedules',
}

@Entity('staff')
@Index('idx_staff_hospital', ['hospitalId'])
@Index('idx_staff_user', ['userId'])
export class Staff extends BaseEntity {
  @Column({ type: 'varchar', length: 36, unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  hospitalId: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  permissions: StaffPermission[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToOne(() => User, (user) => user.staffProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Hospital, (hospital) => hospital.staff, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  // Methods
  hasPermission(permission: StaffPermission): boolean {
    return this.permissions && this.permissions.includes(permission);
  }

  hasAnyPermission(permissions: StaffPermission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: StaffPermission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }
}

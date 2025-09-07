import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
}

export interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };
}

@Entity('hospitals')
@Index('idx_hospitals_active', ['isActive'])
@Index('idx_hospitals_name', ['name'])
export class Hospital extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'json', nullable: true })
  smtpConfig: SmtpConfig;

  @Column({ type: 'json', nullable: true })
  businessHours: BusinessHours;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToMany(() => User, (user) => user.hospital)
  users: User[];

  @OneToMany(() => Staff, (staff) => staff.hospital)
  staff: Staff[];

  @OneToMany(() => Patient, (patient) => patient.hospital)
  patients: Patient[];

  @OneToMany(() => Doctor, (doctor) => doctor.hospital)
  doctors: Doctor[];

  @OneToMany(() => Appointment, (appointment) => appointment.hospital)
  appointments: Appointment[];
}

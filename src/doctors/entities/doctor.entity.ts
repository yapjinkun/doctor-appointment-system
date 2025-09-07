import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hospital } from '../../hospitals/entities/hospital.entity';
import { DoctorSchedule } from '../../doctor-schedules/entities/doctor-schedule.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('doctors')
@Index('idx_doctors_hospital', ['hospital_id'])
@Index('idx_doctors_specialization', ['specialization'])
@Index('idx_doctors_name', ['name'])
@Check('chk_slot_duration', 'slot_duration_minutes > 0')
export class Doctor extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  hospital_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subSpecialization: string;

  @Column({ type: 'text', nullable: true })
  qualification: string;

  @Column({ type: 'int', nullable: true })
  experienceYears: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  @Column({ type: 'int', default: 30 })
  slotDurationMinutes: number;

  @Column({ type: 'int', default: 0 })
  bufferTimeMinutes: number;

  @Column({ type: 'int', nullable: true })
  maxAppointmentsPerDay: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'json', nullable: true })
  languagesSpoken: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Hospital, (hospital) => hospital.doctors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor)
  schedules: DoctorSchedule[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];
}

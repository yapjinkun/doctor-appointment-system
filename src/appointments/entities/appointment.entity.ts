import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  BeforeInsert,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Hospital } from '../../hospitals/entities/hospital.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  ROUTINE_CHECKUP = 'routine_checkup',
  VACCINATION = 'vaccination',
  TEST = 'test',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

@Entity('appointments')
@Index('idx_appointments_doctor_date', ['doctorId', 'appointmentDate'])
@Index('idx_appointments_patient', ['patientId'])
@Index('idx_appointments_hospital_date', ['hospitalId', 'appointmentDate'])
@Index('idx_appointments_status', ['status'])
@Index('idx_appointments_reminder', ['appointmentDate', 'reminderSent'])
@Index('idx_appointments_date_range', ['startTime', 'endTime'])
@Index('idx_appointments_number', ['appointmentNumber'])
@Check('chk_valid_appointment_times', 'end_time > start_time')
export class Appointment extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  hospitalId: string;

  @Column({ type: 'varchar', length: 36 })
  doctorId: string;

  @Column({ type: 'varchar', length: 36 })
  patientId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  appointmentNumber: string;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.CONSULTATION,
  })
  appointmentType: AppointmentType;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  cancelledBy: string | null;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  rescheduledFrom: string;

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ type: 'datetime', nullable: true })
  reminderSentAt: Date;

  @Column({ type: 'datetime', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'datetime', nullable: true })
  consultationStartedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  consultationEndedAt: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  bookedBy: string;

  // Relations
  @ManyToOne(() => Hospital, (hospital) => hospital.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cancelled_by' })
  canceller: User;

  @ManyToOne(() => Appointment, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rescheduled_from' })
  originalAppointment: Appointment;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booked_by' })
  booker: User;

  // Methods
  isUpcoming(): boolean {
    return (
      this.startTime > new Date() && this.status === AppointmentStatus.CONFIRMED
    );
  }

  isPast(): boolean {
    return this.endTime < new Date();
  }

  canBeCancelled(): boolean {
    return (
      [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(
        this.status,
      ) && this.startTime > new Date()
    );
  }

  getDuration(): number {
    return Math.floor(
      (this.endTime.getTime() - this.startTime.getTime()) / 60000,
    );
  }
}

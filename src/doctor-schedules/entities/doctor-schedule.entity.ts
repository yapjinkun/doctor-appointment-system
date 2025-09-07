import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

@Entity('doctor_schedules')
@Unique('unique_doctor_schedule', ['doctorId', 'dayOfWeek'])
@Index('idx_schedules_doctor', ['doctorId'])
@Index('idx_schedules_day', ['dayOfWeek'])
@Index('idx_schedules_doctor_day', ['doctorId', 'dayOfWeek'])
@Check('chk_day_of_week', 'day_of_week >= 0 AND day_of_week <= 6')
@Check('chk_valid_schedule_times', 'end_time > start_time')
export class DoctorSchedule extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  doctorId: string;

  @Column({ type: 'int' })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'time', nullable: true })
  breakStart: string;

  @Column({ type: 'time', nullable: true })
  breakEnd: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  maxAppointments: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => Doctor, (doctor) => doctor.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  // Methods
  isValidBreakTime(): boolean {
    if (!this.breakStart || !this.breakEnd) return true;
    return (
      this.breakEnd > this.breakStart &&
      this.breakStart >= this.startTime &&
      this.breakEnd <= this.endTime
    );
  }
}

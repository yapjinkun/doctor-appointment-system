import { Doctor } from '../entities/doctor.entity';
import { DoctorSchedule } from '../../doctor-schedules/entities/doctor-schedule.entity';

export interface DoctorAvailability {
  isAvailableToday: boolean;
  nextAvailableDate: string | null;
  todaySchedule: DoctorSchedule | null;
  weeklySchedule: DoctorSchedule[];
}

export interface DoctorWithAvailability extends Doctor {
  availability?: DoctorAvailability;
}

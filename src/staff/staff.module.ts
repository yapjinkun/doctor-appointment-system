import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { Staff } from './entities/staff.entity';
import { User } from '../users/entities/user.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { DoctorsService } from '../doctors/doctors.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { UsersService } from '../users/users.service';
import { DoctorSchedule } from '../doctor-schedules/entities/doctor-schedule.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Staff,
      User,
      Appointment,
      Doctor,
      Patient,
      DoctorSchedule,
      Hospital,
    ]),
    MailModule,
  ],
  controllers: [StaffController],
  providers: [
    StaffService,
    DoctorsService,
    DoctorSchedulesService,
    AppointmentsService,
    HospitalsService,
    UsersService,
  ],
  exports: [StaffService],
})
export class StaffModule {}

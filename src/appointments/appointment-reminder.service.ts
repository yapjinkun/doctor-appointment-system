import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { MailService } from '../mail/mail.service';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';
import { TimezoneService } from '../common/services/timezone.service';

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
    private mailService: MailService,
    private timezoneService: TimezoneService,
  ) {}

  // Run every hour to check for reminders across different timezones
  @Cron('0 * * * *', {
    name: 'appointment-reminders-timezone-aware',
  })
  async sendDailyReminders(): Promise<void> {
    this.logger.log('Starting timezone-aware appointment reminder job...');

    try {
      // Get all hospitals with their timezones
      const hospitals = await this.hospitalRepository.find({
        where: { isActive: true },
        select: ['id', 'name', 'timezone'],
      });

      let totalProcessed = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;

      for (const hospital of hospitals) {
        const timezone = hospital.timezone || 'UTC';
        const currentTimeInHospitalTimezone =
          this.timezoneService.getCurrentTimeInTimezone(timezone);

        // Check if it's 9:00 AM in this hospital's timezone (within the current hour)
        const hour = currentTimeInHospitalTimezone.getHours();
        if (hour === 9) {
          const appointments = await this.getAppointmentsForReminder(
            hospital.id,
            timezone,
          );
          this.logger.log(
            `Found ${appointments.length} appointments requiring reminders for hospital ${hospital.name} (${timezone})`,
          );

          if (appointments.length > 0) {
            const results = await Promise.allSettled(
              appointments.map((appointment) =>
                this.sendReminderForAppointment(appointment),
              ),
            );

            const successful = results.filter(
              (result) => result.status === 'fulfilled',
            ).length;
            const failed = results.filter(
              (result) => result.status === 'rejected',
            ).length;

            totalProcessed += appointments.length;
            totalSuccessful += successful;
            totalFailed += failed;

            this.logger.log(
              `Hospital ${hospital.name} (${timezone}): Successful: ${successful}, Failed: ${failed}`,
            );

            if (failed > 0) {
              const failedResults = results.filter(
                (result) => result.status === 'rejected',
              );
              failedResults.forEach((result, index) => {
                this.logger.error(
                  `Failed to send reminder ${index + 1} for hospital ${hospital.name}:`,
                  result.reason,
                );
              });
            }
          }
        }
      }

      this.logger.log(
        `Timezone-aware reminder job completed. Total processed: ${totalProcessed}, Successful: ${totalSuccessful}, Failed: ${totalFailed}`,
      );
    } catch (error) {
      this.logger.error(
        'Error in timezone-aware daily reminder job:',
        error.stack,
      );
    }
  }

  // Manual trigger for testing or admin use
  async sendRemindersManually(): Promise<{
    sent: number;
    failed: number;
    message: string;
  }> {
    this.logger.log('Manual reminder job triggered...');

    try {
      // For manual trigger, get all pending reminders across all hospitals
      const allAppointments = await this.getAllAppointmentsForReminder();

      if (allAppointments.length === 0) {
        return {
          sent: 0,
          failed: 0,
          message: 'No appointments found for tomorrow',
        };
      }

      const results = await Promise.allSettled(
        allAppointments.map((appointment) =>
          this.sendReminderForAppointment(appointment),
        ),
      );

      const successful = results.filter(
        (result) => result.status === 'fulfilled',
      ).length;
      const failed = results.filter(
        (result) => result.status === 'rejected',
      ).length;

      return {
        sent: successful,
        failed,
        message: `Processed ${allAppointments.length} appointments. Sent: ${successful}, Failed: ${failed}`,
      };
    } catch (error) {
      this.logger.error('Error in manual reminder job:', error.stack);
      throw error;
    }
  }

  private async getAppointmentsForReminder(
    hospitalId: string,
    timezone: string,
  ): Promise<Appointment[]> {
    // Get tomorrow's date range in the hospital's timezone
    const now = this.timezoneService.getCurrentTimeInTimezone(timezone);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { start: startOfTomorrow, end: endOfTomorrow } =
      this.timezoneService.getDayBounds(tomorrow, timezone);

    // Find appointments for tomorrow that haven't received reminders yet for this specific hospital
    const appointments = await this.appointmentRepository.find({
      where: {
        hospitalId,
        appointmentDate: Between(startOfTomorrow, endOfTomorrow),
        status: AppointmentStatus.CONFIRMED, // Only send reminders for confirmed appointments
        reminderSent: false, // Only send if reminder hasn't been sent yet
      },
      relations: ['patient', 'patient.user', 'doctor', 'hospital'],
      order: {
        startTime: 'ASC',
      },
    });

    return appointments;
  }

  private async getAllAppointmentsForReminder(): Promise<Appointment[]> {
    // Get tomorrow's date range (for all hospitals - used in manual trigger)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    // Find appointments for tomorrow that haven't received reminders yet
    const appointments = await this.appointmentRepository.find({
      where: {
        appointmentDate: Between(startOfTomorrow, endOfTomorrow),
        status: AppointmentStatus.CONFIRMED, // Only send reminders for confirmed appointments
        reminderSent: false, // Only send if reminder hasn't been sent yet
      },
      relations: ['patient', 'patient.user', 'doctor', 'hospital'],
      order: {
        startTime: 'ASC',
      },
    });

    return appointments;
  }

  private async sendReminderForAppointment(
    appointment: Appointment,
  ): Promise<void> {
    try {
      // Ensure we have all the required data
      let patient = appointment.patient;
      let doctor = appointment.doctor;
      let hospital = appointment.hospital;

      // If relations weren't loaded, fetch them manually
      if (!patient) {
        const foundPatient = await this.patientRepository.findOne({
          where: { id: appointment.patientId },
          relations: ['user'],
        });
        if (!foundPatient) {
          throw new Error(
            `Patient not found for appointment ${appointment.id}`,
          );
        }
        patient = foundPatient;
      }

      if (!doctor) {
        const foundDoctor = await this.doctorRepository.findOne({
          where: { id: appointment.doctorId },
        });
        if (!foundDoctor) {
          throw new Error(`Doctor not found for appointment ${appointment.id}`);
        }
        doctor = foundDoctor;
      }

      if (!hospital) {
        const foundHospital = await this.hospitalRepository.findOne({
          where: { id: appointment.hospitalId },
        });
        if (!foundHospital) {
          throw new Error(
            `Hospital not found for appointment ${appointment.id}`,
          );
        }
        hospital = foundHospital;
      }

      if (!patient.user || !patient.user.email) {
        throw new Error(`Patient ${patient.id} has no email address`);
      }

      // Send the reminder email
      await this.mailService.sendAppointmentReminder({
        appointment,
        patient,
        doctor,
        hospital,
      });

      // Mark reminder as sent
      await this.markReminderSent(appointment.id);

      this.logger.log(
        `Reminder sent successfully for appointment ${appointment.appointmentNumber} to ${patient.user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send reminder for appointment ${appointment.id}:`,
        error.message,
      );
      throw error;
    }
  }

  private async markReminderSent(appointmentId: string): Promise<void> {
    await this.appointmentRepository.update(appointmentId, {
      reminderSent: true,
      reminderSentAt: new Date(),
    });
  }

  // Method to get upcoming reminders (for admin dashboard)
  async getUpcomingReminders(days: number = 7): Promise<
    Array<{
      date: string;
      count: number;
      appointments: Appointment[];
    }>
  > {
    const result: Array<{
      date: string;
      count: number;
      appointments: Appointment[];
    }> = [];

    for (let i = 1; i <= days; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await this.appointmentRepository.find({
        where: {
          appointmentDate: Between(startOfDay, endOfDay),
          status: AppointmentStatus.CONFIRMED,
        },
        relations: ['patient', 'patient.user', 'doctor', 'hospital'],
        order: { startTime: 'ASC' },
      });

      result.push({
        date: targetDate.toISOString().split('T')[0],
        count: appointments.length,
        appointments,
      });
    }

    return result;
  }

  // Method to send reminder for specific appointment (manual trigger)
  async sendReminderForSpecificAppointment(
    appointmentId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['patient', 'patient.user', 'doctor', 'hospital'],
      });

      if (!appointment) {
        return { success: false, message: 'Appointment not found' };
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        return {
          success: false,
          message: 'Only confirmed appointments can receive reminders',
        };
      }

      if (appointment.reminderSent) {
        return {
          success: false,
          message: 'Reminder has already been sent for this appointment',
        };
      }

      await this.sendReminderForAppointment(appointment);

      return { success: true, message: 'Reminder sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send manual reminder for appointment ${appointmentId}:`,
        error.stack,
      );
      return {
        success: false,
        message: `Failed to send reminder: ${error.message}`,
      };
    }
  }
}

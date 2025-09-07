import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';

export interface AppointmentBookingEmailData {
  appointment: Appointment;
  patient: Patient;
  doctor: Doctor;
  hospital: Hospital;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  private async createHospitalTransporter(hospital: Hospital) {
    if (!hospital.smtpConfig) {
      this.logger.warn(`Hospital ${hospital.name} has no SMTP config, using default mailer`);
      return this.mailerService;
    }

    const transporter = nodemailer.createTransport({
      host: hospital.smtpConfig.host,
      port: hospital.smtpConfig.port,
      secure: hospital.smtpConfig.secure,
      auth: {
        user: hospital.smtpConfig.auth.user,
        pass: hospital.smtpConfig.auth.pass,
      },
    });

    return transporter;
  }

  private getFromAddress(hospital: Hospital): string {
    return hospital.smtpConfig?.from || hospital.email || `"${hospital.name}" <noreply@${hospital.name.toLowerCase().replace(/\s+/g, '')}.com>`;
  }

  private async renderTemplate(templateName: string, context: any): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    
    try {
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to render template ${templateName}`, error.stack);
      throw new Error(`Template rendering failed: ${templateName}`);
    }
  }

  async sendAppointmentConfirmation(data: AppointmentBookingEmailData) {
    const { appointment, patient, doctor, hospital } = data;

    try {
      const transporter = await this.createHospitalTransporter(hospital);
      const fromAddress = this.getFromAddress(hospital);

      const emailContext = {
        patientName: patient.user.fullName,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        hospitalName: hospital.name,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: this.formatDate(appointment.appointmentDate),
        appointmentTime: this.formatTime(appointment.startTime),
        appointmentEndTime: this.formatTime(appointment.endTime),
        appointmentType: this.formatAppointmentType(
          appointment.appointmentType,
        ),
        hospitalPhone: hospital.phone || 'N/A',
        hospitalAddress: this.formatHospitalAddress(hospital),
        bookingDate: this.formatDateTime(appointment.createdAt),
      };

      let result;
      
      if (hospital.smtpConfig && transporter !== this.mailerService) {
        // Use hospital-specific SMTP
        const htmlContent = await this.renderTemplate('appointment-confirmation', emailContext);
        
        result = await transporter.sendMail({
          from: fromAddress,
          to: patient.user.email,
          subject: `Appointment Confirmation - ${hospital.name}`,
          html: htmlContent,
        });
      } else {
        // Fallback to default mailer service
        result = await this.mailerService.sendMail({
          to: patient.user.email,
          subject: `Appointment Confirmation - ${hospital.name}`,
          template: 'appointment-confirmation',
          context: emailContext,
        });
      }

      this.logger.log(
        `Appointment confirmation email sent to ${patient.user.email} using ${hospital.smtpConfig ? 'hospital-specific' : 'default'} SMTP`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send appointment confirmation email to ${patient.user.email}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendAppointmentCancellation(
    data: AppointmentBookingEmailData,
    reason?: string,
  ) {
    const { appointment, patient, doctor, hospital } = data;

    try {
      const transporter = await this.createHospitalTransporter(hospital);
      const fromAddress = this.getFromAddress(hospital);

      const emailContext = {
        patientName: patient.user.fullName,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        hospitalName: hospital.name,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: this.formatDate(appointment.appointmentDate),
        appointmentTime: this.formatTime(appointment.startTime),
        cancellationReason: reason || 'No reason provided',
        cancelledAt: this.formatDateTime(appointment.cancelledAt),
        hospitalPhone: hospital.phone || 'N/A',
      };

      let result;
      
      if (hospital.smtpConfig && transporter !== this.mailerService) {
        // Use hospital-specific SMTP
        const htmlContent = await this.renderTemplate('appointment-cancellation', emailContext);
        
        result = await transporter.sendMail({
          from: fromAddress,
          to: patient.user.email,
          subject: `Appointment Cancelled - ${hospital.name}`,
          html: htmlContent,
        });
      } else {
        // Fallback to default mailer service
        result = await this.mailerService.sendMail({
          to: patient.user.email,
          subject: `Appointment Cancelled - ${hospital.name}`,
          template: 'appointment-cancellation',
          context: emailContext,
        });
      }

      this.logger.log(
        `Appointment cancellation email sent to ${patient.user.email} using ${hospital.smtpConfig ? 'hospital-specific' : 'default'} SMTP`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send appointment cancellation email to ${patient.user.email}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendAppointmentReminder(data: AppointmentBookingEmailData) {
    const { appointment, patient, doctor, hospital } = data;

    try {
      const transporter = await this.createHospitalTransporter(hospital);
      const fromAddress = this.getFromAddress(hospital);

      const emailContext = {
        patientName: patient.user.fullName,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        hospitalName: hospital.name,
        appointmentNumber: appointment.appointmentNumber,
        appointmentDate: this.formatDate(appointment.appointmentDate),
        appointmentTime: this.formatTime(appointment.startTime),
        hospitalPhone: hospital.phone || 'N/A',
        hospitalAddress: this.formatHospitalAddress(hospital),
      };

      let result;
      
      if (hospital.smtpConfig && transporter !== this.mailerService) {
        // Use hospital-specific SMTP
        const htmlContent = await this.renderTemplate('appointment-reminder', emailContext);
        
        result = await transporter.sendMail({
          from: fromAddress,
          to: patient.user.email,
          subject: `Appointment Reminder - Tomorrow at ${hospital.name}`,
          html: htmlContent,
        });
      } else {
        // Fallback to default mailer service
        result = await this.mailerService.sendMail({
          to: patient.user.email,
          subject: `Appointment Reminder - Tomorrow at ${hospital.name}`,
          template: 'appointment-reminder',
          context: emailContext,
        });
      }

      this.logger.log(
        `Appointment reminder email sent to ${patient.user.email} using ${hospital.smtpConfig ? 'hospital-specific' : 'default'} SMTP`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send appointment reminder email to ${patient.user.email}`,
        error.stack,
      );
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(date));
  }

  private formatAppointmentType(type: string): string {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatHospitalAddress(hospital: Hospital): string {
    const addressParts = [
      hospital.address,
      hospital.city,
      hospital.state,
      hospital.postalCode,
      hospital.country,
    ].filter(Boolean);

    return addressParts.join(', ') || 'Address not available';
  }
}

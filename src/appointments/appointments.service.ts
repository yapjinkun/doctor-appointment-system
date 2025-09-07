import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
} from './entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Hospital } from '../hospitals/entities/hospital.entity';
import {
  DoctorSchedule,
  DayOfWeek,
} from '../doctor-schedules/entities/doctor-schedule.entity';
import { MailService } from '../mail/mail.service';
import { TimezoneService } from '../common/services/timezone.service';

interface FindAllOptions {
  patientId?: string;
  doctorId?: string;
  hospitalId?: string;
  status?: string;
  date?: string;
  timezone?: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
    @InjectRepository(DoctorSchedule)
    private doctorScheduleRepository: Repository<DoctorSchedule>,
    private mailService: MailService,
    private timezoneService: TimezoneService,
  ) {}

  async bookAppointment(
    createAppointmentDto: CreateAppointmentDto,
    userId: string,
    timezone?: string,
  ): Promise<Appointment> {
    const {
      doctorId,
      hospitalId,
      startTime,
      endTime,
      appointmentDate,
      appointmentType = AppointmentType.CONSULTATION,
      bookedBy,
    } = createAppointmentDto;

    // Find patient by userId
    const patient = await this.patientRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException(
        'Patient profile not found for authenticated user',
      );
    }

    const hospitalRecord = await this.validateBookingData(
      doctorId,
      patient.id,
      hospitalId,
    );

    // Get the effective timezone (from request header, or hospital default)
    const effectiveTimezone = timezone || hospitalRecord.timezone || 'UTC';

    // Parse dates considering the timezone
    const startDateTime = this.timezoneService.parseDate(
      startTime,
      effectiveTimezone,
    );
    const endDateTime = this.timezoneService.parseDate(
      endTime,
      effectiveTimezone,
    );
    const appointmentDateObj = this.timezoneService.parseDate(
      appointmentDate,
      effectiveTimezone,
    );

    await this.validateTimeSlot(
      doctorId,
      startDateTime,
      endDateTime,
      effectiveTimezone,
    );

    const appointmentNumber = await this.generateAppointmentNumber();

    const appointment = this.appointmentRepository.create({
      doctorId,
      patientId: patient.id,
      hospitalId,
      appointmentNumber,
      appointmentDate: appointmentDateObj,
      startTime: startDateTime,
      endTime: endDateTime,
      appointmentType,
      status: AppointmentStatus.PENDING,
      bookedBy: bookedBy || userId,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Get complete data for email
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });

    // Send confirmation email asynchronously (only if all data is available)
    if (doctor && hospitalRecord) {
      this.sendConfirmationEmail(
        savedAppointment,
        patient,
        doctor,
        hospitalRecord,
      ).catch((error) => {
        // Log error but don't fail the booking process
        console.error('Failed to send confirmation email:', error);
      });
    }

    return savedAppointment;
  }

  async create(
    _createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    // For admin/staff creation, we need to handle this differently
    // This method should be used when patientId is provided directly in the DTO
    throw new BadRequestException(
      'Use bookAppointment for patient booking or implement admin creation logic',
    );
  }

  async findAll(options: FindAllOptions = {}): Promise<Appointment[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.hospital', 'hospital');

    if (options.patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', {
        patientId: options.patientId,
      });
    }

    if (options.doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', {
        doctorId: options.doctorId,
      });
    }

    if (options.hospitalId) {
      queryBuilder.andWhere('appointment.hospitalId = :hospitalId', {
        hospitalId: options.hospitalId,
      });
    }

    if (options.status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: options.status,
      });
    }

    if (options.date) {
      const date = new Date(options.date);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      queryBuilder.andWhere(
        'appointment.appointmentDate >= :date AND appointment.appointmentDate < :nextDay',
        {
          date: date.toISOString().split('T')[0],
          nextDay: nextDay.toISOString().split('T')[0],
        },
      );
    }

    return queryBuilder
      .orderBy('appointment.appointmentDate', 'ASC')
      .addOrderBy('appointment.startTime', 'ASC')
      .getMany();
  }

  async findByPatient(patientId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor', 'hospital'],
      order: {
        appointmentDate: 'DESC',
        startTime: 'DESC',
      },
    });
  }

  async findByDoctor(doctorId: string): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: { doctorId },
      relations: ['patient', 'hospital'],
      order: {
        appointmentDate: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async getAvailableSlots(
    doctorId: string,
    date: string,
    hospitalId?: string,
    timezone?: string,
  ): Promise<string[]> {
    const [doctor, hospital] = await Promise.all([
      this.doctorRepository.findOne({ where: { id: doctorId } }),
      hospitalId
        ? this.hospitalRepository.findOne({ where: { id: hospitalId } })
        : null,
    ]);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get the effective timezone (from request header, hospital, or doctor's hospital)
    let effectiveTimezone = timezone;
    if (!effectiveTimezone && hospital) {
      effectiveTimezone = hospital.timezone;
    }
    if (!effectiveTimezone && doctor.hospital_id) {
      const doctorHospital = await this.hospitalRepository.findOne({
        where: { id: doctor.hospital_id },
      });
      effectiveTimezone = doctorHospital?.timezone;
    }
    effectiveTimezone = effectiveTimezone || 'UTC';

    // Parse the date in the hospital's timezone
    const appointmentDate = this.timezoneService.parseDate(
      date,
      effectiveTimezone,
    );
    const dayOfWeek = appointmentDate.getDay() as DayOfWeek;

    // Get doctor's schedule for the given day
    const schedule = await this.doctorScheduleRepository.findOne({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!schedule) {
      return []; // Doctor is not available on this day
    }

    // Get day bounds in the hospital's timezone
    const { start: startOfDay, end: endOfDay } =
      this.timezoneService.getDayBounds(appointmentDate, effectiveTimezone);

    const existingAppointments = await this.appointmentRepository.find({
      where: {
        doctorId,
        appointmentDate: Between(startOfDay, endOfDay),
        status: In([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]),
      },
      select: ['startTime', 'endTime'],
    });

    // Generate available slots based on doctor's schedule
    const availableSlots = this.generateSlotsFromSchedule(
      schedule,
      date,
      existingAppointments,
      effectiveTimezone,
    );

    return availableSlots;
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['doctor', 'patient', 'hospital', 'booker', 'canceller'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    return await this.appointmentRepository.save(appointment);
  }

  async cancelAppointment(
    id: string,
    reason?: string,
    cancelledBy?: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    if (!appointment.canBeCancelled()) {
      throw new BadRequestException('Appointment cannot be cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason || null;
    appointment.cancelledBy = cancelledBy || null;
    appointment.cancelledAt = new Date();

    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Send cancellation email asynchronously
    this.sendCancellationEmail(savedAppointment, reason).catch((error) => {
      // Log error but don't fail the cancellation process
      console.error('Failed to send cancellation email:', error);
    });

    return savedAppointment;
  }

  async remove(id: string): Promise<void> {
    const result = await this.appointmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Appointment not found');
    }
  }

  private async validateBookingData(
    doctorId: string,
    patientId: string,
    hospitalId: string,
  ): Promise<Hospital> {
    const [doctor, patient, hospital] = await Promise.all([
      this.doctorRepository.findOne({ where: { id: doctorId } }),
      this.patientRepository.findOne({ where: { id: patientId } }),
      this.hospitalRepository.findOne({ where: { id: hospitalId } }),
    ]);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return hospital;
  }

  private async validateTimeSlot(
    doctorId: string,
    startTime: Date,
    endTime: Date,
    timezone: string,
  ): Promise<void> {
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Compare with current time in the given timezone
    const currentTimeInTimezone =
      this.timezoneService.getCurrentTimeInTimezone(timezone);
    if (startTime <= currentTimeInTimezone) {
      throw new BadRequestException('Appointment time must be in the future');
    }

    const conflictingAppointment = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
      })
      .andWhere(
        '(appointment.startTime < :endTime AND appointment.endTime > :startTime)',
        { startTime, endTime },
      )
      .getOne();

    if (conflictingAppointment) {
      throw new ConflictException('Time slot is not available');
    }
  }

  private async generateAppointmentNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const count = await this.appointmentRepository.count({
      where: {
        appointmentDate: Between(
          new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        ),
      },
    });

    return `APT${dateStr}${(count + 1).toString().padStart(4, '0')}`;
  }

  private generateSlotsFromSchedule(
    schedule: DoctorSchedule,
    date: string,
    existingAppointments: Appointment[],
    timezone: string,
  ): string[] {
    const slots: string[] = [];
    const slotDuration = 30; // 30 minutes per slot

    // Parse schedule times
    const scheduleStart = this.timeStringToMinutes(schedule.startTime);
    const scheduleEnd = this.timeStringToMinutes(schedule.endTime);
    const breakStart = schedule.breakStart
      ? this.timeStringToMinutes(schedule.breakStart)
      : null;
    const breakEnd = schedule.breakEnd
      ? this.timeStringToMinutes(schedule.breakEnd)
      : null;

    // Generate all possible slots
    for (
      let minutes = scheduleStart;
      minutes < scheduleEnd;
      minutes += slotDuration
    ) {
      // Skip break time slots
      if (
        breakStart &&
        breakEnd &&
        minutes >= breakStart &&
        minutes < breakEnd
      ) {
        continue;
      }

      const timeStr = this.minutesToTimeString(minutes);
      const slotDateTime = this.timezoneService.parseDate(
        `${date}T${timeStr}:00`,
        timezone,
      );

      // Check if slot is already booked
      const isBooked = existingAppointments.some((appointment) => {
        return (
          slotDateTime >= appointment.startTime &&
          slotDateTime < appointment.endTime
        );
      });

      // Only include if not booked and in the future (considering timezone)
      const currentTimeInTimezone =
        this.timezoneService.getCurrentTimeInTimezone(timezone);
      if (!isBooked && slotDateTime > currentTimeInTimezone) {
        slots.push(timeStr);
      }
    }

    return slots;
  }

  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private async sendConfirmationEmail(
    appointment: Appointment,
    patient: Patient,
    doctor: Doctor,
    hospital: Hospital,
  ): Promise<void> {
    try {
      await this.mailService.sendAppointmentConfirmation({
        appointment,
        patient,
        doctor,
        hospital,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  private async sendCancellationEmail(
    appointment: Appointment,
    reason?: string,
  ): Promise<void> {
    try {
      // Get full data needed for email
      const [patient, doctor, hospital] = await Promise.all([
        this.patientRepository.findOne({
          where: { id: appointment.patientId },
          relations: ['user'],
        }),
        this.doctorRepository.findOne({ where: { id: appointment.doctorId } }),
        this.hospitalRepository.findOne({
          where: { id: appointment.hospitalId },
        }),
      ]);

      if (!patient || !doctor || !hospital) {
        throw new Error('Required data not found for cancellation email');
      }

      await this.mailService.sendAppointmentCancellation(
        {
          appointment,
          patient,
          doctor,
          hospital,
        },
        reason,
      );
    } catch (error) {
      console.error('Cancellation email sending failed:', error);
      throw error;
    }
  }
}

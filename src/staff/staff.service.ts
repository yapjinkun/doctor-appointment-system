import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff, StaffPermission } from './entities/staff.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/entities/appointment.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private usersService: UsersService,
  ) {}

  async create(createStaffDto: CreateStaffDto): Promise<Staff> {
    // Create user first
    const user = await this.usersService.create({
      email: createStaffDto.email,
      password: createStaffDto.password,
      role: UserRole.STAFF,
      hospitalId: createStaffDto.hospitalId,
      firstName: createStaffDto.firstName,
      lastName: createStaffDto.lastName,
      phone: createStaffDto.phone,
      avatarUrl: createStaffDto.avatarUrl,
      isActive: createStaffDto.isActive ?? true,
    });

    // Create staff profile linked to the user
    const staff = this.staffRepository.create({
      userId: user.id,
      hospitalId: createStaffDto.hospitalId,
      permissions: createStaffDto.permissions || [],
      isActive: createStaffDto.isActive ?? true,
    });

    return this.staffRepository.save(staff);
  }

  async findAll(userId: string, hospitalId?: string): Promise<Staff[]> {
    const currentStaff = await this.findByUserId(userId);
    const targetHospitalId = hospitalId || currentStaff.hospitalId;

    // Staff can only view staff from their own hospital
    if (targetHospitalId !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    return this.staffRepository.find({
      where: { hospitalId: targetHospitalId },
      relations: ['user', 'hospital'],
    });
  }

  async findOne(id: string, userId: string): Promise<Staff> {
    const currentStaff = await this.findByUserId(userId);
    const staff = await this.staffRepository.findOne({
      where: { id },
      relations: ['user', 'hospital'],
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (staff.hospitalId !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    return staff;
  }

  async findByUserId(userId: string): Promise<Staff> {
    const staff = await this.staffRepository.findOne({
      where: { userId },
      relations: ['user', 'hospital'],
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    return staff;
  }

  async update(
    id: string,
    updateStaffDto: UpdateStaffDto,
    userId: string,
  ): Promise<Staff> {
    const staff = await this.findOne(id, userId);
    Object.assign(staff, updateStaffDto);
    return this.staffRepository.save(staff);
  }

  async remove(id: string, userId: string): Promise<void> {
    const staff = await this.findOne(id, userId);
    await this.staffRepository.remove(staff);
  }

  async checkPermission(
    userId: string,
    requiredPermission: StaffPermission,
  ): Promise<void> {
    const staff = await this.findByUserId(userId);

    if (!staff.hasPermission(requiredPermission)) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermission}`,
      );
    }
  }

  async validateHospitalAccess(
    userId: string,
    getHospitalId: (entityId: string) => Promise<string>,
    entityId: string,
  ): Promise<void> {
    const staff = await this.findByUserId(userId);
    const entityHospitalId = await getHospitalId(entityId);

    if (staff.hospitalId !== entityHospitalId) {
      throw new ForbiddenException(
        'Cannot access resources from other hospitals',
      );
    }
  }

  // ============ PATIENT MANAGEMENT METHODS ============
  async getPatients(userId: string, search?: string): Promise<Patient[]> {
    const staff = await this.findByUserId(userId);
    const query = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .where('patient.hospitalId = :hospitalId', {
        hospitalId: staff.hospitalId,
      });

    if (search) {
      query.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    return query.getMany();
  }

  async getPatient(patientId: string, userId: string): Promise<Patient> {
    const staff = await this.findByUserId(userId);
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['user', 'hospital'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.hospitalId !== staff.hospitalId) {
      throw new ForbiddenException('Cannot access patient from other hospital');
    }

    return patient;
  }

  async getPatientAppointments(
    patientId: string,
    userId: string,
  ): Promise<Appointment[]> {
    await this.getPatient(patientId, userId); // Validates access

    return this.appointmentRepository.find({
      where: { patientId },
      relations: ['doctor', 'doctor.user', 'hospital'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
  }

  // ============ APPOINTMENT MANAGEMENT METHODS ============
  async rescheduleAppointment(
    appointmentId: string,
    rescheduleData: {
      newDate: string;
      newStartTime: string;
      newEndTime: string;
      reason?: string;
    },
    userId: string,
  ): Promise<Appointment> {
    const staff = await this.findByUserId(userId);
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['hospital'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.hospitalId !== staff.hospitalId) {
      throw new ForbiddenException(
        'Cannot modify appointment from other hospital',
      );
    }

    // Update appointment with new schedule
    appointment.appointmentDate = new Date(rescheduleData.newDate);
    appointment.startTime = new Date(rescheduleData.newStartTime);
    appointment.endTime = new Date(rescheduleData.newEndTime);
    appointment.status = AppointmentStatus.RESCHEDULED;

    return this.appointmentRepository.save(appointment);
  }
}

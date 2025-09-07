import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './entities/hospital.entity';
import { User } from '../users//entities/user.entity';
import { Staff, StaffPermission } from '../staff//entities/staff.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Repository } from 'typeorm';
import * as generator from 'generate-password';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(Hospital)
    private hospitalsRepository: Repository<Hospital>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,

    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
  ) {}

  async create(createHospitalDto: CreateHospitalDto) {
    // Extract admin email and remove it from hospital data
    const { adminEmail, ...hospitalData } = createHospitalDto;

    // Create hospital with proper type conversion
    const newHospital = this.hospitalsRepository.create({
      ...hospitalData,
      // Convert BusinessHoursDto to BusinessHours format if needed
      businessHours: hospitalData.businessHours as any,
      smtpConfig: hospitalData.smtpConfig as any,
      settings: hospitalData.settings as any,
    });

    const savedHospital = await this.hospitalsRepository.save(newHospital);

    const password = generator.generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
    });

    const newUser = this.usersRepository.create({
      email: adminEmail,
      hospitalId: savedHospital.id,
      role: 'staff' as any,
      password: password,
    });

    const savedUser = await this.usersRepository.save(newUser);

    const allPermissions = Object.values(StaffPermission);
    const newStaff = this.staffRepository.create({
      userId: savedUser.id,
      hospitalId: savedHospital.id,
      permissions: allPermissions,
    });

    const savedStaff = await this.staffRepository.save(newStaff);

    return {
      hospital: savedHospital,
      staff: {
        id: savedStaff.id,
        email: savedUser.email,
        password: password,
      },
    };
  }

  findAll(): Promise<Hospital[]> {
    return this.hospitalsRepository.find();
  }

  findOne(id: string): Promise<Hospital | null> {
    return this.hospitalsRepository.findOneBy({ id });
  }

  async update(
    id: string,
    updateHospitalDto: UpdateHospitalDto,
  ): Promise<Hospital> {
    const { adminEmail, ...hospitalData } = updateHospitalDto;

    // Convert DTO types to entity types if needed
    const updateData = {
      ...hospitalData,
      businessHours: hospitalData.businessHours as any,
      smtpConfig: hospitalData.smtpConfig as any,
      settings: hospitalData.settings as any,
    };

    await this.hospitalsRepository.update(id, updateData);

    const updatedHospital = await this.hospitalsRepository.findOneBy({ id });
    if (!updatedHospital) {
      throw new NotFoundException('Hospital not found');
    }

    return updatedHospital;
  }

  async remove(id: string): Promise<void> {
    await this.hospitalsRepository.delete(id);
  }

  async getHospitalDoctors(hospitalId: string): Promise<Doctor[]> {
    const hospital = await this.hospitalsRepository.findOneBy({
      id: hospitalId,
    });
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    return this.doctorsRepository.find({
      where: { hospital_id: hospitalId },
      relations: ['schedules'],
      select: {
        id: true,
        name: true,
        specialization: true,
        subSpecialization: true,
        qualification: true,
        experienceYears: true,
        email: true,
        phone: true,
        bio: true,
        languagesSpoken: true,
        isActive: true,
        schedules: true,
      },
    });
  }

  async getDoctorAvailableSlots(
    hospitalId: string,
    doctorId: string,
  ): Promise<any> {
    const hospital = await this.hospitalsRepository.findOneBy({
      id: hospitalId,
    });
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId, hospital_id: hospitalId },
      relations: ['schedules'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found in this hospital');
    }

    // This is a simplified implementation. In a real system, you'd calculate available slots
    // based on doctor schedules, existing appointments, and business logic
    const availableSlots = {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
      },
      hospital: {
        id: hospital.id,
        name: hospital.name,
      },
      schedules: doctor.schedules,
      message:
        'Available time slots would be calculated based on schedules and existing appointments',
    };

    return availableSlots;
  }
}

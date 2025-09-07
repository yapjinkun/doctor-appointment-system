import { Injectable, NotFoundException,ForbiddenException } from '@nestjs/common';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './entities/doctor.entity';
import {
  DoctorSchedule,
  DayOfWeek,
} from '../doctor-schedules/entities/doctor-schedule.entity';
import { DoctorAvailability } from './interfaces/doctor-with-availability.interface';
import { StaffService } from '../staff/staff.service';

interface FindAllOptions {
  specialization?: string;
  includeSchedules?: boolean;
}

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,
    @InjectRepository(DoctorSchedule)
    private readonly _unused: Repository<DoctorSchedule>, // Available for future use
    private staffService: StaffService,
  ) {}

  async create(createDoctorDto: CreateDoctorDto, userId: string) {
    const currentStaff = await this.staffService.findByUserId(userId);

    if (createDoctorDto.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }
    const newDoctor = this.doctorsRepository.create(createDoctorDto);
    const savedDoctor = await this.doctorsRepository.save(newDoctor);
    return savedDoctor;
  }

  async findAll(options: FindAllOptions = {}) {
    const queryBuilder = this.doctorsRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.hospital', 'hospital')
      .where('doctor.isActive = :isActive', { isActive: true });

    if (options.specialization) {
      queryBuilder.andWhere('doctor.specialization = :specialization', {
        specialization: options.specialization,
      });
    }

    if (options.includeSchedules) {
      queryBuilder.leftJoinAndSelect('doctor.schedules', 'schedules');
    }

    return queryBuilder.orderBy('doctor.name', 'ASC').getMany();
  }

  async findByHospital(hospitalId: string, includeSchedules?: boolean) {
    const queryBuilder = this.doctorsRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.hospital', 'hospital')
      .where('doctor.hospital_id = :hospitalId', { hospitalId })
      .andWhere('doctor.isActive = :isActive', { isActive: true });

    if (includeSchedules) {
      queryBuilder.leftJoinAndSelect('doctor.schedules', 'schedules');
    }

    return queryBuilder
      .orderBy('doctor.specialization', 'ASC')
      .addOrderBy('doctor.name', 'ASC')
      .getMany();
  }

  async findByHospitalWithProfiles(
    hospitalId: string,
    includeAvailability: boolean = true,
  ): Promise<(Doctor & { availability?: DoctorAvailability })[]> {
    const doctors = await this.doctorsRepository.find({
      where: {
        hospital_id: hospitalId,
        isActive: true,
      },
      relations: ['hospital', 'schedules'],
      order: {
        specialization: 'ASC',
        name: 'ASC',
      },
    });

    if (!includeAvailability) {
      return doctors;
    }

    // Add availability information for each doctor
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doctor) => {
        const availability = await this.calculateDoctorAvailability(doctor);
        return Object.assign(doctor, { availability });
      }),
    );

    return doctorsWithAvailability;
  }

  async findOne(id: string, includeSchedules: boolean = false) {
    const queryBuilder = this.doctorsRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.hospital', 'hospital')
      .where('doctor.id = :id', { id });

    if (includeSchedules) {
      queryBuilder.leftJoinAndSelect('doctor.schedules', 'schedules');
    }

    const doctor = await queryBuilder.getOne();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async getDoctorAvailability(doctorId: string) {
    const doctor = await this.doctorsRepository.findOne({
      where: { id: doctorId },
      relations: ['schedules'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const availability = await this.calculateDoctorAvailability(doctor);

    return {
      doctorId,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      ...availability,
    };
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto, userId: string) {
    const doctor = await this.doctorsRepository.findOneBy({ id });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const currentStaff = await this.staffService.findByUserId(userId);

    if (doctor.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    Object.assign(doctor, updateDoctorDto);
    return this.doctorsRepository.save(doctor);
  }

  async remove(id: string, userId: string) {
    const doctor = await this.doctorsRepository.findOneBy({id});
    
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const currentStaff = await this.staffService.findByUserId(userId);

    if (doctor.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    const result = await this.doctorsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Doctor not found');
    }

    return { message: 'Doctor deleted successfully' };
  }

  private async calculateDoctorAvailability(doctor: Doctor) {
    const today = new Date();
    const currentDayOfWeek = today.getDay() as DayOfWeek;

    // Get today's schedule
    const todaySchedule =
      doctor.schedules.find(
        (schedule) =>
          schedule.dayOfWeek === currentDayOfWeek && schedule.isActive,
      ) || null;

    const isAvailableToday = todaySchedule !== null;

    // Find next available date
    let nextAvailableDate: string | null = null;

    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dayOfWeek = checkDate.getDay() as DayOfWeek;

      const hasSchedule = doctor.schedules.some(
        (schedule) => schedule.dayOfWeek === dayOfWeek && schedule.isActive,
      );

      if (hasSchedule) {
        nextAvailableDate = checkDate.toISOString().split('T')[0];
        break;
      }
    }

    // Get complete weekly schedule
    const weeklySchedule = doctor.schedules
      .filter((schedule) => schedule.isActive)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return {
      isAvailableToday,
      nextAvailableDate,
      todaySchedule,
      weeklySchedule,
    };
  }
}

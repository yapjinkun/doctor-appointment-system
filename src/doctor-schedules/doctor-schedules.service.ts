import {
  ConflictException,
  NotFoundException,
  Injectable,
  ForbiddenException
} from '@nestjs/common';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class DoctorSchedulesService {
  constructor(
    @InjectRepository(Doctor)
    private doctorsRepository: Repository<Doctor>,

    @InjectRepository(DoctorSchedule)
    private scheduleRepository: Repository<DoctorSchedule>,

    private staffService: StaffService,
  ) {}

  async create(createDoctorScheduleDto: CreateDoctorScheduleDto, userId: string) {
    const existingDoctor = await this.doctorsRepository.findOne({
      where: {
        id: createDoctorScheduleDto.doctorId,
      },
    });

    if (!existingDoctor) {
      throw new NotFoundException(`Doctor not exists`);
    }

    const currentStaff = await this.staffService.findByUserId(userId);
    
    if (existingDoctor.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    const existingSchedule = await this.scheduleRepository.findOne({
      where: {
        doctorId: createDoctorScheduleDto.doctorId,
        dayOfWeek: createDoctorScheduleDto.dayOfWeek,
      },
    });

    if (existingSchedule) {
      throw new ConflictException(
        `Schedule already exists for this doctor on ${this.getDayName(createDoctorScheduleDto.dayOfWeek)}`,
      );
    }

    const schedule = this.scheduleRepository.create(createDoctorScheduleDto);
    return await this.scheduleRepository.save(schedule);
  }

  async findAll(doctorId: string) {
    const existingDoctor = await this.doctorsRepository.findOne({
      where: {
        id: doctorId,
      },
    });

    if (!existingDoctor) {
      throw new NotFoundException(`Doctor not exists`);
    }
    return await this.scheduleRepository.find({
      where: { doctorId },
      relations: ['doctor'],
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['doctor'],
    });
    
    if (!schedule) {
      throw new NotFoundException('Doctor schedule not found');
    }
    
    return schedule;
  }

  async update(id: string, updateDoctorScheduleDto: UpdateDoctorScheduleDto, userId: string) {
    const schedule = (await this.scheduleRepository.findOneBy({
      id,
    })) as DoctorSchedule;
    if (!schedule) {
      throw new NotFoundException(`Schedule not exists`);
    }

    const existingDoctor = await this.doctorsRepository.findOne({
      where: {
        id: schedule.doctorId,
      },
    });

    if (!existingDoctor) {
      throw new NotFoundException(`Invalid schedule`);
    }
    const currentStaff = await this.staffService.findByUserId(userId);
    
    if (existingDoctor.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    updateDoctorScheduleDto = Object.assign(schedule, updateDoctorScheduleDto);
    return await this.scheduleRepository.save(updateDoctorScheduleDto);
  }

  async remove(id: string, userId: string) {
    const schedule = (await this.scheduleRepository.findOneBy({
      id,
    })) as DoctorSchedule;
    if (!schedule) {
      throw new NotFoundException(`Schedule not exists`);
    }
    
    const existingDoctor = await this.doctorsRepository.findOne({
      where: {
        id: schedule.doctorId,
      },
    });

    if (!existingDoctor) {
      throw new NotFoundException(`Invalid schedule`);
    }
    const currentStaff = await this.staffService.findByUserId(userId);
    
    if (existingDoctor.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot access staff from other hospitals');
    }

    return await this.scheduleRepository.delete(id);
  }

  async createMultiple(
    doctorId: string,
    schedules: Omit<CreateDoctorScheduleDto, 'doctorId'>[],
  ): Promise<DoctorSchedule[]> {
    const scheduleEntities = schedules.map((schedule) =>
      this.scheduleRepository.create({ ...schedule, doctorId }),
    );

    return await this.scheduleRepository.save(scheduleEntities);
  }

  private getDayName(dayOfWeek: number): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayOfWeek];
  }
}

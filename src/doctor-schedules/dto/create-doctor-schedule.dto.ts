// create-doctor-schedule.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  Matches,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export class CreateDoctorScheduleDto {
  @ApiProperty({ example: 'uuid-doctor-id', description: 'Doctor ID' })
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @ApiProperty({
    example: 1,
    description:
      'Day of week (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)',
    enum: DayOfWeek,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    example: '09:00:00',
    description: 'Start time in HH:mm:ss format',
  })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:mm:ss format',
  })
  startTime: string;

  @ApiProperty({
    example: '17:00:00',
    description: 'End time in HH:mm:ss format',
  })
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:mm:ss format',
  })
  endTime: string;

  @ApiPropertyOptional({
    example: '12:00:00',
    description: 'Break start time in HH:mm:ss format',
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Break start time must be in HH:mm:ss format',
  })
  breakStart?: string;

  @ApiPropertyOptional({
    example: '13:00:00',
    description: 'Break end time in HH:mm:ss format',
  })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Break end time must be in HH:mm:ss format',
  })
  breakEnd?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the schedule is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum appointments for this schedule',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxAppointments?: number;

  @ApiPropertyOptional({
    example: 'Cardiology consultation hours',
    description: 'Notes about the schedule',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

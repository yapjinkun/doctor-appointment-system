import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentType } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'Hospital ID where the appointment will take place',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID('4')
  hospitalId: string;

  @ApiProperty({
    description: 'Doctor ID for the appointment',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsUUID('4')
  doctorId: string;

  @ApiProperty({
    description: 'Date of the appointment',
    example: '2024-01-15',
  })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({
    description: 'Start time of the appointment',
    example: '2024-01-15T09:00:00.000Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'End time of the appointment',
    example: '2024-01-15T09:30:00.000Z',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    description: 'Type of appointment',
    enum: AppointmentType,
    example: AppointmentType.CONSULTATION,
  })
  @IsEnum(AppointmentType)
  @IsOptional()
  appointmentType?: AppointmentType;

  @ApiProperty({
    description: 'ID of the user booking the appointment (optional)',
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false,
  })
  @IsString()
  @IsUUID('4')
  @IsOptional()
  bookedBy?: string;
}

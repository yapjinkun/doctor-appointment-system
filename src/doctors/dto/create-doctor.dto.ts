import { IsEmail, IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({
    description: 'Hospital UUID where the doctor works',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  hospital_id: string;

  @ApiProperty({
    description: 'Doctor full name',
    example: 'Dr. John Smith',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Doctor medical specialization',
    example: 'Cardiology',
  })
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({
    description: 'Doctor qualifications and certifications',
    example: 'MD, FACC, Board Certified Cardiologist',
  })
  @IsNotEmpty()
  qualification: string;

  @ApiProperty({
    description: 'Doctor email address',
    example: 'dr.smith@hospital.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Doctor phone number',
    example: '+1-555-0123',
  })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Duration of each appointment slot in minutes',
    example: 30,
    minimum: 15,
    maximum: 120,
  })
  @IsNumber()
  slotDurationMinutes: number;
}

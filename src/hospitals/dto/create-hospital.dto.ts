import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsObject,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SmtpConfigDto {
  @ApiProperty({
    description: 'SMTP server hostname',
    example: 'smtp.gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({
    description: 'SMTP server port number',
    example: 587,
  })
  @IsNotEmpty()
  port: number;

  @ApiProperty({
    description: 'Whether to use secure connection (SSL/TLS)',
    example: true,
  })
  @IsBoolean()
  secure: boolean;

  @ApiProperty({
    description: 'Authentication credentials for SMTP server',
    example: {
      user: 'hospital@example.com',
      pass: 'app-password',
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  auth: {
    user: string;
    pass: string;
  };

  @ApiPropertyOptional({
    description: 'Default sender email address',
    example: 'noreply@hospital.com',
  })
  @IsOptional()
  @IsString()
  from?: string;
}

export class BusinessHoursDto {
  @ApiPropertyOptional({
    description: 'Monday business hours',
    example: {
      open: '09:00',
      close: '17:00',
      breaks: [{ start: '12:00', end: '13:00' }],
    },
  })
  @IsOptional()
  @IsObject()
  monday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };

  @ApiPropertyOptional({
    description: 'Tuesday business hours',
    example: {
      open: '09:00',
      close: '17:00',
      breaks: [{ start: '12:00', end: '13:00' }],
    },
  })
  @IsOptional()
  @IsObject()
  tuesday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };

  @ApiPropertyOptional({
    description: 'Wednesday business hours',
    example: {
      open: '09:00',
      close: '17:00',
      breaks: [{ start: '12:00', end: '13:00' }],
    },
  })
  @IsOptional()
  @IsObject()
  wednesday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };

  @ApiPropertyOptional({
    description: 'Thursday business hours',
    example: {
      open: '09:00',
      close: '17:00',
      breaks: [{ start: '12:00', end: '13:00' }],
    },
  })
  @IsOptional()
  @IsObject()
  thursday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };

  @ApiPropertyOptional({
    description: 'Friday business hours',
    example: {
      open: '09:00',
      close: '17:00',
      breaks: [{ start: '12:00', end: '13:00' }],
    },
  })
  @IsOptional()
  @IsObject()
  friday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };

  @ApiPropertyOptional({
    description: 'Saturday business hours',
    example: {
      open: '09:00',
      close: '14:00',
    },
  })
  @IsOptional()
  @IsObject()
  saturday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };

  @ApiPropertyOptional({
    description: 'Sunday business hours',
    example: {
      open: '10:00',
      close: '16:00',
    },
  })
  @IsOptional()
  @IsObject()
  sunday?: {
    open: string;
    close: string;
    breaks?: Array<{ start: string; end: string }>;
  };
}

export class CreateHospitalDto {
  @ApiProperty({
    description: 'Hospital name',
    example: 'City General Hospital',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Hospital address',
    example: '123 Main Street, Medical District',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City where hospital is located',
    example: 'New York',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province where hospital is located',
    example: 'New York',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Country where hospital is located',
    example: 'United States',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '10001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Hospital phone number',
    example: '+1-555-0123',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Hospital email address',
    example: 'info@cityhospital.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'Hospital website URL',
    example: 'https://www.cityhospital.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @ApiPropertyOptional({
    description: 'Hospital timezone',
    example: 'America/New_York',
    default: 'UTC',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'SMTP configuration for hospital email system',
    type: SmtpConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpConfigDto)
  smtpConfig?: SmtpConfigDto;

  @ApiPropertyOptional({
    description: 'Hospital business hours for each day of the week',
    type: BusinessHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto;

  @ApiPropertyOptional({
    description: 'Additional hospital settings',
    example: { appointmentDuration: 30, maxAdvanceBookingDays: 90 },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL to hospital logo image',
    example: 'https://cdn.example.com/hospital-logo.png',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the hospital is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Admin email address for hospital setup',
    example: 'admin@cityhospital.com',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  adminEmail?: string;
}

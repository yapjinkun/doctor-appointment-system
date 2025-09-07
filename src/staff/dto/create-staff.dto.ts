import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StaffPermission } from '../entities/staff.entity';

export class CreateStaffDto {
  @ApiProperty({
    description: 'Hospital ID where the staff member will work',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  hospitalId: string;

  @ApiProperty({
    description: 'Staff permissions array',
    enum: StaffPermission,
    isArray: true,
    required: false,
    example: [StaffPermission.MANAGE_APPOINTMENTS, StaffPermission.BOOK_ON_BEHALF],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(StaffPermission, { each: true })
  permissions?: StaffPermission[];

  @ApiProperty({
    description: 'Whether the staff member is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // User creation fields
  @ApiProperty({
    description: 'Staff member email address',
    example: 'staff@hospital.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Staff member password',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Staff member first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    description: 'Staff member last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'Staff member phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    description: 'Staff member avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}

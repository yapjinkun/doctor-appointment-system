import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { AuthGuard } from '../auth/auth.guard';
import { DoctorHospitalPermissionsGuard } from '../auth/doctor-hospital-permissions.guard';
import { RequireHospitalPermissions } from '../auth/hospital-permissions.decorator';
import { StaffPermission } from '../staff/entities/staff.entity';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator';

@ApiTags('doctors')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, DoctorHospitalPermissionsGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @RequireHospitalPermissions(StaffPermission.MANAGE_DOCTORS)
  @ApiOperation({ summary: 'Create a new doctor' })
  @ApiResponse({
    status: 201,
    description: 'Doctor has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid doctor data provided.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Doctor with this email already exists.',
  })
  create(@Body() createDoctorDto: CreateDoctorDto, @CurrentUser() user: JwtPayload) {
    return this.doctorsService.create(createDoctorDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all doctors' })
  @ApiQuery({
    name: 'hospitalId',
    required: false,
    description: 'Filter doctors by hospital ID',
  })
  @ApiQuery({
    name: 'specialization',
    required: false,
    description: 'Filter doctors by specialization',
  })
  @ApiQuery({
    name: 'includeSchedules',
    required: false,
    type: Boolean,
    description: 'Include doctor schedules in response',
  })
  @ApiResponse({
    status: 200,
    description: 'List of doctors retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found (when hospitalId is provided).',
  })
  findAll(
    @Query('hospitalId') hospitalId?: string,
    @Query('specialization') specialization?: string,
    @Query('includeSchedules') includeSchedules?: boolean,
  ) {
    if (hospitalId) {
      return this.doctorsService.findByHospital(hospitalId, includeSchedules);
    }
    return this.doctorsService.findAll({ specialization, includeSchedules });
  }

  @Get('hospital/:hospitalId')
  @ApiOperation({
    summary: 'Get doctors by hospital with full profiles and availability',
  })
  @ApiParam({ name: 'hospitalId', description: 'Hospital ID' })
  @ApiQuery({
    name: 'includeAvailability',
    required: false,
    type: Boolean,
    description: 'Include current availability status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of doctors with profiles and availability',
  })
  findByHospitalWithProfiles(
    @Param('hospitalId') hospitalId: string,
    @Query('includeAvailability') includeAvailability: boolean = true,
  ) {
    return this.doctorsService.findByHospitalWithProfiles(
      hospitalId,
      includeAvailability,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiQuery({
    name: 'includeSchedules',
    required: false,
    type: Boolean,
    description: 'Include doctor schedules',
  })
  @ApiResponse({
    status: 200,
    description: 'Doctor details retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor not found.',
  })
  findOne(
    @Param('id') id: string,
    @Query('includeSchedules') includeSchedules: boolean = false,
  ) {
    return this.doctorsService.findOne(id, includeSchedules);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get doctor availability for the next 7 days' })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor availability information retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor not found.',
  })
  getAvailability(@Param('id') id: string) {
    return this.doctorsService.getDoctorAvailability(id);
  }

  @Patch(':id')
  @RequireHospitalPermissions(StaffPermission.MANAGE_DOCTORS)
  @ApiOperation({ summary: 'Update doctor information' })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data provided.',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor not found.',
  })
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto, @CurrentUser() user: JwtPayload) {
    return this.doctorsService.update(id, updateDoctorDto, user.id);
  }

  @Delete(':id')
  @RequireHospitalPermissions(StaffPermission.MANAGE_DOCTORS)
  @ApiOperation({ summary: 'Delete doctor' })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete doctor with existing appointments.',
  })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.doctorsService.remove(id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new hospital' })
  @ApiResponse({
    status: 201,
    description: 'Hospital has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid hospital data provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 409,
    description: 'Hospital with this name or email already exists.',
  })
  create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalsService.create(createHospitalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hospitals (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of all hospitals retrieved successfully.',
  })
  findAll() {
    return this.hospitalsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hospital by ID (Public)' })
  @ApiParam({ name: 'id', description: 'Hospital UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Hospital details retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found.',
  })
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @Get(':id/doctors')
  @ApiOperation({ summary: 'Get available doctors for hospital (Public)' })
  @ApiParam({ name: 'id', description: 'Hospital UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Hospital doctors retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found.',
  })
  getHospitalDoctors(@Param('id') id: string) {
    return this.hospitalsService.getHospitalDoctors(id);
  }

  @Get(':id/doctors/:doctorId/available-slots')
  @ApiOperation({
    summary: 'Get available time slots for hospital doctor (Public)',
  })
  @ApiParam({ name: 'id', description: 'Hospital UUID', type: 'string' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Available time slots retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital or doctor not found.',
  })
  getHospitalDoctorSlots(
    @Param('id') hospitalId: string,
    @Param('doctorId') doctorId: string,
  ) {
    return this.hospitalsService.getDoctorAvailableSlots(hospitalId, doctorId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update hospital details' })
  @ApiParam({ name: 'id', description: 'Hospital UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Hospital has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data provided.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found.',
  })
  update(
    @Param('id') id: string,
    @Body() updateHospitalDto: UpdateHospitalDto,
  ) {
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete hospital' })
  @ApiParam({ name: 'id', description: 'Hospital UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Hospital has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete hospital with associated data.',
  })
  remove(@Param('id') id: string) {
    return this.hospitalsService.remove(id);
  }
}

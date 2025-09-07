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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Register new patient',
    description: 'Create a new patient account with user profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient account created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid patient data provided.',
  })
  @ApiResponse({
    status: 404,
    description: 'Hospital not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Patient with this email already exists.',
  })
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all patients',
    description: 'Retrieve list of all patients (Admin/Staff only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of patients retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Staff access required.',
  })
  findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get patient by ID',
    description: 'Retrieve patient details by patient ID',
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Patient details retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found.',
  })
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update patient information',
    description: 'Update patient profile and personal information',
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Patient has been successfully updated.',
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
    status: 403,
    description: 'Forbidden - Can only update own profile.',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found.',
  })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete patient account',
    description: 'Permanently delete patient account and associated data',
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Patient account has been successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Patient not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete patient with active appointments.',
  })
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { DoctorsService } from '../doctors/doctors.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreateDoctorDto } from '../doctors/dto/create-doctor.dto';
import { UpdateDoctorDto } from '../doctors/dto/update-doctor.dto';
import { CreateDoctorScheduleDto } from '../doctor-schedules/dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from '../doctor-schedules/dto/update-doctor-schedule.dto';
import { CreateAppointmentDto } from '../appointments/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../appointments/dto/update-appointment.dto';
import { UpdateHospitalDto } from '../hospitals/dto/update-hospital.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator';
import { StaffPermission } from './entities/staff.entity';

@ApiTags('staff')
@Controller('staff')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class StaffController {
  constructor(
    private readonly staffService: StaffService,
    private readonly doctorsService: DoctorsService,
    private readonly doctorSchedulesService: DoctorSchedulesService,
    private readonly appointmentsService: AppointmentsService,
    private readonly hospitalsService: HospitalsService,
  ) {}

  // ============ STAFF MANAGEMENT ============
  @Post()
  @ApiOperation({
    summary: 'Create new staff member (requires MANAGE_STAFF permission)',
  })
  @ApiResponse({
    status: 201,
    description: 'Staff member created successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_STAFF,
    );
    
    // Ensure staff can only create staff for their own hospital
    const currentStaff = await this.staffService.findByUserId(user.id);
    if (createStaffDto.hospitalId !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot create staff for other hospitals');
    }
    
    return this.staffService.create(createStaffDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all staff members in hospital (requires MANAGE_STAFF permission)',
  })
  @ApiQuery({
    name: 'hospitalId',
    required: false,
    description: 'Filter by hospital ID',
  })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('hospitalId') hospitalId?: string,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_STAFF,
    );
    return this.staffService.findAll(user.id, hospitalId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get staff member by ID (requires MANAGE_STAFF permission)',
  })
  @ApiParam({ name: 'id', description: 'Staff member UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Staff member details retrieved successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_STAFF,
    );
    return this.staffService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update staff member (requires MANAGE_STAFF permission)',
  })
  @ApiParam({ name: 'id', description: 'Staff member UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Staff member updated successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_STAFF,
    );
    return this.staffService.update(id, updateStaffDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove staff member (requires MANAGE_STAFF permission)',
  })
  @ApiParam({ name: 'id', description: 'Staff member UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Staff member removed successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_STAFF,
    );
    return this.staffService.remove(id, user.id);
  }

  // ============ DOCTOR MANAGEMENT ============
  @Post('doctors')
  @ApiOperation({
    summary: 'Add new doctor (requires MANAGE_DOCTORS permission)',
  })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  async createDoctor(
    @Body() createDoctorDto: CreateDoctorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_DOCTORS,
    );
    
    // Ensure staff can only create doctors for their own hospital
    const currentStaff = await this.staffService.findByUserId(user.id);
    if (createDoctorDto.hospital_id !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot create doctors for other hospitals');
    }
    
    return this.doctorsService.create(createDoctorDto, user.id);
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors in hospital' })
  @ApiQuery({
    name: 'specialization',
    required: false,
    description: 'Filter by specialization',
  })
  @ApiQuery({
    name: 'includeSchedules',
    required: false,
    type: Boolean,
    description: 'Include schedules',
  })
  async getDoctors(
    @CurrentUser() user: JwtPayload,
    @Query('specialization') specialization?: string,
    @Query('includeSchedules') includeSchedules?: boolean,
  ) {
    const staff = await this.staffService.findByUserId(user.id);
    return this.doctorsService.findByHospital(
      staff.hospitalId,
      includeSchedules,
    );
  }

  @Get('doctors/:id')
  @ApiOperation({ summary: 'Get doctor details with availability' })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor details retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getDoctor(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.staffService.validateHospitalAccess(
      user.id,
      async (doctorId) => {
        const doctor = await this.doctorsService.findOne(doctorId, true);
        return doctor.hospital_id;
      },
      id,
    );
    return this.doctorsService.findOne(id, true);
  }

  @Patch('doctors/:id')
  @ApiOperation({
    summary: 'Update doctor (requires MANAGE_DOCTORS permission)',
  })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor updated successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async updateDoctor(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_DOCTORS,
    );
    await this.staffService.validateHospitalAccess(
      user.id,
      async (doctorId) => {
        const doctor = await this.doctorsService.findOne(doctorId, false);
        return doctor.hospital_id;
      },
      id,
    );
    return this.doctorsService.update(id, updateDoctorDto, user.id);
  }

  @Delete('doctors/:id')
  @ApiOperation({
    summary: 'Remove doctor (requires MANAGE_DOCTORS permission)',
  })
  @ApiParam({ name: 'id', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor removed successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async removeDoctor(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_DOCTORS,
    );
    await this.staffService.validateHospitalAccess(
      user.id,
      async (doctorId) => {
        const doctor = await this.doctorsService.findOne(doctorId, false);
        return doctor.hospital_id;
      },
      id,
    );
    return this.doctorsService.remove(id, user.id);
  }

  // ============ DOCTOR SCHEDULE MANAGEMENT ============
  @Post('doctors/:doctorId/schedules')
  @ApiOperation({
    summary: 'Create doctor schedule (requires MANAGE_SCHEDULES permission)',
  })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Doctor schedule created successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async createDoctorSchedule(
    @Param('doctorId') doctorId: string,
    @Body() createScheduleDto: CreateDoctorScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_SCHEDULES,
    );
    await this.staffService.validateHospitalAccess(
      user.id,
      async (dId) => {
        const doctor = await this.doctorsService.findOne(dId, false);
        return doctor.hospital_id;
      },
      doctorId,
    );
    createScheduleDto.doctorId = doctorId;
    return this.doctorSchedulesService.create(createScheduleDto, user.id);
  }

  @Get('doctors/:doctorId/schedules')
  @ApiOperation({ summary: 'Get doctor schedules by day of week' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedules retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async getDoctorSchedules(
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.validateHospitalAccess(
      user.id,
      async (dId) => {
        const doctor = await this.doctorsService.findOne(dId, false);
        return doctor.hospital_id;
      },
      doctorId,
    );
    return this.doctorSchedulesService.findAll(doctorId);
  }

  @Patch('schedules/:id')
  @ApiOperation({
    summary: 'Update doctor schedule (requires MANAGE_SCHEDULES permission)',
  })
  @ApiParam({ name: 'id', description: 'Schedule UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedule updated successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async updateDoctorSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateDoctorScheduleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_SCHEDULES,
    );
    return this.doctorSchedulesService.update(id, updateScheduleDto, user.id);
  }

  @Delete('schedules/:id')
  @ApiOperation({
    summary: 'Delete doctor schedule (requires MANAGE_SCHEDULES permission)',
  })
  @ApiParam({ name: 'id', description: 'Schedule UUID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedule deleted successfully.',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async removeDoctorSchedule(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_SCHEDULES,
    );
    return this.doctorSchedulesService.remove(id, user.id);
  }

  // ============ APPOINTMENT MANAGEMENT ============
  @Post('appointments/book')
  @ApiOperation({
    summary:
      'Book appointment on behalf of patient (requires BOOK_ON_BEHALF permission)',
  })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  async bookAppointmentOnBehalf(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.BOOK_ON_BEHALF,
    );
    
    // Ensure staff can only book appointments for their own hospital
    const currentStaff = await this.staffService.findByUserId(user.id);
    if (createAppointmentDto.hospitalId !== currentStaff.hospitalId) {
      throw new ForbiddenException('Cannot book appointments for other hospitals');
    }
    
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get('appointments')
  @ApiOperation({
    summary:
      'Get appointments in hospital (requires MANAGE_APPOINTMENTS permission)',
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    description: 'Filter by doctor',
  })
  @ApiQuery({
    name: 'patientId',
    required: false,
    description: 'Filter by patient',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter by date (YYYY-MM-DD)',
  })
  async getAppointments(
    @CurrentUser() user: JwtPayload,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_APPOINTMENTS,
    );
    const staff = await this.staffService.findByUserId(user.id);
    return this.appointmentsService.findAll({
      hospitalId: staff.hospitalId,
      doctorId,
      patientId,
      status,
      date,
    });
  }

  @Get('appointments/doctor/:doctorId/schedule')
  @ApiOperation({
    summary:
      'View doctor-wise appointment schedules (requires MANAGE_APPOINTMENTS permission)',
  })
  @ApiParam({ name: 'doctorId', description: 'Doctor ID' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Specific date (YYYY-MM-DD)',
  })
  async getDoctorAppointmentSchedule(
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: JwtPayload,
    @Query('date') date?: string,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_APPOINTMENTS,
    );
    await this.staffService.validateHospitalAccess(
      user.id,
      async (dId) => {
        const doctor = await this.doctorsService.findOne(dId, false);
        return doctor.hospital?.id || '';
      },
      doctorId,
    );

    return this.appointmentsService.findByDoctor(doctorId);
  }

  @Patch('appointments/:id/cancel')
  @ApiOperation({
    summary: 'Cancel any appointment (requires CANCEL_APPOINTMENTS permission)',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  async cancelAppointment(
    @Param('id') id: string,
    @Body() cancelData: { reason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.CANCEL_APPOINTMENTS,
    );
    return this.appointmentsService.cancelAppointment(
      id,
      cancelData.reason,
      user.id,
    );
  }

  // ============ HOSPITAL MANAGEMENT ============
  @Get('hospital')
  @ApiOperation({ summary: 'Get current hospital details' })
  async getHospital(@CurrentUser() user: JwtPayload) {
    const staff = await this.staffService.findByUserId(user.id);
    return this.hospitalsService.findOne(staff.hospitalId);
  }

  @Patch('hospital')
  @ApiOperation({
    summary: 'Update hospital details (requires MANAGE_HOSPITAL permission)',
  })
  async updateHospital(
    @Body() updateHospitalDto: UpdateHospitalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_HOSPITAL,
    );
    const staff = await this.staffService.findByUserId(user.id);
    return this.hospitalsService.update(staff.hospitalId, updateHospitalDto);
  }

  // ============ PATIENT MANAGEMENT ============
  @Get('patients')
  @ApiOperation({
    summary:
      'Get all patients in hospital (requires MANAGE_PATIENTS permission)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search patients by name or email',
  })
  async getPatients(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_PATIENTS,
    );
    return this.staffService.getPatients(user.id, search);
  }

  @Get('patients/:id')
  @ApiOperation({
    summary: 'Get patient details (requires MANAGE_PATIENTS permission)',
  })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async getPatient(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_PATIENTS,
    );
    return this.staffService.getPatient(id, user.id);
  }

  @Get('patients/:id/appointments')
  @ApiOperation({
    summary:
      'Get patient appointment history (requires MANAGE_PATIENTS permission)',
  })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async getPatientAppointments(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_PATIENTS,
    );
    return this.staffService.getPatientAppointments(id, user.id);
  }

  // ============ APPOINTMENT ADVANCED MANAGEMENT ============
  @Patch('appointments/:id/status')
  @ApiOperation({
    summary:
      'Update appointment status (requires MANAGE_APPOINTMENTS permission)',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() statusData: { status: string; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_APPOINTMENTS,
    );
    const updateData = new UpdateAppointmentDto();
    // You may need to add status field to UpdateAppointmentDto or handle this differently
    return this.appointmentsService.update(id, updateData);
  }

  @Post('appointments/:id/reschedule')
  @ApiOperation({
    summary: 'Reschedule appointment (requires MANAGE_APPOINTMENTS permission)',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body()
    rescheduleData: {
      newDate: string;
      newStartTime: string;
      newEndTime: string;
      reason?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.staffService.checkPermission(
      user.id,
      StaffPermission.MANAGE_APPOINTMENTS,
    );
    return this.staffService.rescheduleAppointment(id, rescheduleData, user.id);
  }

  // ============ PERMISSIONS AND PROFILE ============
  @Get('permissions')
  @ApiOperation({ summary: 'Get current staff permissions' })
  async getMyPermissions(@CurrentUser() user: JwtPayload) {
    const staff = await this.staffService.findByUserId(user.id);
    return {
      permissions: staff.permissions || [],
      hospitalId: staff.hospitalId,
      user: {
        id: staff.user.id,
        email: staff.user.email,
        firstName: staff.user.firstName,
        lastName: staff.user.lastName,
        role: staff.user.role,
      },
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current staff profile' })
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.staffService.findByUserId(user.id);
  }
}

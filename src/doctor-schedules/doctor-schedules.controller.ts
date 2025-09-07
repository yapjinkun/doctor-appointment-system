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
import { DoctorSchedulesService } from './doctor-schedules.service';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { AuthGuard } from '../auth/auth.guard';
import { ScheduleHospitalPermissionsGuard } from '../auth/schedule-hospital-permissions.guard';
import { RequireHospitalPermissions } from '../auth/hospital-permissions.decorator';
import { StaffPermission } from '../staff/entities/staff.entity';
import { CurrentUser, type JwtPayload } from '../auth/current-user.decorator';
import { userInfo } from 'os';

@ApiTags('Doctor Schedules')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, ScheduleHospitalPermissionsGuard)
@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}

  @Post()
  @RequireHospitalPermissions(StaffPermission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Create a new doctor schedule' })
  @ApiResponse({
    status: 201,
    description: 'Doctor schedule created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid schedule data' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  create(@Body() createDoctorScheduleDto: CreateDoctorScheduleDto, @CurrentUser() user: JwtPayload) {
    return this.doctorSchedulesService.create(createDoctorScheduleDto, user.id);
  }

  @ApiOperation({ summary: 'Get doctor schedules' })
  @ApiQuery({
    name: 'doctorId',
    description: 'Doctor ID to filter schedules',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedules retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @Get()
  findAll(@Query('doctorId') doctorId: string) {
    return this.doctorSchedulesService.findAll(doctorId);
  }

  @ApiOperation({ summary: 'Get doctor schedule by ID' })
  @ApiParam({ name: 'id', description: 'Doctor Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedule retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Doctor schedule not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorSchedulesService.findOne(id);
  }

  @Patch(':id')
  @RequireHospitalPermissions(StaffPermission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Update doctor schedule' })
  @ApiParam({ name: 'id', description: 'Doctor Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedule updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Doctor schedule not found' })
  @ApiResponse({ status: 400, description: 'Invalid schedule data' })
  update(
    @Param('id') id: string,
    @Body() updateDoctorScheduleDto: UpdateDoctorScheduleDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.doctorSchedulesService.update(id, updateDoctorScheduleDto, user.id);
  }

  @Delete(':id')
  @RequireHospitalPermissions(StaffPermission.MANAGE_SCHEDULES)
  @ApiOperation({ summary: 'Delete doctor schedule' })
  @ApiParam({ name: 'id', description: 'Doctor Schedule ID' })
  @ApiResponse({
    status: 200,
    description: 'Doctor schedule deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Doctor schedule not found' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.doctorSchedulesService.remove(id, user.id);
  }
}

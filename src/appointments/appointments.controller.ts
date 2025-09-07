import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AppointmentReminderService } from './appointment-reminder.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';
import type { RequestWithTimezone } from '../common/middleware/timezone.middleware';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly reminderService: AppointmentReminderService,
  ) {}

  @Post('book')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Book a new appointment as a patient' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid booking data or time slot unavailable',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Patient authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Doctor, patient, or hospital not found',
  })
  async bookAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: RequestWithTimezone,
  ) {
    return this.appointmentsService.bookAppointment(
      createAppointmentDto,
      user.id,
      req.timezone,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new appointment (admin)' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAll({
      patientId,
      doctorId,
      hospitalId,
      status,
      date,
    });
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get appointments for a specific patient' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.appointmentsService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  @ApiOperation({ summary: 'Get appointments for a specific doctor' })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.appointmentsService.findByDoctor(doctorId);
  }

  @Get('doctor/:doctorId/available-slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor' })
  getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
    @Req() req: RequestWithTimezone,
    @Query('hospitalId') hospitalId?: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      doctorId,
      date,
      hospitalId,
      req.timezone,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update appointment' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel appointment' })
  cancel(
    @Param('id') id: string,
    @Body() cancelData: { reason?: string; cancelledBy: string },
  ) {
    return this.appointmentsService.cancelAppointment(
      id,
      cancelData.reason,
      cancelData.cancelledBy,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  // Reminder Management Endpoints
  @Post('reminders/send')
  @ApiOperation({
    summary: "Manually trigger reminder emails for tomorrow's appointments",
  })
  @ApiResponse({ status: 200, description: 'Reminder job completed' })
  async sendRemindersManually() {
    return this.reminderService.sendRemindersManually();
  }

  @Post(':id/reminder')
  @ApiOperation({ summary: 'Send reminder email for specific appointment' })
  @ApiResponse({ status: 200, description: 'Reminder sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot send reminder (already sent, not confirmed, etc.)',
  })
  async sendReminderForAppointment(@Param('id') id: string) {
    return this.reminderService.sendReminderForSpecificAppointment(id);
  }

  @Get('reminders/upcoming')
  @ApiOperation({
    summary: 'Get upcoming appointments that will receive reminders',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead (default: 7)',
  })
  async getUpcomingReminders(@Query('days') days: number = 7) {
    return this.reminderService.getUpcomingReminders(days);
  }
}

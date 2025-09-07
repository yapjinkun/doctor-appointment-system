import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StaffPermission } from '../staff/entities/staff.entity';
import { StaffService } from '../staff/staff.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { HOSPITAL_PERMISSIONS_KEY } from './hospital-permissions.decorator';

@Injectable()
export class ScheduleHospitalPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private staffService: StaffService,
    private doctorSchedulesService: DoctorSchedulesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      StaffPermission[]
    >(HOSPITAL_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get staff profile
    const staffProfile = await this.staffService.findByUserId(user.id);
    if (!staffProfile) {
      throw new ForbiddenException(
        'Access denied. Staff profile required for this operation.',
      );
    }

    // Check if staff has required permissions
    const hasPermissions = requiredPermissions.every((permission) =>
      staffProfile.hasPermission(permission),
    );

    if (!hasPermissions) {
      throw new ForbiddenException(
        `Access denied. Required permission(s): ${requiredPermissions.join(', ')}`,
      );
    }

    // Check hospital scope for schedule operations
    await this.validateScheduleHospitalScope(request, staffProfile.hospitalId);

    return true;
  }

  private async validateScheduleHospitalScope(
    request: any,
    staffHospitalId: string,
  ): Promise<void> {
    const { params, body } = request;

    // For schedule endpoints with ID parameter
    if (params.id && request.route.path.includes('doctor-schedules')) {
      await this.validateScheduleAccess(params.id, staffHospitalId);
    }

    // For creation operations with doctorId
    if (body?.doctorId) {
      // We need to validate the doctor belongs to the same hospital
      // This will be handled by the service layer validation
    }
  }

  private async validateScheduleAccess(
    scheduleId: string,
    staffHospitalId: string,
  ): Promise<void> {
    try {
      const schedule = await this.doctorSchedulesService.findOne(scheduleId);
      if (schedule.doctor.hospital_id !== staffHospitalId) {
        throw new ForbiddenException(
          'Cannot access schedules from other hospitals',
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Doctor schedule not found');
    }
  }
}
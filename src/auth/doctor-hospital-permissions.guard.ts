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
import { DoctorsService } from '../doctors/doctors.service';
import { HOSPITAL_PERMISSIONS_KEY } from './hospital-permissions.decorator';

@Injectable()
export class DoctorHospitalPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private staffService: StaffService,
    private doctorsService: DoctorsService,
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

    // Check hospital scope for doctor operations
    await this.validateDoctorHospitalScope(request, staffProfile.hospitalId);

    return true;
  }

  private async validateDoctorHospitalScope(
    request: any,
    staffHospitalId: string,
  ): Promise<void> {
    const { params, body, query } = request;

    // For doctor endpoints with ID parameter
    if (params.id && request.route.path.includes('doctors')) {
      await this.validateDoctorAccess(params.id, staffHospitalId);
    }

    // For creation operations
    if (body?.hospitalId && body.hospitalId !== staffHospitalId) {
      throw new ForbiddenException(
        'Cannot create resources for other hospitals',
      );
    }

    // For filtering by hospitalId in queries
    if (query?.hospitalId && query.hospitalId !== staffHospitalId) {
      throw new ForbiddenException(
        'Cannot access resources from other hospitals',
      );
    }
  }

  private async validateDoctorAccess(
    doctorId: string,
    staffHospitalId: string,
  ): Promise<void> {
    try {
      const doctor = await this.doctorsService.findOne(doctorId);
      if (doctor.hospital_id !== staffHospitalId) {
        throw new ForbiddenException(
          'Cannot access doctors from other hospitals',
        );
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Doctor not found');
    }
  }
}
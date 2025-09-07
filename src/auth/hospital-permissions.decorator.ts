import { SetMetadata } from '@nestjs/common';
import { StaffPermission } from '../staff/entities/staff.entity';

export const HOSPITAL_PERMISSIONS_KEY = 'hospital_permissions';

export const RequireHospitalPermissions = (
  ...permissions: StaffPermission[]
) => SetMetadata(HOSPITAL_PERMISSIONS_KEY, permissions);
import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Hospital } from '../../hospitals/entities/hospital.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export interface MedicalHistory {
  conditions?: string[];
  surgeries?: string[];
  medications?: string[];
  allergies?: string[];
  familyHistory?: Record<string, any>;
  notes?: string;
}

@Entity('patients')
@Unique('unique_patient_hospital', ['patientNumber', 'hospitalId'])
@Index('idx_patients_user', ['userId'])
@Index('idx_patients_hospital', ['hospitalId'])
@Index('idx_patients_number', ['patientNumber'])
export class Patient extends BaseEntity {
  @Column({ type: 'varchar', length: 36, unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  hospitalId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  patientNumber: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ type: 'varchar', length: 10, nullable: true })
  bloodGroup: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  emergencyContactName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactPhone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergencyContactRelationship: string;

  @Column({ type: 'json', nullable: true })
  medicalHistory: MedicalHistory;

  @Column({ type: 'json', nullable: true })
  allergies: string[];

  @Column({ type: 'json', nullable: true })
  currentMedications: string[];

  @Column({ type: 'varchar', length: 200, nullable: true })
  insuranceProvider: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  insurancePolicyNumber: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @OneToOne(() => User, (user) => user.patientProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Hospital, (hospital) => hospital.patients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  // Computed properties
  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }
}

import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    private dataSource: DataSource,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if email already exists in the hospital
      const existingUser = await this.usersRepository.findOne({
        where: {
          email: createPatientDto.email,
          hospitalId: createPatientDto.hospitalId,
        },
      });

      if (existingUser) {
        throw new ConflictException(
          'Email already registered for this hospital',
        );
      }

      // Validate date of birth if provided
      if (createPatientDto.dateOfBirth) {
        const birthDate = new Date(createPatientDto.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 0 || age > 120) {
          throw new BadRequestException('Invalid date of birth');
        }
      }

      // Create User entity
      const userData = {
        email: createPatientDto.email,
        password: createPatientDto.password, // Will be hashed by @BeforeInsert
        role: UserRole.PATIENT,
        hospitalId: createPatientDto.hospitalId,
        firstName: createPatientDto.firstName,
        lastName: createPatientDto.lastName,
        phone: createPatientDto.phone,
        isActive: true,
        emailVerified: false,
      };

      const user = this.usersRepository.create(userData);
      const savedUser = await queryRunner.manager.save(user);

      // Generate patient number
      const patientNumber = await this.generatePatientNumber(
        createPatientDto.hospitalId,
      );

      // Create Patient entity
      const patientData = {
        userId: savedUser.id,
        hospitalId: createPatientDto.hospitalId,
        patientNumber,
        dateOfBirth: createPatientDto.dateOfBirth,
        gender: createPatientDto.gender,
        bloodGroup: createPatientDto.bloodGroup,
        address: createPatientDto.address,
        city: createPatientDto.city,
        state: createPatientDto.state,
        country: createPatientDto.country,
        postalCode: createPatientDto.postalCode,
        emergencyContactName: createPatientDto.emergencyContactName,
        emergencyContactPhone: createPatientDto.emergencyContactPhone,
        emergencyContactRelationship:
          createPatientDto.emergencyContactRelationship,
        isActive: createPatientDto.isActive ?? true,
      };

      const patient = this.patientsRepository.create(patientData);
      const savedPatient = await queryRunner.manager.save(patient);

      await queryRunner.commitTransaction();

      // Load patient with user relation for response
      const patientWithUser = await this.patientsRepository.findOne({
        where: { id: savedPatient.id },
        relations: ['user', 'hospital'],
      });

      return {
        patient: patientWithUser,
        message:
          'Patient registered successfully. Please verify your email to complete registration.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.patientsRepository.find({
      relations: ['user', 'hospital'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return await this.patientsRepository.findOneBy({ id });
  }

  async update(id: string, updatePatientDto: UpdatePatientDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const patient = await this.patientsRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Validate date of birth if provided
      if (updatePatientDto.dateOfBirth) {
        const birthDate = new Date(updatePatientDto.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        if (age < 0 || age > 120) {
          throw new BadRequestException('Invalid date of birth');
        }
      }

      // Update user data if provided
      const userUpdateData: Partial<User> = {};
      if (updatePatientDto.firstName) userUpdateData.firstName = updatePatientDto.firstName;
      if (updatePatientDto.lastName) userUpdateData.lastName = updatePatientDto.lastName;
      if (updatePatientDto.phone) userUpdateData.phone = updatePatientDto.phone;
      if (updatePatientDto.email) {
        // Check if email already exists for different user in same hospital
        const existingUser = await this.usersRepository.findOne({
          where: {
            email: updatePatientDto.email,
            hospitalId: patient.hospitalId,
          },
        });

        if (existingUser && existingUser.id !== patient.userId) {
          throw new ConflictException(
            'Email already registered for another user in this hospital',
          );
        }
        userUpdateData.email = updatePatientDto.email;
      }

      if (Object.keys(userUpdateData).length > 0) {
        await queryRunner.manager.update(User, patient.userId, userUpdateData);
      }

      // Update patient data
      const patientUpdateData: Partial<Patient> = {};
      if (updatePatientDto.dateOfBirth !== undefined) patientUpdateData.dateOfBirth = updatePatientDto.dateOfBirth;
      if (updatePatientDto.gender !== undefined) patientUpdateData.gender = updatePatientDto.gender;
      if (updatePatientDto.bloodGroup !== undefined) patientUpdateData.bloodGroup = updatePatientDto.bloodGroup;
      if (updatePatientDto.address !== undefined) patientUpdateData.address = updatePatientDto.address;
      if (updatePatientDto.city !== undefined) patientUpdateData.city = updatePatientDto.city;
      if (updatePatientDto.state !== undefined) patientUpdateData.state = updatePatientDto.state;
      if (updatePatientDto.country !== undefined) patientUpdateData.country = updatePatientDto.country;
      if (updatePatientDto.postalCode !== undefined) patientUpdateData.postalCode = updatePatientDto.postalCode;
      if (updatePatientDto.emergencyContactName !== undefined) patientUpdateData.emergencyContactName = updatePatientDto.emergencyContactName;
      if (updatePatientDto.emergencyContactPhone !== undefined) patientUpdateData.emergencyContactPhone = updatePatientDto.emergencyContactPhone;
      if (updatePatientDto.emergencyContactRelationship !== undefined) patientUpdateData.emergencyContactRelationship = updatePatientDto.emergencyContactRelationship;
      if (updatePatientDto.isActive !== undefined) patientUpdateData.isActive = updatePatientDto.isActive;

      if (Object.keys(patientUpdateData).length > 0) {
        await queryRunner.manager.update(Patient, id, patientUpdateData);
      }

      await queryRunner.commitTransaction();

      // Return updated patient with relations
      const updatedPatient = await this.patientsRepository.findOne({
        where: { id },
        relations: ['user', 'hospital'],
      });

      return {
        patient: updatedPatient,
        message: 'Patient updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const patient = await this.patientsRepository.findOne({
        where: { id },
        relations: ['appointments'],
      });

      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Check for active appointments
      const activeAppointments = patient.appointments?.filter(
        (appointment) => 
          appointment.status !== 'cancelled' && 
          appointment.status !== 'completed' &&
          new Date(appointment.appointmentDate) > new Date()
      );

      if (activeAppointments && activeAppointments.length > 0) {
        throw new ConflictException(
          'Cannot delete patient with active appointments. Please cancel all future appointments first.',
        );
      }

      // Delete patient (this will cascade to user due to onDelete: 'CASCADE')
      await queryRunner.manager.delete(Patient, id);

      await queryRunner.commitTransaction();

      return {
        message: 'Patient account deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async generatePatientNumber(hospitalId: string): Promise<string> {
    // Get hospital prefix or use default
    const hospitalPrefix = 'PAT'; // You can customize this based on hospital

    // Get the latest patient number for this hospital
    const lastPatient = await this.patientsRepository
      .createQueryBuilder('patient')
      .where('patient.hospitalId = :hospitalId', { hospitalId })
      .orderBy('patient.createdAt', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPatient && lastPatient.patientNumber) {
      const lastNumber = parseInt(lastPatient.patientNumber.replace(/\D/g, ''));
      nextNumber = lastNumber + 1;
    }

    // Format: PAT000001, PAT000002, etc.
    return `${hospitalPrefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}

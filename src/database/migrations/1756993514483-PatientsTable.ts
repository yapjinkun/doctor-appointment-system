import { MigrationInterface, QueryRunner } from 'typeorm';

export class PatientsTable1756993514483 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE patients (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL UNIQUE,
                hospital_id VARCHAR(36) NOT NULL,
                patient_number VARCHAR(100),
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other', 'prefer_not_to_say'),
                blood_group VARCHAR(10),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                emergency_contact_name VARCHAR(200),
                emergency_contact_phone VARCHAR(50),
                emergency_contact_relationship VARCHAR(100),
                medical_history JSON,
                allergies JSON,
                current_medications JSON,
                insurance_provider VARCHAR(200),
                insurance_policy_number VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_patient_hospital (patient_number, hospital_id),
                INDEX idx_patients_user (user_id),
                INDEX idx_patients_hospital (hospital_id),
                INDEX idx_patients_number (patient_number),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS patients`);
  }
}

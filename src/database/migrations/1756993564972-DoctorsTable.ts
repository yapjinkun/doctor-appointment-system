import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoctorsTable1756993564972 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE doctors (
                id VARCHAR(36) PRIMARY KEY,
                hospital_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                specialization VARCHAR(100),
                sub_specialization VARCHAR(100),
                qualification TEXT,
                experience_years INT,
                license_number VARCHAR(100),
                email VARCHAR(255),
                phone VARCHAR(50),
                consultation_fee DECIMAL(10, 2),
                slot_duration_minutes INT DEFAULT 30,
                buffer_time_minutes INT DEFAULT 0,
                max_appointments_per_day INT,
                bio TEXT,
                languages_spoken JSON,
                avatar_url VARCHAR(500),
                rating DECIMAL(3, 2),
                total_reviews INT DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_doctors_hospital (hospital_id),
                INDEX idx_doctors_specialization (specialization),
                INDEX idx_doctors_name (name),
                INDEX idx_doctors_rating (rating DESC),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS doctors`);
  }
}

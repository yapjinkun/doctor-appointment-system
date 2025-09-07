import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoctorSchedulesTable1756993630433 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE doctor_schedules (
                id VARCHAR(36) PRIMARY KEY,
                doctor_id VARCHAR(36) NOT NULL,
                day_of_week INT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                break_start TIME,
                break_end TIME,
                is_active BOOLEAN DEFAULT true,
                max_appointments INT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_doctor_schedule (doctor_id, day_of_week),
                INDEX idx_schedules_doctor (doctor_id),
                INDEX idx_schedules_day (day_of_week),
                INDEX idx_schedules_doctor_day (doctor_id, day_of_week),
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS doctor_schedules`);
  }
}

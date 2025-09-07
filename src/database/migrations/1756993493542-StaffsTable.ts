import { MigrationInterface, QueryRunner } from 'typeorm';

export class StaffsTable1756993493542 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE staff (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL UNIQUE,
                hospital_id VARCHAR(36) NOT NULL,
                employee_id VARCHAR(100),
                department VARCHAR(100),
                designation VARCHAR(100),
                permissions JSON,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_employee_hospital (employee_id, hospital_id),
                INDEX idx_staff_hospital (hospital_id),
                INDEX idx_staff_user (user_id),
                INDEX idx_staff_employee_id (employee_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS staff`);
  }
}

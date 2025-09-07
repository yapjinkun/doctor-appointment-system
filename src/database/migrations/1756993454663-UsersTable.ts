import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersTable1756993454663 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'staff', 'patient') NOT NULL,
                hospital_id VARCHAR(36),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                phone VARCHAR(50),
                avatar_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                email_verified BOOLEAN DEFAULT false,
                email_verification_token VARCHAR(255),
                password_reset_token VARCHAR(255),
                password_reset_expires DATETIME,
                last_login_at DATETIME,
                failed_login_attempts INT DEFAULT 0,
                locked_until DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_email_hospital (email, hospital_id),
                INDEX idx_users_email (email),
                INDEX idx_users_hospital (hospital_id),
                INDEX idx_users_role (role),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}

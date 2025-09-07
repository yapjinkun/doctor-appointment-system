import { MigrationInterface, QueryRunner } from 'typeorm';

export class HospitalsTable1756993348657 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE hospitals (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100),
                postal_code VARCHAR(20),
                phone VARCHAR(50),
                email VARCHAR(255),
                website VARCHAR(255),
                timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
                smtp_config JSON,
                business_hours JSON,
                settings JSON,
                logo_url VARCHAR(500),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_hospitals_active (is_active),
                INDEX idx_hospitals_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS hospitals`);
  }
}

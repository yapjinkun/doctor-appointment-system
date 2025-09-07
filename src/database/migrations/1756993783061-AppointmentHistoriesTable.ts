import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentHistoriesTable1756993783061
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE appointment_history (
                id VARCHAR(36) PRIMARY KEY,
                appointment_id VARCHAR(36) NOT NULL,
                action VARCHAR(50) NOT NULL,
                old_values JSON,
                new_values JSON,
                performed_by VARCHAR(36),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_appointment_history_appointment (appointment_id),
                INDEX idx_appointment_history_action (action),
                INDEX idx_appointment_history_created (created_at),
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
                FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS appointment_history`);
  }
}

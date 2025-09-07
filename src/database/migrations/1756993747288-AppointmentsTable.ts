import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppointmentsTable1756993747288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE appointments (
                id VARCHAR(36) PRIMARY KEY,
                hospital_id VARCHAR(36) NOT NULL,
                doctor_id VARCHAR(36) NOT NULL,
                patient_id VARCHAR(36) NOT NULL,
                appointment_number VARCHAR(100),
                appointment_date DATE NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                appointment_type ENUM('consultation', 'follow_up', 'emergency', 'routine_checkup', 'vaccination', 'test') DEFAULT 'consultation',
                status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled') DEFAULT 'pending',
                consultation_fee DECIMAL(10, 2),
                payment_status ENUM('pending', 'paid', 'refunded', 'waived') DEFAULT 'pending',
                payment_method VARCHAR(50),
                chief_complaint TEXT,
                symptoms JSON,
                notes TEXT,
                prescription JSON,
                vital_signs JSON,
                cancellation_reason TEXT,
                cancelled_by VARCHAR(36),
                cancelled_at DATETIME,
                rescheduled_from VARCHAR(36),
                reminder_sent BOOLEAN DEFAULT false,
                reminder_sent_at DATETIME,
                checked_in_at DATETIME,
                consultation_started_at DATETIME,
                consultation_ended_at DATETIME,
                booked_by VARCHAR(36),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_appointments_doctor_date (doctor_id, appointment_date),
                INDEX idx_appointments_patient (patient_id),
                INDEX idx_appointments_hospital_date (hospital_id, appointment_date),
                INDEX idx_appointments_status (status),
                INDEX idx_appointments_payment_status (payment_status),
                INDEX idx_appointments_reminder (appointment_date, reminder_sent),
                INDEX idx_appointments_date_range (start_time, end_time),
                INDEX idx_appointments_number (appointment_number),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
                FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (rescheduled_from) REFERENCES appointments(id) ON DELETE SET NULL,
                FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS appointments`);
  }
}

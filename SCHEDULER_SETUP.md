# Appointment Reminder Scheduler Setup

This document explains how to set up the appointment reminder cron job system.

## Prerequisites

Install the NestJS Schedule package:

```bash
npm install @nestjs/schedule
```

## Configuration

### 1. Add ScheduleModule to App Module

Update your `src/app.module.ts` to import the ScheduleModule:

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // Add this line
    // ... other modules
  ],
  // ... rest of module configuration
})
export class AppModule {}
```

### 2. Environment Configuration

Add timezone configuration to your `.env` file:

```env
# Scheduler Configuration
SCHEDULER_TIMEZONE=America/New_York
```

### 3. Cron Job Schedule

The reminder service is configured to run daily at 9:00 AM:

- **Cron Expression**: `0 9 * * *`
- **Description**: Every day at 9:00 AM
- **Function**: Send email reminders for appointments scheduled for the next day

You can modify the cron expression in `src/appointments/appointment-reminder.service.ts`:

```typescript
@Cron('0 9 * * *', {
  name: 'appointment-reminders',
  timeZone: 'America/New_York', // Configure based on your timezone
})
```

### 4. Common Cron Patterns

- `0 9 * * *` - Every day at 9:00 AM
- `0 8,18 * * *` - Every day at 8:00 AM and 6:00 PM
- `0 9 * * 1-5` - Every weekday at 9:00 AM
- `*/30 * * * *` - Every 30 minutes

## Features

### Automatic Daily Reminders
- Runs daily at 9:00 AM
- Finds all confirmed appointments for the next day
- Sends reminder emails to patients
- Marks appointments as reminder sent
- Logs success/failure for monitoring

### Manual Controls

#### Send Reminders Manually
```http
POST /appointments/reminders/send
```

#### Send Reminder for Specific Appointment
```http
POST /appointments/{appointmentId}/reminder
```

#### View Upcoming Reminders
```http
GET /appointments/reminders/upcoming?days=7
```

## Monitoring

The service logs all activities:

- Successful reminder sends
- Failed attempts with error details
- Daily job completion statistics
- Manual trigger results

Check your application logs for entries from `AppointmentReminderService`.

## Business Logic

### Reminder Criteria
- Appointment must be **confirmed** status
- Appointment must be **tomorrow's date**
- Reminder must **not have been sent** yet
- Patient must have **valid email address**

### Error Handling
- Individual reminder failures don't stop the batch job
- Email sending errors are logged but don't fail appointment booking
- Missing data (patient, doctor, hospital) is handled gracefully

### Timezone Considerations
- Configure timezone in cron job decoration
- All date calculations use server timezone
- Consider patient timezone for optimal reminder timing

## Testing

### Manual Testing
1. Create a confirmed appointment for tomorrow
2. Trigger manual reminder: `POST /appointments/reminders/send`
3. Check email delivery and appointment reminder status

### Automated Testing
```bash
# Run the reminder job manually through the service
curl -X POST http://localhost:3000/appointments/reminders/send
```

## Performance Considerations

- Batch processing of reminders to avoid overwhelming email service
- Async email sending to prevent blocking
- Database indexing on reminder fields for efficient queries
- Configurable batch sizes for large appointment volumes

## Security

- Admin-only access for manual reminder triggers (implement authentication)
- Rate limiting on manual reminder endpoints
- Audit logging for reminder activities
- Secure email configuration with environment variables
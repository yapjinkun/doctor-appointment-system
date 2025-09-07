# Installation Guide for Email & Reminder System

## Current Status

The appointment reminder system is currently implemented with **email simulation** (logs only). To enable full functionality, follow these steps:

## Required Packages

Install the following packages to enable full email and cron job functionality:

```bash
# Install email packages
npm install @nestjs-modules/mailer nodemailer handlebars
npm install --save-dev @types/nodemailer

# Install schedule package for cron jobs
npm install @nestjs/schedule
```

## Configuration Steps

### 1. Enable Email Service

After installing the email packages, replace the `src/mail/mail.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST', 'localhost'),
          port: config.get('MAIL_PORT', 587),
          secure: config.get('MAIL_SECURE', false),
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${config.get('MAIL_FROM_NAME', 'Hospital System')}" <${config.get('MAIL_FROM_EMAIL', 'noreply@hospital.com')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

### 2. Enable Cron Jobs

After installing the schedule package, update `src/appointments/appointment-reminder.service.ts`:

```typescript
// Uncomment this line at the top:
import { Cron, CronExpression } from '@nestjs/schedule';

// Uncomment the decorator above sendDailyReminders method:
@Cron('0 9 * * *', {
  name: 'appointment-reminders',
  timeZone: 'America/New_York',
})
async sendDailyReminders(): Promise<void> {
  // ... existing method code
}
```

### 3. Update App Module

Add the ScheduleModule to your main app module (`src/app.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
// ... other imports

@Module({
  imports: [
    ScheduleModule.forRoot(), // Add this line
    // ... other modules
  ],
  // ... rest of configuration
})
export class AppModule {}
```

### 4. Environment Variables

Update your `.env` file with email configuration:

```env
# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_NAME="Hospital Management System"
MAIL_FROM_EMAIL=noreply@hospital.com
MAIL_SECURE=false

# Scheduler Configuration
SCHEDULER_TIMEZONE=America/New_York
```

## Current Features (Working Now)

Even without the packages installed, these features work:

### ✅ Manual Reminder Triggers
```http
POST /appointments/reminders/send
POST /appointments/{id}/reminder
GET /appointments/reminders/upcoming
```

### ✅ Email Simulation
- Logs detailed email content to console
- Tracks reminder status in database
- Full business logic validation

### ✅ Database Integration
- Marks appointments as reminder sent
- Prevents duplicate reminders
- Tracks reminder timestamps

## Testing Current Implementation

### 1. Create Test Appointment
```http
POST /appointments/book
{
  "hospitalId": "uuid-here",
  "doctorId": "uuid-here", 
  "appointmentDate": "2024-01-16", // Tomorrow's date
  "startTime": "2024-01-16T09:00:00.000Z",
  "endTime": "2024-01-16T09:30:00.000Z"
}
```

### 2. Trigger Manual Reminder
```http
POST /appointments/reminders/send
```

### 3. Check Console Output
Look for log messages like:
```
[MailService] [EMAIL SIMULATION] Reminder email would be sent to: patient@example.com
[MailService] Subject: Appointment Reminder - Tomorrow at City Hospital
[MailService] Appointment: APT202401160001
```

## Production Deployment

### After Package Installation:

1. **Email Templates**: The Handlebars templates in `src/mail/templates/` will be automatically used
2. **Cron Jobs**: Will run automatically at scheduled times
3. **Real Emails**: Will send actual emails instead of logging
4. **Monitoring**: Check logs for successful/failed email delivery

### Email Provider Setup:

**Gmail:**
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-gmail@gmail.com
MAIL_PASSWORD=your-app-specific-password
```

**SendGrid:**
```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

## Troubleshooting

### Common Issues:

1. **Module not found errors**: Install required packages
2. **Template not found**: Ensure templates exist in `src/mail/templates/`
3. **Cron not running**: Verify ScheduleModule is imported in app module
4. **Email not sending**: Check SMTP configuration and credentials

### Debugging:

```bash
# Check if packages are installed
npm list @nestjs/schedule
npm list @nestjs-modules/mailer

# View current reminder jobs
curl http://localhost:3000/appointments/reminders/upcoming

# Manual trigger for testing
curl -X POST http://localhost:3000/appointments/reminders/send
```

The system is designed to work in stages - starting with simulation and gradually enabling full functionality as packages are installed.
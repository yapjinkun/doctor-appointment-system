# Doctor Appointment System

A multi-tenant doctor appointment booking system built with NestJS, TypeORM, and MySQL. Features role-based access control, automated email reminders, and hospital-scoped data isolation.

## Features

- **Multi-tenant Architecture**: Hospital-based data isolation
- **Role-based Access Control**: Admin, Staff, and Patient roles
- **Appointment Management**: Full booking system with status tracking
- **Automated Reminders**: Email notifications for upcoming appointments
- **Doctor Profiles**: Specialization and schedule management
- **JWT Authentication**: Secure token-based authentication

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd doctor-appointments
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your database and email configuration:
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=password
DATABASE_NAME=doctor_appointments

JWT_SECRET=your-secret-key

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

4. Run database migrations
```bash
npm run migration:run
```

5. Start the application
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## Development Commands

```bash
npm run start:dev       # Start in development mode
npm run start:debug     # Start with debugging
npm run build           # Build the application
npm run test            # Run tests
npm run test:e2e        # Run end-to-end tests
npm run lint            # Lint and fix code
npm run format          # Format code
```

## Tech Stack

- **Backend**: NestJS, TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT
- **Email**: Handlebars templates
- **Validation**: Class-validator
- **Testing**: Jest

## License

MIT

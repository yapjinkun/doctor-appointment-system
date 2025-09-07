import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RequestWithTimezone extends Request {
  timezone?: string;
  hospitalTimezone?: string;
}

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
  use(req: RequestWithTimezone, res: Response, next: NextFunction) {
    // Extract timezone from X-Timezone header
    const headerTimezone = req.headers['x-timezone'] as string;

    if (headerTimezone) {
      // Validate timezone format (basic validation)
      if (this.isValidTimezone(headerTimezone)) {
        req.timezone = headerTimezone;
      }
    }

    next();
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      // Try to create a date with the timezone to validate it
      Intl.DateTimeFormat([], { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }
}

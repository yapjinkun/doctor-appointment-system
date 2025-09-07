import { Injectable } from '@nestjs/common';

@Injectable()
export class TimezoneService {
  /**
   * Convert a UTC date to a specific timezone
   */
  convertToTimezone(date: Date, timezone: string): Date {
    // Create a new date representing the same moment in the target timezone
    const utcTime = date.getTime() + date.getTimezoneOffset() * 60000;
    const targetTime = new Date(
      utcTime + this.getTimezoneOffset(timezone, date),
    );
    return targetTime;
  }

  /**
   * Convert a date from a specific timezone to UTC
   */
  convertToUTC(date: Date, fromTimezone: string): Date {
    const offset = this.getTimezoneOffset(fromTimezone, date);
    return new Date(date.getTime() - offset);
  }

  /**
   * Get timezone offset in milliseconds for a given timezone and date
   */
  private getTimezoneOffset(timezone: string, date: Date): number {
    try {
      // Create dates in both UTC and the target timezone
      const utcDate = new Date(date.toISOString());
      const tzDate = new Date(
        date.toLocaleString('en-US', { timeZone: timezone }),
      );

      // Calculate the difference
      return utcDate.getTime() - tzDate.getTime();
    } catch {
      // If timezone is invalid, return 0 (no offset)
      return 0;
    }
  }

  /**
   * Format a date string for a specific timezone
   */
  formatDateForTimezone(
    date: Date,
    timezone: string,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    try {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
        ...options,
      };

      return date.toLocaleString('en-US', defaultOptions);
    } catch {
      // Fallback to UTC if timezone is invalid
      return date.toISOString();
    }
  }

  /**
   * Get start and end of day for a specific date in a given timezone
   */
  getDayBounds(date: Date, timezone: string): { start: Date; end: Date } {
    try {
      // Create a date string in the target timezone
      const dateStr = this.formatDateForTimezone(date, timezone, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      // Parse the date parts
      const [month, day, year] = dateStr.split('/');

      // Create start and end of day in the target timezone
      const startStr = `${year}-${month}-${day}T00:00:00`;
      const endStr = `${year}-${month}-${day}T23:59:59.999`;

      // Convert these back to UTC dates
      const start = this.convertToUTC(new Date(startStr), timezone);
      const end = this.convertToUTC(new Date(endStr), timezone);

      return { start, end };
    } catch {
      // Fallback to UTC day bounds if timezone conversion fails
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);

      return { start, end };
    }
  }

  /**
   * Check if a timezone string is valid
   */
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat([], { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current time in a specific timezone
   */
  getCurrentTimeInTimezone(timezone: string): Date {
    return this.convertToTimezone(new Date(), timezone);
  }

  /**
   * Parse a date string that might be in a specific timezone
   */
  parseDate(dateStr: string, timezone?: string): Date {
    const date = new Date(dateStr);

    if (timezone && this.isValidTimezone(timezone)) {
      // If timezone is provided, assume the date string is in that timezone
      return this.convertToUTC(date, timezone);
    }

    return date;
  }
}

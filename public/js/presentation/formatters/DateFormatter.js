/**
 * DateFormatter - Presentation
 * Formats dates for display
 * Single Responsibility: Date formatting only
 */
import { DateFormat } from '../../shared/constants.js';

export class DateFormatter {
  static formatDate(dateStr, options = DateFormat.SHORT_DATE) {
    if (!dateStr) return '—';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(DateFormat.LOCALE, options);
    } catch (error) {
      console.error('[DateFormatter] Error formatting date:', error);
      return '—';
    }
  }

  static formatDateTime(dateStr) {
    if (!dateStr) return '—';

    try {
      const date = new Date(dateStr);
      return date.toLocaleString(DateFormat.LOCALE, DateFormat.FULL_DATETIME);
    } catch (error) {
      console.error('[DateFormatter] Error formatting datetime:', error);
      return '—';
    }
  }

  static formatShortDate(dateStr) {
    return this.formatDate(dateStr, DateFormat.SHORT_DATE);
  }

  static formatLongDate(dateStr) {
    return this.formatDate(dateStr, DateFormat.LONG_DATE);
  }
}

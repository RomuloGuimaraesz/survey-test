/**
 * StatusFormatter - Presentation
 * Formats status badges for display
 * Single Responsibility: Status badge formatting
 * Open/Closed Principle: Add new status types by extending
 */
export class StatusFormatter {
  static formatSentStatus(value) {
    if (!value) {
      return '<span class="status-badge status-pending">—</span>';
    }
    return '<span class="status-badge status-sent">✓</span>';
  }

  static formatWhatsAppStatus(value) {
    if (!value) return '—';

    const statusClass = `status-${value}`;
    const displayText = value.substring(0, 8);

    return `<span class="status-badge ${statusClass}">${displayText}</span>`;
  }

  static formatResponseStatus(hasSurvey) {
    if (hasSurvey) {
      return '<span class="status-badge status-answered">✓</span>';
    }
    return '<span class="status-badge status-pending">✗</span>';
  }

  static formatEngagementStatus(status) {
    const statusMap = {
      'responded': { text: 'Respondeu', class: 'status-answered' },
      'clicked': { text: 'Clicou', class: 'status-clicked' },
      'delivered': { text: 'Entregue', class: 'status-delivered' },
      'sent': { text: 'Enviado', class: 'status-sent' },
      'not_sent': { text: 'Não enviado', class: 'status-pending' }
    };

    const config = statusMap[status] || { text: status, class: 'status-unknown' };
    return `<span class="status-badge ${config.class}">${config.text}</span>`;
  }
}

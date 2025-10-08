/**
 * Column Definitions for Citizen Table
 * Shared configuration following Open/Closed Principle
 */
import { DateFormatter } from '../../presentation/formatters/DateFormatter.js';
import { StatusFormatter } from '../../presentation/formatters/StatusFormatter.js';

export const columnDefinitions = [
  {
    key: 'age',
    label: 'Idade',
    render: (value) => value || '—'
  },
  {
    key: 'neighborhood',
    label: 'Bairro',
    render: (value) => value || '—'
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    render: (value) => {
      if (!value) return '—';
      const display = value.length > 15 ? value.substring(0, 12) + '...' : value;
      return `<span title="${value}">${display}</span>`;
    }
  },
  {
    key: 'whatsappSentAt',
    label: 'Enviado',
    render: (value) => StatusFormatter.formatSentStatus(value)
  },
  {
    key: 'whatsappStatus',
    label: 'Status',
    render: (value) => StatusFormatter.formatWhatsAppStatus(value)
  },
  {
    key: 'clickedAt',
    label: 'Clicou',
    render: (value) => value ? DateFormatter.formatShortDate(value) : '—'
  },
  {
    key: 'survey',
    label: 'Respondeu',
    render: (value) => StatusFormatter.formatResponseStatus(!!value)
  },
  {
    key: 'survey.issue',
    label: 'Reclamação',
    render: (value, citizen) => {
      // Access nested survey.issue property
      return citizen?.survey?.issue || '—';
    }
  }
];

/**
 * Column Groups for Desktop 2-column layout
 * Groups: [idade, bairro], [whatsapp, enviado], [status, clicou], [respondeu, reclamação]
 */
export const columnGroups = [
  [columnDefinitions[0], columnDefinitions[1]], // idade, bairro
  [columnDefinitions[2], columnDefinitions[3]], // whatsapp, enviado
  [columnDefinitions[4], columnDefinitions[5]], // status, clicou
  [columnDefinitions[6], columnDefinitions[7]]  // respondeu, reclamação
];

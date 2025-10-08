/**
 * ContactInfo - Value Object (DDD)
 * Immutable representation of contact information
 */
export class ContactInfo {
  constructor(whatsapp, provider = null) {
    this._whatsapp = whatsapp || null;
    this._provider = provider;

    Object.freeze(this);
  }

  get whatsapp() {
    return this._whatsapp;
  }

  get provider() {
    return this._provider;
  }

  hasWhatsApp() {
    return this._whatsapp !== null && this._whatsapp.trim().length > 0;
  }

  getFormattedPhone() {
    if (!this._whatsapp) return '—';

    const cleaned = this._whatsapp.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return this._whatsapp;
  }

  getCleanedPhone() {
    return this._whatsapp ? this._whatsapp.replace(/\D/g, '') : '';
  }

  equals(other) {
    if (!(other instanceof ContactInfo)) return false;
    return this._whatsapp === other._whatsapp;
  }
}

/**
 * EngagementHistory - Value Object (DDD)
 * Tracks citizen engagement with outreach campaigns
 */
export class EngagementHistory {
  constructor(whatsappSentAt, whatsappMessageId, whatsappStatus, whatsappStatusUpdatedAt, clickedAt) {
    this._whatsappSentAt = whatsappSentAt || null;
    this._whatsappMessageId = whatsappMessageId || null;
    this._whatsappStatus = whatsappStatus || null;
    this._whatsappStatusUpdatedAt = whatsappStatusUpdatedAt || null;
    this._clickedAt = clickedAt || null;

    Object.freeze(this);
  }

  get whatsappSentAt() {
    return this._whatsappSentAt;
  }

  get whatsappMessageId() {
    return this._whatsappMessageId;
  }

  get whatsappStatus() {
    return this._whatsappStatus;
  }

  get whatsappStatusUpdatedAt() {
    return this._whatsappStatusUpdatedAt;
  }

  get clickedAt() {
    return this._clickedAt;
  }

  wasMessageSent() {
    return this._whatsappSentAt !== null;
  }

  hasClicked() {
    return this._clickedAt !== null;
  }

  isDelivered() {
    return this._whatsappStatus === 'delivered' || this._whatsappStatus === 'read';
  }

  getEngagementLevel() {
    if (this._clickedAt) return 'high';
    if (this.isDelivered()) return 'medium';
    if (this.wasMessageSent()) return 'low';
    return 'none';
  }
}

/**
 * StatisticsPanel - Presentation Component
 * Displays statistical overview
 * Single Responsibility: Render statistics only
 *
 * Updated to work with both legacy HTML and new web component
 */
export class StatisticsPanel {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.webComponent = null;

    // Check if container is the new web component
    if (this.container && this.container.tagName === 'QUICK-STATS') {
      this.webComponent = this.container;
      console.log('[StatisticsPanel] Using QuickStats web component');
    } else if (!this.container) {
      console.error(`[StatisticsPanel] Container not found: ${containerSelector}`);
    } else {
      console.log('[StatisticsPanel] Using legacy HTML structure');
    }
  }

  render(statistics) {
    if (!statistics) return;

    // Use web component if available
    if (this.webComponent) {
      this.webComponent.updateStats({
        total: statistics.total,
        sent: statistics.sent,
        responded: statistics.responded,
        pending: statistics.pending
      });
    }
    // Fallback to legacy HTML
    else if (this.container) {
      this.updateCounter('.quick-stats__total', statistics.total, 'Total');
      this.updateCounter('.quick-stats__enviados', statistics.sent, 'Enviadas');
      this.updateCounter('.quick-stats__respondidos', statistics.responded, 'Respondidas');
      this.updateCounter('.quick-stats__pendentes', statistics.pending, 'Pendentes');
    }
  }

  updateCounter(selector, value, label) {
    const counterElement = this.container.querySelector(`${selector} .quick-stats__counter span`);
    const labelElement = this.container.querySelector(`${selector} .quick-stats__label`);

    if (counterElement) {
      counterElement.textContent = value;
    }
    if (labelElement) {
      labelElement.textContent = label;
    }
  }

  show() {
    if (this.webComponent) {
      this.webComponent.style.display = 'block';
    } else if (this.container) {
      this.container.style.display = 'grid';
    }
  }

  hide() {
    if (this.webComponent) {
      this.webComponent.style.display = 'none';
    } else if (this.container) {
      this.container.style.display = 'none';
    }
  }
}

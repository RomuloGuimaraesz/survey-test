/**
 * <civic-statistics> Web Component
 * Displays statistical overview of civic engagement
 */

import { ReactiveComponent } from '../base/ReactiveComponent.js';
import { EventEmitterMixin } from '../mixins/EventEmitterMixin.js';
import { html, css } from '../utils/html.js';

export class CivicStatistics extends EventEmitterMixin(ReactiveComponent) {
  constructor() {
    super();

    // Define reactive properties
    this.defineProperty('statistics', null, {
      type: 'object',
      validator: (val) => val === null || typeof val === 'object'
    });

    this.defineProperty('loading', false, {
      type: 'boolean',
      reflect: true
    });

    this.defineProperty('autoRefresh', 0, {
      type: 'number'
    });

    this._refreshInterval = null;
  }

  static get observedAttributes() {
    return ['data-source', 'auto-refresh', 'theme'];
  }

  // ========== Lifecycle ==========

  onConnect() {
    // Setup auto-refresh if configured
    const autoRefresh = this.getJSONAttribute('auto-refresh');
    if (autoRefresh && autoRefresh > 0) {
      this.startAutoRefresh(autoRefresh);
    }

    // Fetch initial data
    const dataSource = this.getAttribute('data-source');
    if (dataSource) {
      this.fetchStatistics(dataSource);
    }
  }

  onDisconnect() {
    this.stopAutoRefresh();
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === 'data-source' && newValue) {
      this.fetchStatistics(newValue);
    } else if (name === 'auto-refresh') {
      const interval = parseInt(newValue);
      if (interval > 0) {
        this.startAutoRefresh(interval);
      } else {
        this.stopAutoRefresh();
      }
    }
  }

  // ========== Data Management ==========

  async fetchStatistics(endpoint) {
    this.loading = true;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.statistics = data;

      this.emitEvent('statistics-loaded', { statistics: data });
    } catch (error) {
      console.error('[CivicStatistics] Fetch error:', error);
      this.emitEvent('statistics-error', { error });
      this.onError(error);
    } finally {
      this.loading = false;
    }
  }

  startAutoRefresh(interval) {
    this.stopAutoRefresh();

    this._refreshInterval = setInterval(() => {
      const dataSource = this.getAttribute('data-source');
      if (dataSource) {
        this.fetchStatistics(dataSource);
      }
    }, interval);

    this.registerCleanup(() => this.stopAutoRefresh());
  }

  stopAutoRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = null;
    }
  }

  // ========== Rendering ==========

  render() {
    const template = html`
      <style>${this.styles()}</style>
      <div class="statistics-container ${this.loading ? 'loading' : ''}">
        ${this.renderStatistics()}
      </div>
    `;

    this.shadowRoot.innerHTML = template;
  }

  renderStatistics() {
    if (!this.statistics) {
      return html`
        <div class="empty-state">
          <p>No statistics available</p>
        </div>
      `;
    }

    const { total = 0, sent = 0, responded = 0, pending = 0 } = this.statistics;

    return html`
      ${this.renderStatItem('total', total, 'Total', './total-icon.svg')}
      ${this.renderStatItem('sent', sent, 'Enviadas', './enviado-icon.svg')}
      ${this.renderStatItem('responded', responded, 'Respondidas', './recebido-icon.svg')}
      ${this.renderStatItem('pending', pending, 'Pendentes', './pendente-icon.svg')}
    `;
  }

  renderStatItem(key, count, label, icon) {
    return html`
      <div class="stat-item stat-item--${key}">
        <div class="stat-icon">
          <div class="stat-counter">
            <span>${count}</span>
          </div>
          <img src="${icon}" alt="${label}" />
        </div>
        <p class="stat-label">${label}</p>
      </div>
    `;
  }

  styles() {
    const theme = this.getAttribute('theme') || 'light';

    return css`
      :host {
        display: block;
        width: 100%;
      }

      .statistics-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem 0;
      }

      .statistics-container.loading {
        opacity: 0.6;
        pointer-events: none;
      }

      .stat-item {
        background: var(--stat-bg, #fff);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .stat-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .stat-icon {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .stat-counter {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color, #5200e7);
      }

      .stat-counter span {
        display: block;
      }

      .stat-icon img {
        width: 48px;
        height: 48px;
      }

      .stat-label {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-muted, #666);
        font-weight: 500;
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 2rem;
        color: var(--text-muted, #666);
      }

      /* Theme variations */
      :host([theme="dark"]) .stat-item {
        background: var(--stat-bg-dark, #2a2a2a);
        color: var(--text-light, #fff);
      }

      /* Loading spinner */
      .statistics-container.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top-color: var(--primary-color, #5200e7);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: translate(-50%, -50%) rotate(360deg); }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .statistics-container {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 480px) {
        .statistics-container {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}

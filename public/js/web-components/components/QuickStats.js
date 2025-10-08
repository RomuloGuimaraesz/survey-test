/**
 * <quick-stats> Web Component
 * Displays quick statistics panel with glassmorphic design
 */

import { ReactiveComponent } from '../base/ReactiveComponent.js';
import { EventEmitterMixin } from '../mixins/EventEmitterMixin.js';
import { html, css } from '../utils/html.js';

export class QuickStats extends EventEmitterMixin(ReactiveComponent) {
  constructor() {
    super();

    // Define reactive properties
    this.defineProperty('title', 'Painel Geral', {
      type: 'string',
      reflect: true
    });

    this.defineProperty('stats', null, {
      type: 'object',
      validator: (val) => val === null || typeof val === 'object'
    });

    this.defineProperty('loading', false, {
      type: 'boolean',
      reflect: true
    });
  }

  static get observedAttributes() {
    return ['title', 'data-source'];
  }

  // ========== Lifecycle ==========

  onConnect() {
    const dataSource = this.getAttribute('data-source');
    if (dataSource) {
      this.fetchStats(dataSource);
    }
  }

  onAttributeChange(name, oldValue, newValue) {
    if (name === 'data-source' && newValue) {
      this.fetchStats(newValue);
    } else if (name === 'title') {
      this.title = newValue;
    }
  }

  // ========== Data Management ==========

  async fetchStats(endpoint) {
    this.loading = true;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.stats = data;

      this.emitEvent('stats-loaded', { stats: data });
    } catch (error) {
      console.error('[QuickStats] Fetch error:', error);
      this.emitEvent('stats-error', { error });
    } finally {
      this.loading = false;
    }
  }

  // Public API to update stats
  updateStats(stats) {
    this.stats = stats;
  }

  // ========== Rendering ==========

  render() {
    const template = html`
      <style>${this.styles()}</style>
      <div class="quick-stats ${this.loading ? 'loading' : ''}">
        <h3>${this.title}</h3>
        <div class="quick-stats__cards">
          ${this.renderStats()}
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = template;
  }

  renderStats() {
    if (!this.stats) {
      return html`
        <div class="quick-stats-item quick-stats__total">
          <div class="quick-stats__icon">
            <i><img src="./total-icon.svg" alt="Total"></i>
            <div class="quick-stats__details">
              <div class="quick-stats__counter"><span>0</span></div>
              <p class="quick-stats__label">Total</p>
            </div>
          </div>
        </div>
        <div class="quick-stats-item quick-stats__enviados">
          <div class="quick-stats__icon">
            <i><img src="./enviado-icon.svg" alt="Enviados"></i>
            <div class="quick-stats__details">
              <div class="quick-stats__counter"><span>0</span></div>
              <p class="quick-stats__label">Enviados</p>
            </div>
          </div>
        </div>
        <div class="quick-stats-item quick-stats__respondidos">
          <div class="quick-stats__icon">
            <i><img src="./recebido-icon.svg" alt="Respondidos"></i>
            <div class="quick-stats__details">
              <div class="quick-stats__counter"><span>0</span></div>
              <p class="quick-stats__label">Respondidos</p>
            </div>
          </div>
        </div>
        <div class="quick-stats-item quick-stats__pendentes">
          <div class="quick-stats__icon">
            <i><img src="./pendente-icon.svg" alt="Pendentes"></i>
            <div class="quick-stats__details">
              <div class="quick-stats__counter"><span>0</span></div>
              <p class="quick-stats__label">Pendentes</p>
            </div>
          </div>
        </div>
      `;
    }

    const { total = 0, sent = 0, responded = 0, pending = 0 } = this.stats;

    return html`
      <div class="quick-stats-item quick-stats__total">
        <div class="quick-stats__icon">
          <i><img src="./total-icon.svg" alt="Total"></i>
          <div class="quick-stats__details">
            <div class="quick-stats__counter"><span>${total}</span></div>
            <p class="quick-stats__label">Total</p>
          </div>
        </div>
      </div>
      <div class="quick-stats-item quick-stats__enviados">
        <div class="quick-stats__icon">
          <i><img src="./enviado-icon.svg" alt="Enviados"></i>
          <div class="quick-stats__details">
            <div class="quick-stats__counter"><span>${sent}</span></div>
            <p class="quick-stats__label">Enviados</p>
          </div>
        </div>
      </div>
      <div class="quick-stats-item quick-stats__respondidos">
        <div class="quick-stats__icon">
          <i><img src="./recebido-icon.svg" alt="Respondidos"></i>
          <div class="quick-stats__details">
            <div class="quick-stats__counter"><span>${responded}</span></div>
            <p class="quick-stats__label">Respondidos</p>
          </div>
        </div>
      </div>
      <div class="quick-stats-item quick-stats__pendentes">
        <div class="quick-stats__icon">
          <i><img src="./pendente-icon.svg" alt="Pendentes"></i>
          <div class="quick-stats__details">
            <div class="quick-stats__counter"><span>${pending}</span></div>
            <p class="quick-stats__label">Pendentes</p>
          </div>
        </div>
      </div>
    `;
  }

  styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      /* Glassmorphic container with radial border effect */
      .quick-stats {
        background: hsla(0, 0%, 100%, 0.30);
        border: 1px solid transparent;
        backdrop-filter: blur(16px) saturate(130%);
        -webkit-backdrop-filter: blur(16px) saturate(130%);
        border-radius: 2rem;
        color: #313131;
        display: flex;
        flex-direction: column;
        padding: .30rem;
        overflow-x: hidden;
        overflow-y: hidden;
        position: relative;
      }

      .quick-stats::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background:
          radial-gradient(circle at 50% 55%,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0) 45%,
            rgba(255,255,255,0.25) 70%,
            rgba(255,255,255,0.5) 100%);
        mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        padding: 1px;
      }

      .quick-stats > h3 {
        margin: 1.5rem 2rem;
        font-size: 1rem;
        line-height: 1.2;
      }

      /* Horizontal scrollable cards */
      .quick-stats__cards {
        display: flex;
        gap: 1rem;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 4px 4px 2px;
        scroll-snap-type: x mandatory;
        scroll-padding-left: 2px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .quick-stats__cards::-webkit-scrollbar {
        display: none;
      }

      /* Individual stat cards */
      .quick-stats-item {
        align-items: center;
        border-radius: 1.75rem;
        display: flex;
        flex: 0 0 200px;
        padding: .3rem;
        scroll-snap-align: start;
        background: #ffffff;
        color: #313131;
        position: relative;
      }

      .quick-stats-item * {
        color: inherit;
      }

      .quick-stats-item:hover {
        box-shadow: none;
      }

      /* Icon container */
      .quick-stats__icon {
        background: #f1f1f1;
        border-radius: 1.5rem;
        display: flex;
        align-items: center;
        height: 5rem;
        padding: .5rem 0;
        width: 100%;
        gap: .75rem;
        justify-content: flex-start;
      }

      .quick-stats__icon > i {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 50%;
        margin: 0 1.25rem auto 1.25rem;
        height: 3rem;
        width: 3rem;
      }

      .quick-stats__icon > i img {
        width: 1.125rem;
        height: 1.125rem;
      }

      /* Details section */
      .quick-stats__details {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: .5rem;
      }

      .quick-stats__counter {
        background: transparent;
        color: #313131;
        display: flex;
        align-items: center;
        font-size: 2.5rem;
        font-weight: 600;
        height: 2.25rem;
      }

      .quick-stats__label {
        color: #888;
        margin: 0;
      }

      /* Loading state */
      .quick-stats.loading {
        opacity: 0.6;
        pointer-events: none;
      }

      /* Fade in animation */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .quick-stats .quick-stats-item {
        animation: fadeInUp 420ms cubic-bezier(0.05, 0.7, 0.1, 1) both;
      }

      .quick-stats .quick-stats-item:nth-child(1) {
        animation-delay: 0ms;
      }

      .quick-stats .quick-stats-item:nth-child(2) {
        animation-delay: 60ms;
      }

      .quick-stats .quick-stats-item:nth-child(3) {
        animation-delay: 120ms;
      }

      .quick-stats .quick-stats-item:nth-child(4) {
        animation-delay: 180ms;
      }

      /* Responsive: Desktop view */
      @media (min-width: 680px) {
        .quick-stats__cards {
          flex-wrap: nowrap;
          overflow-x: hidden;
          scroll-snap-type: none;
        }

        .quick-stats-item {
          flex: 1 1 0;
          min-width: 0;
          padding: .3rem;
        }

        .quick-stats__icon {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: .75rem;
        }
      }

      /* Tablet optimization */
      @media (min-width: 768px) and (max-width: 899px) {
        .quick-stats-item {
          min-width: 0;
        }

        .quick-stats__icon {
          height: 4.25rem;
          padding: .4rem .5rem;
          gap: .5rem;
        }

        .quick-stats__icon > i {
          width: 2.25rem;
          height: 2.25rem;
          margin: 0 .5rem 0 0;
        }

        .quick-stats__counter {
          font-size: 2rem;
          line-height: 1;
        }

        .quick-stats__details {
          gap: .25rem;
        }

        .quick-stats__label {
          font-size: .7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      /* Reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .quick-stats .quick-stats-item {
          animation: none;
        }
      }
    `;
  }
}

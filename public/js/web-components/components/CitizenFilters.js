/**
 * <citizen-filters> Web Component
 * Filter controls for citizen data
 */

import { ReactiveComponent } from '../base/ReactiveComponent.js';
import { EventEmitterMixin } from '../mixins/EventEmitterMixin.js';
import { html, css } from '../utils/html.js';

export class CitizenFilters extends EventEmitterMixin(ReactiveComponent) {
  constructor() {
    super();

    this.defineProperty('filterCriteria', {
      neighborhood: '',
      answered: ''
    }, {
      type: 'object'
    });
  }

  // ========== Lifecycle ==========

  onConnect() {
    this.setupEventListeners();
  }

  onAfterRender() {
    this.attachFilterHandlers();
  }

  // ========== Event Handling ==========

  setupEventListeners() {
    // Will be attached after render
  }

  attachFilterHandlers() {
    const applyBtn = this.$('#btnApply');
    const resetBtn = this.$('#btnReset');
    const neighborhoodInput = this.$('#filterNeighborhood');
    const answeredSelect = this.$('#filterAnswered');

    if (applyBtn) {
      this.listen(applyBtn, 'click', () => this.applyFilters());
    }

    if (resetBtn) {
      this.listen(resetBtn, 'click', () => this.resetFilters());
    }

    // Live filtering
    if (neighborhoodInput) {
      this.listen(neighborhoodInput, 'input', (e) => {
        this.filterCriteria = {
          ...this.filterCriteria,
          neighborhood: e.target.value
        };
      });
    }

    if (answeredSelect) {
      this.listen(answeredSelect, 'change', (e) => {
        this.filterCriteria = {
          ...this.filterCriteria,
          answered: e.target.value
        };
      });
    }
  }

  applyFilters() {
    this.emitEvent('filter-change', {
      criteria: this.filterCriteria
    });
  }

  resetFilters() {
    this.filterCriteria = {
      neighborhood: '',
      answered: ''
    };

    // Reset form inputs
    const neighborhoodInput = this.$('#filterNeighborhood');
    const answeredSelect = this.$('#filterAnswered');

    if (neighborhoodInput) neighborhoodInput.value = '';
    if (answeredSelect) answeredSelect.value = '';

    this.emitEvent('filter-reset');
    this.emitEvent('filter-change', {
      criteria: this.filterCriteria
    });
  }

  // ========== Rendering ==========

  render() {
    const template = html`
      <style>${this.styles()}</style>
      <div class="filters-container">
        <div class="filter-group">
          <input
            id="filterNeighborhood"
            class="filter-input"
            type="text"
            placeholder="Filtrar por bairro"
            value="${this.filterCriteria.neighborhood}"
          />
        </div>

        <div class="filter-group">
          <select id="filterAnswered" class="filter-select">
            <option value="">Todos</option>
            <option value="true" ${this.filterCriteria.answered === 'true' ? 'selected' : ''}>
              Respondidos
            </option>
            <option value="false" ${this.filterCriteria.answered === 'false' ? 'selected' : ''}>
              Não respondidos
            </option>
          </select>
        </div>

        <div class="filter-actions">
          <button id="btnApply" class="btn btn-primary">
            Aplicar Filtro
          </button>
          <button id="btnReset" class="btn btn-secondary">
            Limpar
          </button>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = template;
  }

  styles() {
    return css`
      :host {
        display: block;
        width: 100%;
      }

      .filters-container {
        display: flex;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--filters-bg, #f5f5f5);
        border-radius: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .filter-group {
        flex: 1;
        min-width: 200px;
      }

      .filter-input,
      .filter-select {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: inherit;
        background: white;
        transition: border-color 0.2s;
      }

      .filter-input:focus,
      .filter-select:focus {
        outline: none;
        border-color: var(--primary-color, #5200e7);
        box-shadow: 0 0 0 3px rgba(82, 0, 231, 0.1);
      }

      .filter-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn {
        padding: 0.625rem 1.25rem;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }

      .btn-primary {
        background: var(--primary-color, #5200e7);
        color: white;
      }

      .btn-primary:hover {
        background: var(--primary-color-dark, #3d00b0);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(82, 0, 231, 0.3);
      }

      .btn-secondary {
        background: var(--secondary-bg, #e0e0e0);
        color: var(--text-primary, #333);
      }

      .btn-secondary:hover {
        background: var(--secondary-bg-hover, #d0d0d0);
      }

      .btn:active {
        transform: translateY(0);
      }

      @media (max-width: 768px) {
        .filters-container {
          flex-direction: column;
        }

        .filter-group {
          width: 100%;
        }

        .filter-actions {
          width: 100%;
        }

        .btn {
          flex: 1;
        }
      }
    `;
  }
}

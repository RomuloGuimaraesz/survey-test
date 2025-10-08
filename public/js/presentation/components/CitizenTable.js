/**
 * CitizenTable - Presentation Component
 * Manages the citizen data table with column switching
 * Single Responsibility: Table rendering and column navigation
 */
import { DateFormatter } from '../formatters/DateFormatter.js';
import { StatusFormatter } from '../formatters/StatusFormatter.js';
import { columnGroups } from '../../shared/utils/columnDefinitions.js';

export class CitizenTable {
  constructor(tableSelector, columnDefinitions, onRowClick) {
    this.table = document.getElementById('newContactsTable');
    this.columns = columnDefinitions;
    this.onRowClick = onRowClick;
    this.currentColumnIndex = 0;
    this.lastDirection = 0;
    this.citizens = [];
    this.mediaQuery = window.matchMedia('(min-width: 768px)');

    this.initializeElements();
    this.attachEventListeners();
    this.setupResizeHandler();
  }

  initializeElements() {
    this.tbody = this.table?.querySelector('tbody');
    this.dynamicHeader1 = document.getElementById('dynamicColumnHeader1');
    this.dynamicHeader2 = document.getElementById('dynamicColumnHeader2');
    this.columnIndicator = document.getElementById('columnIndicator');
    this.prevButton = document.getElementById('prevColumn');
    this.nextButton = document.getElementById('nextColumn');
  }

  isDesktop() {
    return this.mediaQuery.matches;
  }

  setupResizeHandler() {
    this.mediaQuery.addEventListener('change', (e) => {
      // Re-render table when crossing breakpoint
      if (this.citizens.length > 0) {
        this.currentColumnIndex = 0; // Reset to first group/column
        this.lastDirection = 0; // No animation on resize
        this.updateTableView();
      }
    });
  }

  attachEventListeners() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.switchColumn(-1));
    }
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.switchColumn(1));
    }
  }

  render(citizens) {
    this.citizens = citizens;
    this.updateTableView();
  }

  switchColumn(direction) {
    const newIndex = this.currentColumnIndex + direction;
    const maxIndex = this.isDesktop() ? columnGroups.length : this.columns.length;

    if (newIndex < 0 || newIndex >= maxIndex) {
      return;
    }

    this.currentColumnIndex = newIndex;
    this.lastDirection = direction;

    if (this.table) {
      this.table.classList.add('is-updating');
    }

    this.updateTableView();
  }

  updateTableView() {
    if (!this.tbody) return;

    const isDesktop = this.isDesktop();
    let currentColumns;

    if (isDesktop) {
      // Desktop: Use column groups (2 columns)
      const currentGroup = columnGroups[this.currentColumnIndex];
      currentColumns = currentGroup;

      // Update headers
      if (this.dynamicHeader1 && currentColumns[0]) {
        this.dynamicHeader1.textContent = currentColumns[0].label;
      }
      if (this.dynamicHeader2) {
        // Handle single-column groups (like "respondeu")
        this.dynamicHeader2.textContent = currentColumns[1] ? currentColumns[1].label : '';
        this.dynamicHeader2.style.display = currentColumns[1] ? '' : 'none';
      }

      // Update indicator
      if (this.columnIndicator) {
        const labels = currentColumns.map(col => col.label).join(' • ');
        this.columnIndicator.textContent = `Nome • ${labels}`;
      }

      // Update navigation buttons
      if (this.prevButton) {
        this.prevButton.disabled = this.currentColumnIndex === 0;
      }
      if (this.nextButton) {
        this.nextButton.disabled = this.currentColumnIndex === columnGroups.length - 1;
      }
    } else {
      // Mobile: Use single columns
      const currentColumn = this.columns[this.currentColumnIndex];
      currentColumns = [currentColumn];

      // Update header
      if (this.dynamicHeader1) {
        this.dynamicHeader1.textContent = currentColumn.label;
      }
      if (this.dynamicHeader2) {
        this.dynamicHeader2.style.display = 'none';
      }

      // Update indicator
      if (this.columnIndicator) {
        this.columnIndicator.textContent = `Nome • ${currentColumn.label}`;
      }

      // Update navigation buttons
      if (this.prevButton) {
        this.prevButton.disabled = this.currentColumnIndex === 0;
      }
      if (this.nextButton) {
        this.nextButton.disabled = this.currentColumnIndex === this.columns.length - 1;
      }
    }

    // Render table rows
    this.tbody.innerHTML = '';
    this.citizens.forEach(citizen => {
      const row = this.createRow(citizen, currentColumns);
      this.tbody.appendChild(row);
    });

    // Handle animations
    this.handleAnimations();
  }

  createRow(citizen, currentColumns) {
    const tr = document.createElement('tr');
    tr.onclick = () => {
      if (this.onRowClick) {
        this.onRowClick(citizen);
      }
    };

    // Name cell (fixed)
    const nameCell = document.createElement('td');
    nameCell.className = 'fixed-column';
    nameCell.textContent = citizen.name;
    nameCell.title = citizen.name;

    // Create dynamic cells based on columns array
    const dynamicCells = [];

    // First dynamic cell (always present)
    if (currentColumns[0]) {
      const dynamicCell1 = document.createElement('td');
      dynamicCell1.className = 'dynamic-cell';
      dynamicCell1.innerHTML = this.renderCellValue(citizen, currentColumns[0]);

      // Apply animation
      if (this.lastDirection !== 0) {
        const dirClass = this.lastDirection > 0 ? 'col-slide-in-right' : 'col-slide-in-left';
        dynamicCell1.classList.add(dirClass);
        dynamicCell1.addEventListener('animationend', () => {
          dynamicCell1.classList.remove('col-slide-in-left', 'col-slide-in-right');
        }, { once: true });
      }

      dynamicCells.push(dynamicCell1);
    }

    // Second dynamic cell (desktop only, if available)
    if (currentColumns[1]) {
      const dynamicCell2 = document.createElement('td');
      dynamicCell2.className = 'dynamic-cell desktop-only';
      dynamicCell2.innerHTML = this.renderCellValue(citizen, currentColumns[1]);

      // Apply animation
      if (this.lastDirection !== 0) {
        const dirClass = this.lastDirection > 0 ? 'col-slide-in-right' : 'col-slide-in-left';
        dynamicCell2.classList.add(dirClass);
        dynamicCell2.addEventListener('animationend', () => {
          dynamicCell2.classList.remove('col-slide-in-left', 'col-slide-in-right');
        }, { once: true });
      }

      dynamicCells.push(dynamicCell2);
    }

    // Action cell
    const actionCell = document.createElement('td');
    actionCell.className = 'action-cell';
    actionCell.innerHTML = `<button class="action-button secondary" onclick="event.stopPropagation(); window.citizenTable.openDetails(${citizen.id})">Detalhes</button>`;

    // Append all cells
    tr.appendChild(nameCell);
    dynamicCells.forEach(cell => tr.appendChild(cell));
    tr.appendChild(actionCell);

    return tr;
  }

  renderCellValue(citizen, column) {
    const value = this.getNestedValue(citizen, column.key);
    return column.render ? column.render(value, citizen) : (value || '—');
  }

  getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  handleAnimations() {
    if (!this.table) return;

    const dynamicCells = this.tbody.querySelectorAll('.dynamic-cell');
    if (this.lastDirection !== 0 && dynamicCells.length) {
      let done = 0;
      const total = dynamicCells.length;
      const cleanup = () => {
        done += 1;
        if (done >= total) {
          this.table.classList.remove('is-updating');
        }
      };
      dynamicCells.forEach(dc => dc.addEventListener('animationend', cleanup, { once: true }));

      // Fallback timeout
      setTimeout(() => this.table.classList.remove('is-updating'), 400);
    } else {
      requestAnimationFrame(() => this.table.classList.remove('is-updating'));
    }
  }

  openDetails(citizenId) {
    const citizen = this.citizens.find(c => c.id === citizenId);
    if (citizen && this.onRowClick) {
      this.onRowClick(citizen);
    }
  }
}

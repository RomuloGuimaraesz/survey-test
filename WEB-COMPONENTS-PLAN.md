# Web Components Refactoring Plan

## Overview

Convert current presentation components into **class-based Web Components** (Custom Elements) with full lifecycle management, Shadow DOM encapsulation, and reactive state handling.

---

## Goals

1. ✅ **Encapsulation** - Shadow DOM for style isolation
2. ✅ **Reusability** - Custom elements usable anywhere
3. ✅ **Lifecycle Management** - Full lifecycle hooks
4. ✅ **Reactive State** - Observed attributes and properties
5. ✅ **Event-Driven** - Custom events for communication
6. ✅ **Accessibility** - ARIA attributes and keyboard navigation
7. ✅ **Progressive Enhancement** - Graceful degradation

---

## Component Analysis

### Candidates for Web Components

| Current Component | Web Component Name | Priority | Complexity |
|-------------------|-------------------|----------|------------|
| StatisticsPanel | `<civic-statistics>` | High | Low |
| CitizenTable | `<citizen-table>` | High | Medium |
| CitizenDetailsPanel | `<citizen-details>` | High | Medium |
| AIChatWidget | `<ai-chat-widget>` | Medium | High |
| FilterBar | `<citizen-filters>` | Medium | Low |
| ColumnNavigation | `<table-column-nav>` | Low | Low |

---

## Web Component Architecture

```
web-components/
├── base/
│   ├── BaseComponent.js           # Abstract base class
│   ├── ReactiveComponent.js       # Reactive state management
│   └── TemplateComponent.js       # Template rendering
│
├── mixins/
│   ├── ObservableMixin.js         # Observable pattern
│   ├── EventEmitterMixin.js       # Custom events
│   └── AccessibilityMixin.js      # A11y helpers
│
├── components/
│   ├── CivicStatistics.js         # <civic-statistics>
│   ├── CitizenTable.js            # <citizen-table>
│   ├── CitizenDetails.js          # <citizen-details>
│   ├── AIChatWidget.js            # <ai-chat-widget>
│   └── CitizenFilters.js          # <citizen-filters>
│
├── utils/
│   ├── html.js                    # Tagged template literal
│   ├── css.js                     # CSS-in-JS helper
│   └── registry.js                # Component registration
│
└── index.js                       # Export all components
```

---

## Lifecycle Hooks Implementation

### Standard Web Component Lifecycle

```javascript
class CustomComponent extends HTMLElement {
  constructor() {
    super();
    // Initialize state, create shadow DOM
  }

  connectedCallback() {
    // Element added to DOM
    // Attach event listeners, fetch data
  }

  disconnectedCallback() {
    // Element removed from DOM
    // Cleanup: remove listeners, cancel requests
  }

  adoptedCallback() {
    // Element moved to new document
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Observed attribute changed
    // Update UI based on attribute
  }

  static get observedAttributes() {
    // Return array of observed attributes
    return ['data-source', 'filter', 'theme'];
  }
}
```

### Custom Lifecycle Hooks (Extended)

```javascript
class EnhancedComponent extends BaseComponent {
  // Standard lifecycle
  connectedCallback() {
    super.connectedCallback();
    this.onConnect();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.onDisconnect();
  }

  // Extended lifecycle
  async onConnect() {
    // Async initialization
    await this.fetchData();
    this.render();
  }

  onDisconnect() {
    // Cleanup
    this.cleanup();
  }

  onBeforeRender() {
    // Pre-render hook
  }

  onAfterRender() {
    // Post-render hook
  }

  onStateChange(property, oldValue, newValue) {
    // State change hook
    this.render();
  }

  onError(error) {
    // Error handling hook
  }
}
```

---

## Component Specifications

### 1. `<civic-statistics>` Component

**Purpose**: Display statistical overview with counters

**Attributes**:
- `data-source` - API endpoint or property binding
- `auto-refresh` - Auto-refresh interval (ms)
- `theme` - light|dark

**Properties**:
- `statistics` - Statistics object
- `loading` - Loading state

**Events**:
- `statistics-loaded` - Fired when data loaded
- `statistics-error` - Fired on error

**Lifecycle**:
```javascript
connectedCallback() {
  // Create shadow DOM
  // Setup auto-refresh if attribute set
  // Render initial state
}

attributeChangedCallback(name, old, new) {
  if (name === 'data-source') {
    this.fetchStatistics();
  }
}

disconnectedCallback() {
  // Clear refresh interval
  // Remove event listeners
}
```

---

### 2. `<citizen-table>` Component

**Purpose**: Display citizens with column switching

**Attributes**:
- `columns` - Column configuration JSON
- `current-column` - Current column index
- `selectable` - Enable row selection

**Properties**:
- `citizens` - Citizen data array
- `selectedRow` - Currently selected row

**Events**:
- `row-click` - Row clicked
- `column-change` - Column switched
- `selection-change` - Selection changed

**Slots**:
- `header` - Custom header content
- `footer` - Custom footer content
- `empty-state` - Content when no data

**Lifecycle**:
```javascript
connectedCallback() {
  // Setup shadow DOM
  // Initialize column state
  // Setup keyboard navigation
}

set citizens(data) {
  this._citizens = data;
  this.requestUpdate();
}

requestUpdate() {
  // Queue render on next frame
  if (!this._updateQueued) {
    this._updateQueued = true;
    requestAnimationFrame(() => {
      this.render();
      this._updateQueued = false;
    });
  }
}
```

---

### 3. `<citizen-details>` Component

**Purpose**: Slide-up panel with citizen details

**Attributes**:
- `open` - Panel open state
- `position` - bottom|right|left
- `modal` - Modal mode (blocks interaction)

**Properties**:
- `citizen` - Citizen data object
- `template` - Custom template function

**Events**:
- `open` - Panel opened
- `close` - Panel closed
- `action` - Action button clicked

**Lifecycle**:
```javascript
connectedCallback() {
  // Create shadow DOM with overlay
  // Setup ESC key handler
  // Add focus trap
}

attributeChangedCallback(name, old, new) {
  if (name === 'open') {
    new === 'true' ? this.open() : this.close();
  }
}

open() {
  this.setAttribute('open', 'true');
  this.trapFocus();
  this.dispatchEvent(new CustomEvent('open'));
}

close() {
  this.removeAttribute('open');
  this.releaseFocus();
  this.dispatchEvent(new CustomEvent('close'));
}
```

---

### 4. `<ai-chat-widget>` Component

**Purpose**: AI assistant chat interface

**Attributes**:
- `api-endpoint` - AI API endpoint
- `suggestions` - Quick suggestions JSON
- `position` - bottom-right|bottom-left|top-right

**Properties**:
- `messages` - Message history array
- `isOpen` - Chat open state
- `isProcessing` - Processing state

**Events**:
- `message-sent` - User sent message
- `message-received` - AI response received
- `chat-opened` - Chat opened
- `chat-closed` - Chat closed

**Lifecycle**:
```javascript
connectedCallback() {
  // Create shadow DOM
  // Load message history from localStorage
  // Setup auto-resize textarea
}

disconnectedCallback() {
  // Save message history
  // Cancel pending requests
}

async sendMessage(text) {
  this.isProcessing = true;
  try {
    const response = await this.processQuery(text);
    this.addMessage(response, 'bot');
    this.dispatchEvent(new CustomEvent('message-received', {
      detail: { response }
    }));
  } catch (error) {
    this.handleError(error);
  } finally {
    this.isProcessing = false;
  }
}
```

---

## Base Component Classes

### BaseComponent

```javascript
export class BaseComponent extends HTMLElement {
  constructor() {
    super();
    this._state = {};
    this._shadowRoot = this.attachShadow({ mode: 'open' });
  }

  // State management
  setState(updates) {
    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };
    this.onStateChange(oldState, this._state);
    this.requestUpdate();
  }

  getState() {
    return { ...this._state };
  }

  // Rendering
  requestUpdate() {
    if (!this._updateQueued) {
      this._updateQueued = true;
      requestAnimationFrame(() => {
        this.onBeforeRender();
        this.render();
        this.onAfterRender();
        this._updateQueued = false;
      });
    }
  }

  render() {
    throw new Error('render() must be implemented');
  }

  // Lifecycle hooks
  onBeforeRender() {}
  onAfterRender() {}
  onStateChange(oldState, newState) {}
  onError(error) {
    console.error(`[${this.tagName}] Error:`, error);
  }

  // Cleanup
  cleanup() {
    // Override in subclasses
  }

  disconnectedCallback() {
    this.cleanup();
  }
}
```

### ReactiveComponent

```javascript
export class ReactiveComponent extends BaseComponent {
  constructor() {
    super();
    this._observers = new Map();
  }

  // Create reactive property
  defineReactiveProperty(name, initialValue) {
    let value = initialValue;

    Object.defineProperty(this, name, {
      get() {
        return value;
      },
      set(newValue) {
        const oldValue = value;
        value = newValue;
        this.notifyPropertyChange(name, oldValue, newValue);
        this.requestUpdate();
      },
      enumerable: true,
      configurable: true
    });
  }

  // Observer pattern
  observe(property, callback) {
    if (!this._observers.has(property)) {
      this._observers.set(property, []);
    }
    this._observers.get(property).push(callback);
  }

  notifyPropertyChange(property, oldValue, newValue) {
    const observers = this._observers.get(property) || [];
    observers.forEach(callback => callback(newValue, oldValue));
  }

  cleanup() {
    super.cleanup();
    this._observers.clear();
  }
}
```

---

## Mixins

### ObservableMixin

```javascript
export const ObservableMixin = (Base) => class extends Base {
  constructor() {
    super();
    this._eventBus = new Map();
  }

  on(event, handler) {
    if (!this._eventBus.has(event)) {
      this._eventBus.set(event, []);
    }
    this._eventBus.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this._eventBus.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  emit(event, data) {
    const handlers = this._eventBus.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  cleanup() {
    super.cleanup?.();
    this._eventBus.clear();
  }
};
```

### EventEmitterMixin

```javascript
export const EventEmitterMixin = (Base) => class extends Base {
  dispatchCustomEvent(type, detail = {}, options = {}) {
    const event = new CustomEvent(type, {
      detail,
      bubbles: options.bubbles !== false,
      composed: options.composed !== false,
      cancelable: options.cancelable || false
    });
    return this.dispatchEvent(event);
  }

  waitForEvent(type, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Event ${type} timeout`));
      }, timeout);

      this.addEventListener(type, (event) => {
        clearTimeout(timer);
        resolve(event);
      }, { once: true });
    });
  }
};
```

---

## Template & Styling

### Tagged Template Literal (lit-html style)

```javascript
export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
}

export function css(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
}
```

### Example Usage

```javascript
class CivicStatistics extends ReactiveComponent {
  render() {
    const template = html`
      <style>${this.styles()}</style>
      <div class="statistics">
        <div class="stat-item">
          <span class="count">${this.state.total}</span>
          <span class="label">Total</span>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = template;
  }

  styles() {
    return css`
      :host {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }
      .stat-item {
        background: var(--stat-bg, #fff);
        padding: 1rem;
        border-radius: 8px;
      }
    `;
  }
}
```

---

## Event Communication Pattern

```
┌─────────────────────────────────────────┐
│         Parent Component                │
│                                         │
│  <civic-statistics>                     │
│  <citizen-filters>                      │
│  <citizen-table                         │
│    @row-click="${this.handleRowClick}"  │
│  </citizen-table>                       │
│  <citizen-details>                      │
└─────────────────────────────────────────┘
           │           ▲
   dispatch │           │ listen
    event   ▼           │
┌─────────────────────────────────────────┐
│     Child Component (citizen-table)     │
│                                         │
│  handleClick() {                        │
│    this.dispatchEvent(                  │
│      new CustomEvent('row-click', {     │
│        detail: { citizen },             │
│        bubbles: true                    │
│      })                                 │
│    );                                   │
│  }                                      │
└─────────────────────────────────────────┘
```

---

## HTML Usage

### Before (Plain JavaScript)

```html
<div class="quick-stats">
  <div class="quick-stats-item">...</div>
</div>
<div class="contacts-table-container">
  <table id="newContactsTable">...</table>
</div>
```

### After (Web Components)

```html
<civic-statistics
  data-source="/api/statistics"
  auto-refresh="30000"
  theme="light">
</civic-statistics>

<citizen-filters
  @filter-change="${handleFilterChange}">
</citizen-filters>

<citizen-table
  columns='["age", "neighborhood", "status"]'
  current-column="0"
  @row-click="${handleRowClick}">
  <div slot="empty-state">
    <p>No citizens found</p>
  </div>
</citizen-table>

<citizen-details
  position="bottom"
  modal="true">
</citizen-details>

<ai-chat-widget
  api-endpoint="/api/admin/agent-ui"
  position="bottom-right"
  suggestions='["Satisfaction analysis", "System status"]'>
</ai-chat-widget>
```

---

## Benefits

### Encapsulation
✅ Shadow DOM isolates styles
✅ No CSS conflicts
✅ Internal DOM hidden from outside

### Reusability
✅ Use anywhere with `<civic-statistics>`
✅ Framework-agnostic
✅ Self-contained

### Lifecycle Management
✅ Automatic cleanup on removal
✅ Memory leak prevention
✅ Resource management

### Reactive State
✅ Automatic re-rendering
✅ Efficient updates
✅ Property observation

### Browser Native
✅ No framework dependency
✅ Future-proof
✅ Performance optimized

---

## Migration Strategy

### Phase 1: Foundation (Base Classes)
1. Create `BaseComponent`
2. Create `ReactiveComponent`
3. Create mixins (Observable, EventEmitter)
4. Create template utilities

### Phase 2: Simple Components
1. `<civic-statistics>` - Low complexity
2. `<citizen-filters>` - Low complexity
3. Test lifecycle and events

### Phase 3: Complex Components
1. `<citizen-table>` - Medium complexity
2. `<citizen-details>` - Medium complexity
3. Test integration

### Phase 4: Advanced Components
1. `<ai-chat-widget>` - High complexity
2. Test full application
3. Performance optimization

### Phase 5: Integration
1. Update `main.js` to register components
2. Update `admin.html` to use custom elements
3. Migrate event handlers
4. Remove old component code

---

## Testing Strategy

### Unit Tests
```javascript
describe('CivicStatistics', () => {
  it('should render statistics', async () => {
    const el = document.createElement('civic-statistics');
    el.statistics = { total: 100 };
    document.body.appendChild(el);

    await el.updateComplete;

    const count = el.shadowRoot.querySelector('.count');
    expect(count.textContent).toBe('100');
  });

  it('should emit statistics-loaded event', (done) => {
    const el = document.createElement('civic-statistics');
    el.addEventListener('statistics-loaded', (e) => {
      expect(e.detail.total).toBe(100);
      done();
    });
    el.statistics = { total: 100 };
  });
});
```

### Integration Tests
```javascript
describe('Component Communication', () => {
  it('should update details when table row clicked', async () => {
    const table = document.createElement('citizen-table');
    const details = document.createElement('citizen-details');

    table.addEventListener('row-click', (e) => {
      details.citizen = e.detail.citizen;
    });

    // Simulate click
    table.selectRow(mockCitizen);

    await details.updateComplete;
    expect(details.citizen).toEqual(mockCitizen);
  });
});
```

---

## Next Steps

1. ✅ Create base component architecture
2. ✅ Implement mixins and utilities
3. ✅ Convert simple components first
4. ✅ Test lifecycle hooks thoroughly
5. ✅ Convert complex components
6. ✅ Update HTML and composition root
7. ✅ Full integration testing
8. ✅ Performance benchmarking

---

**Status**: Ready to implement
**Estimated Files**: 15-20 new files
**Estimated LOC**: ~3,000 lines
**Benefits**: Native browser APIs, no framework dependency, full encapsulation

/**
 * AccessibilityMixin
 * Adds accessibility helpers to components
 */

export const AccessibilityMixin = (Base) => class extends Base {
  constructor() {
    super();
    this._focusTrap = null;
  }

  /**
   * Set ARIA attribute
   * @param {string} name - Attribute name (without 'aria-')
   * @param {string} value - Attribute value
   */
  setAria(name, value) {
    this.setAttribute(`aria-${name}`, value);
  }

  /**
   * Get ARIA attribute
   * @param {string} name - Attribute name (without 'aria-')
   * @returns {string|null}
   */
  getAria(name) {
    return this.getAttribute(`aria-${name}`);
  }

  /**
   * Make element focusable
   */
  makeFocusable() {
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
  }

  /**
   * Make element unfocusable
   */
  makeUnfocusable() {
    this.setAttribute('tabindex', '-1');
  }

  /**
   * Setup keyboard navigation
   * @param {Object} keyMap - Key to handler map
   */
  setupKeyboardNav(keyMap) {
    const handler = (event) => {
      const key = event.key;
      if (keyMap[key]) {
        event.preventDefault();
        keyMap[key].call(this, event);
      }
    };

    this.listen(this, 'keydown', handler);
  }

  /**
   * Trap focus within element
   * @param {boolean} enable - Enable trap
   */
  trapFocus(enable = true) {
    if (enable) {
      this._focusTrap = this.createFocusTrap();
    } else if (this._focusTrap) {
      this._focusTrap.deactivate();
      this._focusTrap = null;
    }
  }

  /**
   * Create focus trap
   * @returns {Object}
   */
  createFocusTrap() {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handler = (event) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    this.listen(this, 'keydown', handler);

    // Focus first element
    firstElement.focus();

    return {
      deactivate: () => {
        // Cleanup handled by listen()
      }
    };
  }

  /**
   * Get all focusable elements in shadow DOM
   * @returns {Array<Element>}
   */
  getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    return Array.from(this.shadowRoot.querySelectorAll(selector));
  }

  /**
   * Announce to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' | 'assertive'
   */
  announce(message, priority = 'polite') {
    const announcer = document.getElementById('aria-live-announcer') ||
      this.createAnnouncer();

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }

  /**
   * Create ARIA live announcer
   * @returns {HTMLElement}
   */
  createAnnouncer() {
    let announcer = document.getElementById('aria-live-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'aria-live-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    return announcer;
  }

  /**
   * Cleanup override
   */
  cleanup() {
    if (this._focusTrap) {
      this._focusTrap.deactivate();
      this._focusTrap = null;
    }
    super.cleanup?.();
  }
};

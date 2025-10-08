/**
 * EventEmitterMixin
 * Adds enhanced event emission capabilities to components
 */

export const EventEmitterMixin = (Base) => class extends Base {
  constructor() {
    super();
    this._eventListeners = new Map();
  }

  /**
   * Emit custom event with enhanced options
   * @param {string} type - Event type
   * @param {*} detail - Event detail data
   * @param {Object} options - Event options
   * @returns {boolean} - false if cancelled
   */
  emitEvent(type, detail = null, options = {}) {
    const event = new CustomEvent(type, {
      detail,
      bubbles: options.bubbles !== false,
      composed: options.composed !== false,
      cancelable: options.cancelable || false
    });

    const dispatched = this.dispatchEvent(event);

    // Log if debug mode
    if (this.hasAttribute('debug')) {
      console.log(`[${this.tagName}] Event ${type}:`, detail);
    }

    return dispatched;
  }

  /**
   * Wait for specific event
   * @param {string} type - Event type
   * @param {number} timeout - Timeout in ms
   * @returns {Promise<CustomEvent>}
   */
  waitForEvent(type, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeEventListener(type, handler);
        reject(new Error(`Event ${type} timeout after ${timeout}ms`));
      }, timeout);

      const handler = (event) => {
        clearTimeout(timer);
        resolve(event);
      };

      this.addEventListener(type, handler, { once: true });
    });
  }

  /**
   * Listen to event and track for cleanup
   * @param {EventTarget} target - Event target
   * @param {string} type - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  listen(target, type, handler, options = {}) {
    target.addEventListener(type, handler, options);

    // Track for cleanup
    if (!this._eventListeners.has(target)) {
      this._eventListeners.set(target, []);
    }

    this._eventListeners.get(target).push({ type, handler, options });

    // Register cleanup
    this.registerCleanup(() => {
      target.removeEventListener(type, handler, options);
    });
  }

  /**
   * Remove all tracked listeners
   */
  removeAllListeners() {
    this._eventListeners.forEach((listeners, target) => {
      listeners.forEach(({ type, handler, options }) => {
        target.removeEventListener(type, handler, options);
      });
    });
    this._eventListeners.clear();
  }

  /**
   * Cleanup override
   */
  cleanup() {
    this.removeAllListeners();
    super.cleanup?.();
  }
};

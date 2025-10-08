/**
 * BaseComponent - Abstract base class for Web Components
 * Provides core functionality and lifecycle management
 */

export class BaseComponent extends HTMLElement {
  constructor() {
    super();

    // Internal state
    this._state = {};
    this._updateQueued = false;
    this._isConnected = false;
    this._cleanupTasks = [];

    // Create shadow DOM
    this._shadowRoot = this.attachShadow({
      mode: this.constructor.shadowMode || 'open'
    });
  }

  // ========== State Management ==========

  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Update state and trigger re-render
   * @param {Object} updates - State updates
   */
  setState(updates) {
    if (typeof updates !== 'object') {
      throw new Error('setState expects an object');
    }

    const oldState = { ...this._state };
    this._state = { ...this._state, ...updates };

    this.onStateChange(oldState, this._state);
    this.requestUpdate();
  }

  // ========== Rendering ==========

  /**
   * Request update on next animation frame
   */
  requestUpdate() {
    if (!this._updateQueued && this._isConnected) {
      this._updateQueued = true;
      requestAnimationFrame(() => {
        try {
          this.onBeforeRender();
          this.render();
          this.onAfterRender();
        } catch (error) {
          this.onError(error);
        } finally {
          this._updateQueued = false;
        }
      });
    }
  }

  /**
   * Render the component (must be implemented by subclasses)
   */
  render() {
    throw new Error(`${this.constructor.name} must implement render()`);
  }

  /**
   * Get shadowRoot for rendering
   */
  get shadowRoot() {
    return this._shadowRoot;
  }

  // ========== Lifecycle Hooks ==========

  /**
   * Standard: Element added to DOM
   */
  connectedCallback() {
    this._isConnected = true;
    this.onConnect();
    this.requestUpdate();
  }

  /**
   * Standard: Element removed from DOM
   */
  disconnectedCallback() {
    this._isConnected = false;
    this.onDisconnect();
    this.cleanup();
  }

  /**
   * Standard: Element moved to new document
   */
  adoptedCallback() {
    this.onAdopted();
  }

  /**
   * Standard: Observed attribute changed
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.onAttributeChange(name, oldValue, newValue);
      this.requestUpdate();
    }
  }

  /**
   * Define observed attributes
   */
  static get observedAttributes() {
    return [];
  }

  // ========== Extended Lifecycle Hooks ==========

  /**
   * Hook: Called when component connects to DOM
   */
  onConnect() {
    // Override in subclasses
  }

  /**
   * Hook: Called when component disconnects from DOM
   */
  onDisconnect() {
    // Override in subclasses
  }

  /**
   * Hook: Called when moved to new document
   */
  onAdopted() {
    // Override in subclasses
  }

  /**
   * Hook: Called before render
   */
  onBeforeRender() {
    // Override in subclasses
  }

  /**
   * Hook: Called after render
   */
  onAfterRender() {
    // Override in subclasses
  }

  /**
   * Hook: Called when state changes
   * @param {Object} oldState
   * @param {Object} newState
   */
  onStateChange(oldState, newState) {
    // Override in subclasses
  }

  /**
   * Hook: Called when attribute changes
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  onAttributeChange(name, oldValue, newValue) {
    // Override in subclasses
  }

  /**
   * Hook: Called on error
   * @param {Error} error
   */
  onError(error) {
    console.error(`[${this.tagName}] Error:`, error);
  }

  // ========== Cleanup Management ==========

  /**
   * Register cleanup task
   * @param {Function} task
   */
  registerCleanup(task) {
    this._cleanupTasks.push(task);
  }

  /**
   * Execute all cleanup tasks
   */
  cleanup() {
    this._cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('[Cleanup] Error:', error);
      }
    });
    this._cleanupTasks = [];
  }

  // ========== Utilities ==========

  /**
   * Select element from shadow DOM
   * @param {string} selector
   * @returns {Element|null}
   */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  /**
   * Select all elements from shadow DOM
   * @param {string} selector
   * @returns {NodeList}
   */
  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }

  /**
   * Dispatch custom event
   * @param {string} type
   * @param {*} detail
   * @param {Object} options
   */
  emit(type, detail = null, options = {}) {
    const event = new CustomEvent(type, {
      detail,
      bubbles: options.bubbles !== false,
      composed: options.composed !== false,
      cancelable: options.cancelable || false
    });
    return this.dispatchEvent(event);
  }

  /**
   * Get attribute as boolean
   * @param {string} name
   * @returns {boolean}
   */
  getBooleanAttribute(name) {
    return this.hasAttribute(name);
  }

  /**
   * Get attribute as JSON
   * @param {string} name
   * @param {*} defaultValue
   * @returns {*}
   */
  getJSONAttribute(name, defaultValue = null) {
    const value = this.getAttribute(name);
    if (!value) return defaultValue;

    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`[${this.tagName}] Invalid JSON in attribute ${name}:`, error);
      return defaultValue;
    }
  }

  /**
   * Wait for component to be ready
   * @returns {Promise<void>}
   */
  get updateComplete() {
    return new Promise(resolve => {
      if (!this._updateQueued) {
        resolve();
      } else {
        requestAnimationFrame(() => resolve());
      }
    });
  }
}

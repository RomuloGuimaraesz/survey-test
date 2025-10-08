/**
 * ReactiveComponent - Base component with reactive properties
 * Extends BaseComponent with property observation and reactivity
 */

import { BaseComponent } from './BaseComponent.js';

export class ReactiveComponent extends BaseComponent {
  constructor() {
    super();

    // Property observers
    this._observers = new Map();
    this._properties = new Map();
  }

  // ========== Reactive Properties ==========

  /**
   * Define a reactive property
   * @param {string} name - Property name
   * @param {*} initialValue - Initial value
   * @param {Object} options - Property options
   */
  defineProperty(name, initialValue, options = {}) {
    let value = initialValue;

    // Store property metadata
    this._properties.set(name, {
      value: initialValue,
      type: options.type,
      reflect: options.reflect || false,
      converter: options.converter,
      validator: options.validator
    });

    // Define getter/setter
    Object.defineProperty(this, name, {
      get() {
        return value;
      },
      set(newValue) {
        const oldValue = value;

        // Validate if validator provided
        if (options.validator && !options.validator(newValue)) {
          console.warn(`[${this.tagName}] Invalid value for ${name}:`, newValue);
          return;
        }

        // Convert if converter provided
        if (options.converter) {
          newValue = options.converter(newValue);
        }

        // Type checking
        if (options.type && !this.validateType(newValue, options.type)) {
          console.warn(`[${this.tagName}] Type mismatch for ${name}. Expected ${options.type}`);
          return;
        }

        value = newValue;

        // Reflect to attribute if needed
        if (options.reflect) {
          this.reflectPropertyToAttribute(name, newValue);
        }

        // Notify observers
        this.notifyPropertyChange(name, oldValue, newValue);

        // Trigger update
        this.requestUpdate();
      },
      enumerable: true,
      configurable: true
    });

    // Initialize value
    this[name] = initialValue;
  }

  /**
   * Validate value type
   * @param {*} value
   * @param {Function|string} type
   * @returns {boolean}
   */
  validateType(value, type) {
    if (typeof type === 'string') {
      return typeof value === type;
    }
    if (typeof type === 'function') {
      return value instanceof type;
    }
    return true;
  }

  /**
   * Reflect property to attribute
   * @param {string} name
   * @param {*} value
   */
  reflectPropertyToAttribute(name, value) {
    const attrName = this.camelToKebab(name);

    if (value === null || value === undefined || value === false) {
      this.removeAttribute(attrName);
    } else if (value === true) {
      this.setAttribute(attrName, '');
    } else if (typeof value === 'object') {
      this.setAttribute(attrName, JSON.stringify(value));
    } else {
      this.setAttribute(attrName, String(value));
    }
  }

  /**
   * Convert camelCase to kebab-case
   * @param {string} str
   * @returns {string}
   */
  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  // ========== Observer Pattern ==========

  /**
   * Observe property changes
   * @param {string} property
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  observe(property, callback) {
    if (!this._observers.has(property)) {
      this._observers.set(property, new Set());
    }

    this._observers.get(property).add(callback);

    // Return unsubscribe function
    return () => {
      const observers = this._observers.get(property);
      if (observers) {
        observers.delete(callback);
      }
    };
  }

  /**
   * Notify property change to observers
   * @param {string} property
   * @param {*} oldValue
   * @param {*} newValue
   */
  notifyPropertyChange(property, oldValue, newValue) {
    const observers = this._observers.get(property);
    if (observers && observers.size > 0) {
      observers.forEach(callback => {
        try {
          callback(newValue, oldValue, property);
        } catch (error) {
          console.error(`[${this.tagName}] Observer error:`, error);
        }
      });
    }
  }

  /**
   * Unobserve property
   * @param {string} property
   * @param {Function} callback
   */
  unobserve(property, callback) {
    const observers = this._observers.get(property);
    if (observers) {
      observers.delete(callback);
    }
  }

  // ========== Computed Properties ==========

  /**
   * Define computed property
   * @param {string} name
   * @param {Function} computer
   * @param {Array<string>} dependencies
   */
  defineComputed(name, computer, dependencies = []) {
    let cachedValue;
    let isDirty = true;

    // Watch dependencies
    dependencies.forEach(dep => {
      this.observe(dep, () => {
        isDirty = true;
        this.requestUpdate();
      });
    });

    // Define getter
    Object.defineProperty(this, name, {
      get() {
        if (isDirty) {
          cachedValue = computer.call(this);
          isDirty = false;
        }
        return cachedValue;
      },
      enumerable: true,
      configurable: true
    });
  }

  // ========== Cleanup ==========

  cleanup() {
    super.cleanup();
    this._observers.clear();
    this._properties.clear();
  }
}

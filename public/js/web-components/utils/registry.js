/**
 * Component Registry
 * Centralized custom element registration
 */

const registry = new Map();

/**
 * Register a custom element
 * @param {string} tagName
 * @param {CustomElementConstructor} constructor
 * @param {ElementDefinitionOptions} options
 */
export function registerComponent(tagName, constructor, options = {}) {
  if (registry.has(tagName)) {
    console.warn(`[Registry] Component ${tagName} already registered`);
    return;
  }

  try {
    customElements.define(tagName, constructor, options);
    registry.set(tagName, constructor);
    console.log(`[Registry] Registered: ${tagName}`);
  } catch (error) {
    console.error(`[Registry] Failed to register ${tagName}:`, error);
    throw error;
  }
}

/**
 * Check if component is registered
 * @param {string} tagName
 * @returns {boolean}
 */
export function isRegistered(tagName) {
  return registry.has(tagName);
}

/**
 * Get registered component constructor
 * @param {string} tagName
 * @returns {CustomElementConstructor|undefined}
 */
export function getComponent(tagName) {
  return registry.get(tagName);
}

/**
 * Get all registered components
 * @returns {Map<string, CustomElementConstructor>}
 */
export function getAllComponents() {
  return new Map(registry);
}

/**
 * Wait for component to be defined
 * @param {string} tagName
 * @returns {Promise<CustomElementConstructor>}
 */
export function whenDefined(tagName) {
  return customElements.whenDefined(tagName);
}

/**
 * Template Utilities
 * Tagged template literals for HTML and CSS
 */

/**
 * HTML template literal helper
 * @param {TemplateStringsArray} strings
 * @param  {...any} values
 * @returns {string}
 */
export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    const value = values[i];

    // Handle arrays (for loops)
    if (Array.isArray(value)) {
      return result + string + value.join('');
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
      return result + string;
    }

    // Handle objects (for attributes)
    if (typeof value === 'object' && value !== null) {
      return result + string + JSON.stringify(value);
    }

    return result + string + value;
  }, '');
}

/**
 * CSS template literal helper
 * @param {TemplateStringsArray} strings
 * @param  {...any} values
 * @returns {string}
 */
export function css(strings, ...values) {
  return strings.reduce((result, string, i) => {
    return result + string + (values[i] || '');
  }, '');
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Parse HTML string to DOM nodes
 * @param {string} htmlString
 * @returns {DocumentFragment}
 */
export function parseHTML(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  return template.content;
}

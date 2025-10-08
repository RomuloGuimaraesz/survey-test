/**
 * Web Components Registry
 * Registers all custom elements
 */

import { registerComponent } from './utils/registry.js';

// Import components
import { CivicStatistics } from './components/CivicStatistics.js';
import { CitizenFilters } from './components/CitizenFilters.js';
import { QuickStats } from './components/QuickStats.js';
import { AIChat } from './components/AIChat.js';

/**
 * Register all components
 */
export function registerAllComponents() {
  console.log('[Web Components] Registering components...');

  try {
    // Register components
    registerComponent('civic-statistics', CivicStatistics);
    registerComponent('citizen-filters', CitizenFilters);
    registerComponent('quick-stats', QuickStats);
    registerComponent('ai-chat', AIChat);

    console.log('[Web Components] All components registered successfully');
    return true;
  } catch (error) {
    console.error('[Web Components] Registration failed:', error);
    return false;
  }
}

/**
 * Auto-register if module is imported
 */
if (typeof window !== 'undefined') {
  // Register when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerAllComponents);
  } else {
    registerAllComponents();
  }
}

// Export components for direct use
export {
  CivicStatistics,
  CitizenFilters,
  QuickStats,
  AIChat
};

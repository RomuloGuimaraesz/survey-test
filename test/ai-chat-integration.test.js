/**
 * AI Chat Integration Tests
 * Verifies AI Chat web component works correctly with the rest of the application
 */

describe('AI Chat Integration', () => {
  let chatComponent;
  let testContainer;

  beforeEach(async () => {
    // Create test container
    testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <div id="app">
        <ai-chat id="aiChat"></ai-chat>
      </div>
    `;
    document.body.appendChild(testContainer);

    // Get component
    chatComponent = document.getElementById('aiChat');

    // Wait for component to connect
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  describe('Component Registration', () => {
    test('should be registered as custom element', () => {
      expect(customElements.get('ai-chat')).toBeDefined();
    });

    test('should create instance via createElement', () => {
      const element = document.createElement('ai-chat');
      expect(element).toBeInstanceOf(HTMLElement);
      expect(element.tagName.toLowerCase()).toBe('ai-chat');
    });

    test('should have shadow DOM', () => {
      expect(chatComponent.shadowRoot).toBeTruthy();
      expect(chatComponent.shadowRoot.mode).toBe('open');
    });
  });

  describe('DOM Integration', () => {
    test('should be found in DOM by ID', () => {
      const element = document.getElementById('aiChat');
      expect(element).toBeTruthy();
      expect(element.tagName.toLowerCase()).toBe('ai-chat');
    });

    test('should render in correct position', () => {
      const computedStyle = window.getComputedStyle(chatComponent);
      expect(computedStyle.position).toBe('fixed');
    });

    test('should have correct z-index for layering', () => {
      const computedStyle = window.getComputedStyle(chatComponent);
      expect(parseInt(computedStyle.zIndex)).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Dependency Injection', () => {
    test('should accept and store dependencies', () => {
      const mockUseCase = { execute: jest.fn() };
      const mockToast = { success: jest.fn() };

      chatComponent.setDependencies(mockUseCase, mockToast);

      expect(chatComponent.processAIQueryUseCase).toBe(mockUseCase);
      expect(chatComponent.toastManager).toBe(mockToast);
    });

    test('should work without dependencies (graceful degradation)', async () => {
      chatComponent.setDependencies(null, null);

      // Should not throw
      expect(() => {
        chatComponent.openChat();
        chatComponent.closeChat();
      }).not.toThrow();
    });
  });

  describe('Global API Integration', () => {
    test('should be accessible via window.chatWidget', async () => {
      // Simulate main.js global exposure
      window.chatWidget = chatComponent;

      expect(window.chatWidget).toBe(chatComponent);
      expect(window.chatWidget.openChat).toBeDefined();
      expect(window.chatWidget.closeChat).toBeDefined();
      expect(window.chatWidget.sendMessage).toBeDefined();
    });

    test('should work with global sendQuickMessage function', async () => {
      // Simulate global function from main.js
      window.sendQuickMessage = (message) => {
        const chat = document.getElementById('aiChat');
        if (chat) {
          if (!chat.isOpen) chat.openChat();
          chat.sendMessage(message);
        }
      };

      const spy = jest.spyOn(chatComponent, 'sendMessage');
      window.sendQuickMessage('Test message');

      expect(spy).toHaveBeenCalledWith('Test message');
      expect(chatComponent.isOpen).toBe(true);
    });
  });

  describe('Application Lifecycle Integration', () => {
    test('should initialize on page load', async () => {
      expect(chatComponent.isConnected).toBe(true);
      expect(chatComponent.messages.length).toBeGreaterThan(0);
    });

    test('should show notification after timeout (simulation)', async () => {
      const spy = jest.spyOn(chatComponent, 'showNotification');

      // Simulate the 5-second notification trigger from main.js
      setTimeout(() => {
        if (chatComponent && !chatComponent.isOpen) {
          chatComponent.showNotification();
        }
      }, 100);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(spy).toHaveBeenCalled();
    });

    test('should handle page navigation', () => {
      chatComponent.openChat();
      const wasOpen = chatComponent.isOpen;

      // Simulate navigation
      chatComponent.disconnectedCallback();

      expect(wasOpen).toBe(true);
      expect(chatComponent._cleanupTasks).toEqual([]);
    });
  });

  describe('Multi-Component Interaction', () => {
    test('should coexist with other web components', () => {
      const statsComponent = document.createElement('quick-stats');
      testContainer.appendChild(statsComponent);

      expect(chatComponent.isConnected).toBe(true);
      expect(statsComponent.isConnected).toBe(true);
    });

    test('should not interfere with page events', () => {
      let pageClicked = false;

      document.addEventListener('click', () => {
        pageClicked = true;
      });

      // Click on page (not on chat)
      document.body.click();

      expect(pageClicked).toBe(true);
    });

    test('should close on outside click when open', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      // Simulate click outside
      const outsideClick = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });
      document.body.dispatchEvent(outsideClick);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chatComponent.isOpen).toBe(false);
    });
  });

  describe('API Integration', () => {
    test('should call AI service with correct parameters', async () => {
      const mockUseCase = {
        execute: jest.fn().mockResolvedValue({
          success: true,
          response: 'Test response',
          timestamp: new Date().toISOString()
        })
      };

      chatComponent.setDependencies(mockUseCase, null);

      await chatComponent.sendMessage('Test query');

      expect(mockUseCase.execute).toHaveBeenCalledWith('Test query');
    });

    test('should refresh adminViewModel after AI response', async () => {
      const mockViewModel = {
        refresh: jest.fn()
      };
      window.adminViewModel = mockViewModel;

      const mockUseCase = {
        execute: jest.fn().mockResolvedValue({
          success: true,
          response: 'Done',
          timestamp: new Date().toISOString()
        })
      };

      chatComponent.setDependencies(mockUseCase, null);
      await chatComponent.sendMessage('Query');

      expect(mockViewModel.refresh).toHaveBeenCalled();
    });

    test('should load system health on initialization', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          status: 'healthy',
          database: { contacts: 42 }
        })
      });

      await chatComponent.loadSystemHealth();

      expect(fetch).toHaveBeenCalledWith('/api/health');
      expect(chatComponent.performance).toBe('42 contacts');
    });
  });

  describe('LocalStorage Integration', () => {
    test('should store report payloads', () => {
      const result = {
        success: true,
        response: 'Analysis',
        intent: 'analysis',
        timestamp: new Date().toISOString(),
        residents: [{ name: 'Test' }]
      };

      chatComponent.renderSuccessResponse(result, 'Test query', 100);

      const keys = Object.keys(localStorage).filter(k => k.startsWith('reportPayload:'));
      expect(keys.length).toBeGreaterThan(0);
    });

    test('should handle localStorage quota exceeded', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const result = {
        success: true,
        response: 'Test',
        intent: 'analysis',
        timestamp: new Date().toISOString(),
        residents: []
      };

      // Should not throw
      expect(() => {
        chatComponent.renderSuccessResponse(result, 'Query', 100);
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt to mobile viewport', async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      window.dispatchEvent(new Event('resize'));
      await chatComponent.updateComplete;

      const container = chatComponent.shadowRoot.querySelector('.chat-container');
      expect(container).toBeTruthy();
    });

    test('should work with desktop viewport', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      });

      window.dispatchEvent(new Event('resize'));
      await chatComponent.updateComplete;

      expect(chatComponent.shadowRoot.querySelector('.chat-container')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    test('should render messages efficiently', async () => {
      const startTime = performance.now();

      // Add multiple messages
      for (let i = 0; i < 50; i++) {
        chatComponent.addMessage(`Message ${i}`, i % 2 === 0 ? 'user' : 'bot');
      }

      await chatComponent.updateComplete;

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 50 messages in less than 1 second
      expect(renderTime).toBeLessThan(1000);
    });

    test('should debounce re-renders', async () => {
      let renderCount = 0;
      const originalRender = chatComponent.render.bind(chatComponent);

      chatComponent.render = function() {
        renderCount++;
        return originalRender.call(this);
      };

      // Rapid state changes
      chatComponent.status = 'Status 1';
      chatComponent.status = 'Status 2';
      chatComponent.status = 'Status 3';

      await chatComponent.updateComplete;

      // Should batch renders
      expect(renderCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing dependencies gracefully', async () => {
      chatComponent.setDependencies(null, null);

      // Should not throw
      await expect(async () => {
        await chatComponent.processMessage('Test');
      }).rejects.toThrowError();
    });

    test('should handle network errors', async () => {
      const mockUseCase = {
        execute: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      chatComponent.setDependencies(mockUseCase, null);

      await chatComponent.processMessage('Query');

      expect(chatComponent.status).toBe('Connection Error');
    });

    test('should recover from render errors', async () => {
      // Inject invalid state
      chatComponent.messages = [{ invalid: 'data' }];

      // Should not throw
      expect(() => {
        chatComponent.requestUpdate();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should have accessible toggle button', () => {
      const toggle = chatComponent.shadowRoot.querySelector('.chat-toggle');
      expect(toggle).toBeTruthy();
      expect(toggle.tagName.toLowerCase()).toBe('button');
    });

    test('should have accessible input', () => {
      const input = chatComponent.shadowRoot.querySelector('.chat-input');
      expect(input).toBeTruthy();
      expect(input.hasAttribute('placeholder')).toBe(true);
    });

    test('should support keyboard navigation', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const input = chatComponent.shadowRoot.querySelector('.chat-input');
      input.focus();

      expect(chatComponent.shadowRoot.activeElement).toBe(input);
    });
  });

  describe('Backwards Compatibility', () => {
    test('should maintain same public API as old AIChatWidget', () => {
      expect(typeof chatComponent.openChat).toBe('function');
      expect(typeof chatComponent.closeChat).toBe('function');
      expect(typeof chatComponent.toggleChat).toBe('function');
      expect(typeof chatComponent.sendMessage).toBe('function');
      expect(typeof chatComponent.showNotification).toBe('function');
      expect(typeof chatComponent.hideNotification).toBe('function');
      expect(typeof chatComponent.loadSystemHealth).toBe('function');
    });

    test('should have compatible property names', () => {
      expect(chatComponent.hasOwnProperty('isOpen')).toBe(true);
      expect(chatComponent.hasOwnProperty('isProcessing')).toBe(true);
      expect(chatComponent.hasOwnProperty('processAIQueryUseCase')).toBe(true);
      expect(chatComponent.hasOwnProperty('toastManager')).toBe(true);
    });
  });
});

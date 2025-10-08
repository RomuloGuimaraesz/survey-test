/**
 * AI Chat Web Component - Unit Tests
 * Tests all functionality of the <ai-chat> web component
 */

describe('AIChat Web Component', () => {
  let chatComponent;
  let mockProcessAIQueryUseCase;
  let mockToastManager;

  beforeEach(() => {
    // Create mock dependencies
    mockProcessAIQueryUseCase = {
      execute: jest.fn()
    };

    mockToastManager = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      remove: jest.fn()
    };

    // Create component instance
    chatComponent = document.createElement('ai-chat');
    document.body.appendChild(chatComponent);

    // Inject dependencies
    chatComponent.setDependencies(mockProcessAIQueryUseCase, mockToastManager);

    // Wait for component to be connected
    return chatComponent.updateComplete;
  });

  afterEach(() => {
    // Clean up
    if (chatComponent && chatComponent.parentNode) {
      chatComponent.parentNode.removeChild(chatComponent);
    }
  });

  describe('Initialization', () => {
    test('should render with correct initial state', () => {
      expect(chatComponent.isOpen).toBe(false);
      expect(chatComponent.isProcessing).toBe(false);
      expect(chatComponent.status).toBe('Ativo');
      expect(chatComponent.performance).toBe('Ready');
      expect(chatComponent.showNotificationBadge).toBe(false);
    });

    test('should have shadow DOM', () => {
      expect(chatComponent.shadowRoot).toBeTruthy();
    });

    test('should render chat toggle button', () => {
      const toggle = chatComponent.shadowRoot.querySelector('.chat-toggle');
      expect(toggle).toBeTruthy();
    });

    test('should add initial welcome message', () => {
      expect(chatComponent.messages.length).toBeGreaterThan(0);
      expect(chatComponent.messages[0].sender).toBe('bot');
      expect(chatComponent.messages[0].content.type).toBe('welcome');
    });
  });

  describe('Chat Open/Close', () => {
    test('should open chat when openChat() is called', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      expect(chatComponent.isOpen).toBe(true);
      const container = chatComponent.shadowRoot.querySelector('.chat-container');
      expect(container.classList.contains('open')).toBe(true);
    });

    test('should close chat when closeChat() is called', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      chatComponent.closeChat();
      await chatComponent.updateComplete;

      expect(chatComponent.isOpen).toBe(false);
      const container = chatComponent.shadowRoot.querySelector('.chat-container');
      expect(container.classList.contains('open')).toBe(false);
    });

    test('should toggle chat state', async () => {
      expect(chatComponent.isOpen).toBe(false);

      chatComponent.toggleChat();
      await chatComponent.updateComplete;
      expect(chatComponent.isOpen).toBe(true);

      chatComponent.toggleChat();
      await chatComponent.updateComplete;
      expect(chatComponent.isOpen).toBe(false);
    });

    test('should hide notification badge when opening chat', async () => {
      chatComponent.showNotificationBadge = true;
      await chatComponent.updateComplete;

      chatComponent.openChat();
      await chatComponent.updateComplete;

      expect(chatComponent.showNotificationBadge).toBe(false);
    });

    test('should emit chat-opened event when opened', (done) => {
      chatComponent.addEventListener('chat-opened', () => {
        expect(chatComponent.isOpen).toBe(true);
        done();
      });

      chatComponent.openChat();
    });

    test('should emit chat-closed event when closed', (done) => {
      chatComponent.openChat();

      chatComponent.addEventListener('chat-closed', () => {
        expect(chatComponent.isOpen).toBe(false);
        done();
      });

      chatComponent.closeChat();
    });
  });

  describe('Notification Badge', () => {
    test('should show notification badge', async () => {
      chatComponent.showNotification();
      await chatComponent.updateComplete;

      expect(chatComponent.showNotificationBadge).toBe(true);
      const badge = chatComponent.shadowRoot.querySelector('.notification-badge');
      expect(badge.classList.contains('show')).toBe(true);
    });

    test('should hide notification badge', async () => {
      chatComponent.showNotificationBadge = true;
      await chatComponent.updateComplete;

      chatComponent.hideNotification();
      await chatComponent.updateComplete;

      expect(chatComponent.showNotificationBadge).toBe(false);
      const badge = chatComponent.shadowRoot.querySelector('.notification-badge');
      expect(badge.classList.contains('show')).toBe(false);
    });

    test('should not show notification when chat is open', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      chatComponent.showNotification();
      await chatComponent.updateComplete;

      expect(chatComponent.showNotificationBadge).toBe(false);
    });
  });

  describe('Message Management', () => {
    test('should add user message', async () => {
      const initialCount = chatComponent.messages.length;
      chatComponent.addMessage('Test message', 'user');
      await chatComponent.updateComplete;

      expect(chatComponent.messages.length).toBe(initialCount + 1);
      const lastMessage = chatComponent.messages[chatComponent.messages.length - 1];
      expect(lastMessage.content).toBe('Test message');
      expect(lastMessage.sender).toBe('user');
    });

    test('should add bot message', async () => {
      const initialCount = chatComponent.messages.length;
      chatComponent.addMessage('Bot response', 'bot');
      await chatComponent.updateComplete;

      expect(chatComponent.messages.length).toBe(initialCount + 1);
      const lastMessage = chatComponent.messages[chatComponent.messages.length - 1];
      expect(lastMessage.content).toBe('Bot response');
      expect(lastMessage.sender).toBe('bot');
    });

    test('should add message with metadata', async () => {
      const metadata = {
        agent: 'Knowledge Agent',
        intent: 'analysis',
        confidence: 0.95
      };

      chatComponent.addMessage('Message with metadata', 'bot', metadata);
      await chatComponent.updateComplete;

      const lastMessage = chatComponent.messages[chatComponent.messages.length - 1];
      expect(lastMessage.metadata).toEqual(metadata);
    });

    test('should render messages in shadow DOM', async () => {
      chatComponent.addMessage('User test', 'user');
      chatComponent.addMessage('Bot test', 'bot');
      await chatComponent.updateComplete;

      const messages = chatComponent.shadowRoot.querySelectorAll('.message');
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('AI Message Processing', () => {
    test('should process AI message successfully', async () => {
      const mockResult = {
        success: true,
        response: 'Analysis complete',
        intent: 'analysis',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        residents: []
      };

      mockProcessAIQueryUseCase.execute.mockResolvedValue(mockResult);

      await chatComponent.processMessage('Analyze satisfaction');

      expect(mockProcessAIQueryUseCase.execute).toHaveBeenCalledWith('Analyze satisfaction');
      expect(chatComponent.isProcessing).toBe(false);
      expect(chatComponent.messages.some(m => m.sender === 'bot')).toBe(true);
    });

    test('should handle AI processing error', async () => {
      const mockError = new Error('Network error');
      mockProcessAIQueryUseCase.execute.mockRejectedValue(mockError);

      await chatComponent.processMessage('Test query');

      expect(chatComponent.isProcessing).toBe(false);
      expect(chatComponent.status).toBe('Connection Error');
      expect(chatComponent.performance).toBe('Failed');
    });

    test('should handle failed AI response', async () => {
      const mockResult = {
        success: false,
        error: 'Invalid query',
        response: 'Could not process query'
      };

      mockProcessAIQueryUseCase.execute.mockResolvedValue(mockResult);

      await chatComponent.processMessage('Invalid query');

      expect(chatComponent.status).toBe('Error - Please try again');
      expect(chatComponent.performance).toBe('Error');
    });

    test('should set isProcessing during message processing', async () => {
      let processingDuringExecution = false;

      mockProcessAIQueryUseCase.execute.mockImplementation(async () => {
        processingDuringExecution = chatComponent.isProcessing;
        return {
          success: true,
          response: 'Done',
          timestamp: new Date().toISOString()
        };
      });

      await chatComponent.processMessage('Test');

      expect(processingDuringExecution).toBe(true);
      expect(chatComponent.isProcessing).toBe(false);
    });

    test('should update performance metrics', async () => {
      const mockResult = {
        success: true,
        response: 'Success',
        intent: 'analysis',
        timestamp: new Date().toISOString(),
        residents: []
      };

      mockProcessAIQueryUseCase.execute.mockResolvedValue(mockResult);

      await chatComponent.processMessage('Query');

      expect(chatComponent.performance).toMatch(/\d+ms/);
    });
  });

  describe('Send Message', () => {
    test('should send message from input', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const input = chatComponent.shadowRoot.querySelector('.chat-input');
      input.value = 'Test message';

      const spy = jest.spyOn(chatComponent, 'processMessage');
      await chatComponent.sendMessage();

      expect(spy).toHaveBeenCalledWith('Test message');
      expect(input.value).toBe('');
    });

    test('should send message with provided text', async () => {
      const spy = jest.spyOn(chatComponent, 'processMessage');
      await chatComponent.sendMessage('Direct message');

      expect(spy).toHaveBeenCalledWith('Direct message');
    });

    test('should not send empty message', async () => {
      const spy = jest.spyOn(chatComponent, 'processMessage');
      await chatComponent.sendMessage('   ');

      expect(spy).not.toHaveBeenCalled();
    });

    test('should not send message when processing', async () => {
      chatComponent.isProcessing = true;
      const spy = jest.spyOn(chatComponent, 'processMessage');

      await chatComponent.sendMessage('Test');

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Success Response Rendering', () => {
    test('should render response with residents', () => {
      const result = {
        success: true,
        response: 'Found residents',
        intent: 'analysis',
        confidence: 0.9,
        timestamp: new Date().toISOString(),
        residents: [
          { name: 'João Silva', neighborhood: 'Centro', satisfaction: 'Alta' },
          { name: 'Maria Santos', neighborhood: 'Norte', satisfaction: 'Média' }
        ]
      };

      chatComponent.renderSuccessResponse(result, 'Test query', 150);

      const lastMessage = chatComponent.messages[chatComponent.messages.length - 1];
      expect(lastMessage.content.analysis).toBeDefined();
      expect(lastMessage.content.analysis.residents).toHaveLength(2);
    });

    test('should store report payload in localStorage', () => {
      const result = {
        success: true,
        response: 'Analysis',
        intent: 'analysis',
        timestamp: new Date().toISOString(),
        residents: []
      };

      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      chatComponent.renderSuccessResponse(result, 'Test query', 100);

      expect(setItemSpy).toHaveBeenCalled();
      const calls = setItemSpy.mock.calls;
      const reportCall = calls.find(call => call[0].startsWith('reportPayload:'));
      expect(reportCall).toBeTruthy();
    });

    test('should add report link to response', () => {
      const result = {
        success: true,
        response: 'Test',
        intent: 'analysis',
        timestamp: new Date().toISOString(),
        residents: []
      };

      chatComponent.renderSuccessResponse(result, 'Query', 100);

      const lastMessage = chatComponent.messages[chatComponent.messages.length - 1];
      expect(lastMessage.content.analysis.summary).toContain('relatório completo');
    });
  });

  describe('System Health', () => {
    test('should load system health', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          status: 'healthy',
          database: { contacts: 150 }
        })
      });

      await chatComponent.loadSystemHealth();

      expect(chatComponent.performance).toBe('150 contacts');
    });

    test('should show notification on unhealthy status', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          status: 'unhealthy',
          database: { contacts: 0 }
        })
      });

      const spy = jest.spyOn(chatComponent, 'showNotification');
      await chatComponent.loadSystemHealth();

      expect(spy).toHaveBeenCalled();
    });

    test('should handle health check error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await chatComponent.loadSystemHealth();

      expect(chatComponent.performance).toBe('Offline');
    });
  });

  describe('UI Interactions', () => {
    test('should handle toggle button click', async () => {
      chatComponent.closeChat();
      await chatComponent.updateComplete;

      const toggle = chatComponent.shadowRoot.querySelector('.chat-toggle');
      toggle.click();
      await chatComponent.updateComplete;

      expect(chatComponent.isOpen).toBe(true);
    });

    test('should handle close button click', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const closeBtn = chatComponent.shadowRoot.querySelector('.chat-close');
      closeBtn.click();
      await chatComponent.updateComplete;

      expect(chatComponent.isOpen).toBe(false);
    });

    test('should handle send button click', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const input = chatComponent.shadowRoot.querySelector('.chat-input');
      input.value = 'Test';

      const sendBtn = chatComponent.shadowRoot.querySelector('.send-button');
      const spy = jest.spyOn(chatComponent, 'sendMessage');

      sendBtn.click();

      expect(spy).toHaveBeenCalled();
    });

    test('should send message on Enter key', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const input = chatComponent.shadowRoot.querySelector('.chat-input');
      input.value = 'Test message';

      const spy = jest.spyOn(chatComponent, 'sendMessage');
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: false });

      chatComponent.handleInputKeypress(event);

      expect(spy).toHaveBeenCalled();
    });

    test('should not send on Shift+Enter', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const input = chatComponent.shadowRoot.querySelector('.chat-input');
      input.value = 'Test';

      const spy = jest.spyOn(chatComponent, 'sendMessage');
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: true });

      chatComponent.handleInputKeypress(event);

      expect(spy).not.toHaveBeenCalled();
    });

    test('should handle quick suggestion click', async () => {
      chatComponent.openChat();
      await chatComponent.updateComplete;

      const spy = jest.spyOn(chatComponent, 'sendMessage');
      chatComponent.handleQuickSuggestion('System status');

      expect(spy).toHaveBeenCalledWith('System status');
    });
  });

  describe('Reactive Properties', () => {
    test('should react to isOpen property change', async () => {
      chatComponent.isOpen = true;
      await chatComponent.updateComplete;

      const container = chatComponent.shadowRoot.querySelector('.chat-container');
      expect(container.classList.contains('open')).toBe(true);

      chatComponent.isOpen = false;
      await chatComponent.updateComplete;

      expect(container.classList.contains('open')).toBe(false);
    });

    test('should react to status property change', async () => {
      chatComponent.status = 'Processing...';
      await chatComponent.updateComplete;

      const statusEl = chatComponent.shadowRoot.querySelector('.chat-status');
      expect(statusEl.textContent).toBe('Processing...');
    });

    test('should react to performance property change', async () => {
      chatComponent.performance = '200ms';
      await chatComponent.updateComplete;

      const perfEl = chatComponent.shadowRoot.querySelector('.performance-indicator');
      expect(perfEl.textContent).toBe('200ms');
    });
  });

  describe('Message Formatting', () => {
    test('should format string messages', () => {
      const formatted = chatComponent.formatMessageContent('Line 1\nLine 2');
      expect(formatted).toContain('<br>');
    });

    test('should format welcome message', () => {
      const welcomeContent = {
        type: 'welcome',
        text: 'Welcome',
        features: [{ icon: '📊', title: 'Feature', items: 'Item' }],
        suggestions: ['Test']
      };

      const formatted = chatComponent.formatMessageContent(welcomeContent);
      expect(formatted).toContain('Welcome');
      expect(formatted).toContain('Feature');
    });

    test('should format analysis payload', () => {
      const analysisContent = {
        analysis: {
          summary: 'Test summary',
          residents: [
            { name: 'João', neighborhood: 'Centro', satisfaction: 'Alta' }
          ]
        }
      };

      const formatted = chatComponent.formatMessageContent(analysisContent);
      expect(formatted).toContain('Test summary');
      expect(formatted).toContain('João');
      expect(formatted).toContain('Centro');
    });

    test('should format metadata', () => {
      const metadata = {
        intent: 'analysis',
        confidence: 0.85,
        timestamp: '2024-01-01T12:00:00Z'
      };

      const formatted = chatComponent.formatMetadata(metadata);
      expect(formatted).toContain('Intent: analysis');
      expect(formatted).toContain('Confidence: 85%');
      expect(formatted).toContain('Time:');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup on disconnect', () => {
      const cleanup1 = jest.fn();
      const cleanup2 = jest.fn();

      chatComponent.registerCleanup(cleanup1);
      chatComponent.registerCleanup(cleanup2);

      chatComponent.disconnectedCallback();

      expect(cleanup1).toHaveBeenCalled();
      expect(cleanup2).toHaveBeenCalled();
    });
  });

  describe('Attributes', () => {
    test('should observe "open" attribute', () => {
      expect(chatComponent.constructor.observedAttributes).toContain('open');
    });

    test('should react to "open" attribute change', async () => {
      chatComponent.setAttribute('open', '');
      await chatComponent.updateComplete;

      expect(chatComponent.isOpen).toBe(true);

      chatComponent.removeAttribute('open');
      await chatComponent.updateComplete;

      expect(chatComponent.isOpen).toBe(false);
    });
  });
});

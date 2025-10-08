/**
 * AIChatWidget - Presentation Component
 * AI assistant chat interface
 * Single Responsibility: Chat UI management
 * Interface Segregation: Separated rendering, messaging, and state management
 */
export class AIChatWidget {
  constructor(processAIQueryUseCase, toastManager) {
    this.processAIQueryUseCase = processAIQueryUseCase;
    this.toastManager = toastManager;
    this.isOpen = false;
    this.isProcessing = false;

    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.chatToggle = document.getElementById('chatToggle');
    this.chatContainer = document.getElementById('chatContainer');
    this.chatClose = document.getElementById('chatClose');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.typingIndicator = document.getElementById('typingIndicator');
    this.chatStatus = document.getElementById('chatStatus');
    this.notificationBadge = document.getElementById('notificationBadge');
    this.performanceIndicator = document.getElementById('performanceIndicator');
  }

  attachEventListeners() {
    this.chatToggle?.addEventListener('click', () => this.toggleChat());
    this.chatClose?.addEventListener('click', () => this.closeChat());
    this.sendButton?.addEventListener('click', () => this.sendMessage());

    this.chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.chatInput?.addEventListener('input', () => this.autoResize());

    document.addEventListener('click', (e) => {
      if (this.isOpen &&
          !this.chatContainer?.contains(e.target) &&
          !this.chatToggle?.contains(e.target)) {
        this.closeChat();
      }
    });
  }

  toggleChat() {
    this.isOpen ? this.closeChat() : this.openChat();
  }

  openChat() {
    this.isOpen = true;
    this.chatContainer?.classList.add('open');
    this.chatInput?.focus();
    this.hideNotification();
    this.scrollToBottom();
  }

  closeChat() {
    this.isOpen = false;
    this.chatContainer?.classList.remove('open');
  }

  showNotification() {
    this.notificationBadge?.classList.add('show');
  }

  hideNotification() {
    this.notificationBadge?.classList.remove('show');
  }

  autoResize() {
    if (!this.chatInput) return;
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 80) + 'px';
  }

  async sendMessage() {
    const message = this.chatInput?.value.trim();
    if (!message || this.isProcessing) return;

    this.addMessage(message, 'user');
    this.chatInput.value = '';
    this.autoResize();

    await this.processMessage(message);
  }

  async processMessage(message) {
    this.isProcessing = true;
    this.sendButton.disabled = true;
    this.showTyping();

    const startTime = Date.now();

    try {
      this.updateStatus('Processing query...');
      this.updatePerformance('Processing...');

      const result = await this.processAIQueryUseCase.execute(message);
      const processingTime = Date.now() - startTime;

      this.hideTyping();

      if (result.success) {
        this.renderSuccessResponse(result, message, processingTime);
      } else {
        this.addMessage(result.response || `Erro: ${result.error}`, 'bot', {
          agent: 'System',
          timestamp: new Date().toISOString()
        });
        this.updateStatus('Error - Please try again');
        this.updatePerformance('Error');
      }

      // Trigger data refresh
      if (window.adminViewModel) {
        window.adminViewModel.refresh();
      }

    } catch (error) {
      console.error('[AIChatWidget] Error:', error);
      this.hideTyping();
      this.addMessage(`Connection error: ${error.message}`, 'bot', {
        agent: 'System',
        timestamp: new Date().toISOString()
      });
      this.updateStatus('Connection Error');
      this.updatePerformance('Failed');
    } finally {
      this.isProcessing = false;
      this.sendButton.disabled = false;
    }
  }

  renderSuccessResponse(result, query, processingTime) {
    const residents = Array.isArray(result.residents) ? result.residents : [];
    let summaryText = result.response || 'Query processed successfully';

    if (residents.length) {
      const list = residents.map((r, idx) =>
        `${idx + 1}. ${r.name} (${r.neighborhood || '—'})${r.satisfaction ? ` • ${r.satisfaction}` : ''}`
      ).join('\n');
      summaryText += `\n\nRESIDENTES (${residents.length}):\n${list}`;
    }

    const analysisPayload = {
      analysis: {
        summary: summaryText,
        residents,
        insights: Array.isArray(result.insights) ? result.insights : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
      }
    };

    // Store for report
    const rid = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      localStorage.setItem(`reportPayload:${rid}`, JSON.stringify({ query, result }));
    } catch (e) {
      console.warn('Failed to store report payload:', e);
    }

    // Add report link
    const base = window.APP_BASE_URL || window.location.origin;
    const linkHtml = `<div class="mt-10"><a href="${base}/report.html?rid=${encodeURIComponent(rid)}&q=${encodeURIComponent(query)}" target="_blank" class="link-primary bold">Abrir relatório completo ↗</a></div>`;
    analysisPayload.analysis.summary = (analysisPayload.analysis.summary || '') + `\n\n` + linkHtml;

    this.addMessage(analysisPayload, 'bot', {
      agent: result.intent ? `${result.intent.charAt(0).toUpperCase() + result.intent.slice(1)} Agent` : 'AI Assistant',
      intent: result.intent,
      timestamp: result.timestamp,
      confidence: result.confidence
    });

    this.updateStatus(`${result.intent ? result.intent.charAt(0).toUpperCase() + result.intent.slice(1) : 'AI'} Agent Ready`);
    this.updatePerformance(`${processingTime}ms`);
  }

  addMessage(content, sender, metadata = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (metadata?.agent) {
      const badge = document.createElement('div');
      badge.className = `agent-badge ${metadata.agent.toLowerCase().replace(' ', '-')}`;
      badge.textContent = metadata.agent;
      messageContent.appendChild(badge);
    }

    const textContent = document.createElement('div');
    textContent.innerHTML = this.formatMessage(content);
    messageContent.appendChild(textContent);

    if (metadata) {
      const metaDiv = document.createElement('div');
      metaDiv.className = 'response-metadata';
      metaDiv.innerHTML = this.formatMetadata(metadata);
      messageContent.appendChild(metaDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    this.chatMessages?.appendChild(messageDiv);
    this.scrollToBottom();

    return messageDiv;
  }

  formatMessage(content) {
    if (typeof content === 'string') {
      return content.replace(/\n/g, '<br>');
    }

    if (typeof content === 'object' && content.analysis) {
      let html = '';
      const analysis = content.analysis;

      if (analysis.summary) {
        html += `<div class="summary-box">${analysis.summary.replace(/\n/g, '<br>')}</div>`;
      }

      if (Array.isArray(analysis.residents) && analysis.residents.length > 0) {
        html += `<div class="mt-12"><strong>Lista de residentes:</strong><ul class="list-offset">`;
        analysis.residents.forEach(r => {
          html += `<li><strong>${r.name}</strong> (${r.neighborhood || '—'})<br>`;
          html += `Satisfação: <span class="metric-highlight">${r.satisfaction || '—'}</span>`;
          if (r.whatsapp) {
            html += `<br>WhatsApp: <a href="https://wa.me/${r.whatsapp.replace(/\D/g, '')}" target="_blank">${r.whatsapp}</a>`;
          }
          html += `</li>`;
        });
        html += `</ul></div>`;
      }

      return html;
    }

    return String(content);
  }

  formatMetadata(metadata) {
    const parts = [];
    if (metadata.intent) parts.push(`Intent: ${metadata.intent}`);
    if (metadata.confidence) parts.push(`Confidence: ${(metadata.confidence * 100).toFixed(0)}%`);
    if (metadata.timestamp) {
      const time = new Date(metadata.timestamp).toLocaleTimeString();
      parts.push(`Time: ${time}`);
    }
    return parts.join(' • ');
  }

  showTyping() {
    this.typingIndicator?.classList.add('show');
    this.scrollToBottom();
  }

  hideTyping() {
    this.typingIndicator?.classList.remove('show');
  }

  updateStatus(status) {
    if (this.chatStatus) {
      this.chatStatus.textContent = status;
    }
  }

  updatePerformance(performance) {
    if (this.performanceIndicator) {
      this.performanceIndicator.textContent = performance;
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.chatMessages) {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }
    }, 100);
  }

  async loadSystemHealth() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.database?.contacts > 0) {
        this.updatePerformance(`${data.database.contacts} contacts`);
      }

      if (data.status !== 'healthy') {
        this.showNotification();
      }
    } catch (error) {
      console.error('[AIChatWidget] Failed to load system health:', error);
      this.updatePerformance('Offline');
    }
  }
}

// Global function for quick suggestions
window.sendQuickMessage = function(message) {
  if (window.chatWidget) {
    window.chatWidget.chatInput.value = message;
    if (!window.chatWidget.isOpen) {
      window.chatWidget.openChat();
    }
    window.chatWidget.sendMessage();
  }
};

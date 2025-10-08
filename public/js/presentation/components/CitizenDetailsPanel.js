/**
 * CitizenDetailsPanel - Presentation Component
 * Slide-up panel showing detailed citizen information
 * Single Responsibility: Render citizen details panel
 */
import { DateFormatter } from '../formatters/DateFormatter.js';

export class CitizenDetailsPanel {
  constructor(panelSelector, overlaySelector, toastManager) {
    this.panel = document.getElementById(panelSelector);
    this.overlay = document.getElementById(overlaySelector);
    this.toastManager = toastManager;
    this.currentCitizen = null;

    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.nameElement = document.getElementById('citizenName');
    this.detailsElement = document.getElementById('citizenDetails');
  }

  attachEventListeners() {
    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  open(citizen) {
    this.currentCitizen = citizen;

    if (this.nameElement) {
      this.nameElement.textContent = citizen.name || 'Cidadão';
    }

    if (this.detailsElement) {
      this.detailsElement.innerHTML = this.generateDetailsHTML(citizen);
    }

    if (this.overlay) {
      this.overlay.classList.add('active');
    }
    if (this.panel) {
      this.panel.classList.add('active');
    }

    document.body.style.overflow = 'hidden';
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    if (this.panel) {
      this.panel.classList.remove('active');
    }

    document.body.style.overflow = '';
    this.currentCitizen = null;
  }

  generateDetailsHTML(citizen) {
    return `
      <div class="citizen-detail-grid">
        ${this.renderPersonalInfo(citizen)}
        ${this.renderContactInfo(citizen)}
        ${this.renderEngagementHistory(citizen)}
        ${this.renderSystemData(citizen)}
      </div>

      ${citizen.survey ? this.renderSurveyResponse(citizen.survey) : this.renderNoSurvey()}

      ${this.renderActionButtons(citizen)}
    `;
  }

  renderPersonalInfo(citizen) {
    return `
      <div class="detail-card">
        <h3>Informações Pessoais</h3>
        <div class="detail-field">
          <span class="detail-label">Nome Completo</span>
          <span class="detail-value">${citizen.name || '—'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Idade</span>
          <span class="detail-value">${citizen.age || '—'} anos</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Bairro</span>
          <span class="detail-value">${citizen.neighborhood || '—'}</span>
        </div>
      </div>
    `;
  }

  renderContactInfo(citizen) {
    return `
      <div class="detail-card">
        <h3>Contato</h3>
        <div class="detail-field">
          <span class="detail-label">WhatsApp</span>
          <span class="detail-value">${citizen.formattedPhone || '—'}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Status de Envio</span>
          <span class="detail-value">
            ${citizen.whatsappSentAt
              ? `<span class="status-badge status-sent">Enviado em ${DateFormatter.formatDateTime(citizen.whatsappSentAt)}</span>`
              : '<span class="status-badge status-pending">Não enviado</span>'
            }
          </span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Status WhatsApp</span>
          <span class="detail-value">
            ${citizen.whatsappStatus
              ? `<span class="status-badge status-${citizen.whatsappStatus}">${citizen.whatsappStatus}</span>`
              : '—'
            }
          </span>
        </div>
      </div>
    `;
  }

  renderEngagementHistory(citizen) {
    return `
      <div class="detail-card">
        <h3>Histórico de Interação</h3>
        <div class="detail-field">
          <span class="detail-label">Link Clicado</span>
          <span class="detail-value">
            ${citizen.clickedAt
              ? `✅ ${DateFormatter.formatDateTime(citizen.clickedAt)}`
              : '<span class="status-badge status-pending">Não clicou</span>'
            }
          </span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Pesquisa Respondida</span>
          <span class="detail-value">
            ${citizen.hasResponded
              ? `✅ ${DateFormatter.formatDateTime(citizen.survey.answeredAt)}`
              : '<span class="status-badge status-pending">Não respondeu</span>'
            }
          </span>
        </div>
      </div>
    `;
  }

  renderSystemData(citizen) {
    return `
      <div class="detail-card">
        <h3>Dados do Sistema</h3>
        <div class="detail-field">
          <span class="detail-label">ID do Contato</span>
          <span class="detail-value">#${citizen.id}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Criado em</span>
          <span class="detail-value">${DateFormatter.formatDateTime(citizen.createdAt)}</span>
        </div>
        <div class="detail-field">
          <span class="detail-label">Última Atualização</span>
          <span class="detail-value">${DateFormatter.formatDateTime(citizen.updatedAt)}</span>
        </div>
      </div>
    `;
  }

  renderSurveyResponse(survey) {
    return `
      <div class="survey-response">
        <h4>Resposta da Pesquisa</h4>

        <div class="detail-field">
          <span class="detail-label">Satisfação</span>
          <span class="detail-value">${survey.satisfaction || '—'}</span>
        </div>

        <div class="detail-field">
          <span class="detail-label">Problema principal</span>
          <span class="detail-value">${survey.issue || '—'}</span>
        </div>

        ${survey.otherIssueDetails ? `
          <div class="detail-field">
            <span class="detail-label">Detalhe do problema</span>
            <span class="detail-value">${survey.otherIssueDetails}</span>
          </div>
        ` : ''}

        <div class="detail-field">
          <span class="detail-label">Interessado em participar</span>
          <span class="detail-value">${survey.participate || '—'}</span>
        </div>

        <div class="detail-field">
          <span class="detail-label">Respondido em</span>
          <span class="detail-value">${DateFormatter.formatDateTime(survey.answeredAt)}</span>
        </div>
      </div>
    `;
  }

  renderNoSurvey() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <h3>Nenhuma resposta de pesquisa</h3>
        <p>Este cidadão ainda não respondeu à pesquisa de satisfação.</p>
      </div>
    `;
  }

  renderActionButtons(citizen) {
    return `
      <div class="action-buttons">
        <button class="panel-action-button secondary" onclick="window.detailsPanel.openWhatsApp(${citizen.id})">
          Abrir no WhatsApp
        </button>
        <button class="panel-action-button" onclick="window.detailsPanel.copySurveyLink(${citizen.id})">
          Copiar Link
        </button>
      </div>
    `;
  }

  async openWhatsApp(citizenId) {
    // This will be handled by the view model
    if (window.adminViewModel) {
      await window.adminViewModel.openWhatsApp(citizenId);
    }
  }

  copySurveyLink(citizenId) {
    // This will be handled by the view model
    if (window.adminViewModel) {
      window.adminViewModel.copySurveyLink(citizenId);
    }
  }
}

// agents/ticketAgent.js - System/Ticket operations with rich structured output
const MunicipalAnalysisEngine = require('../services/MunicipalAnalysisEngine');

class TicketAgent {
  constructor() {
    this.name = 'Ticket Agent';
    this.analysisEngine = new MunicipalAnalysisEngine();
  }

  async processQuery(query, _llmResult, _preloadedContext = null) {
    try {
      const dataAccess = this.analysisEngine.dataAccess;
      const contacts = (typeof dataAccess.getAllContacts === 'function')
        ? dataAccess.getAllContacts()
        : (typeof dataAccess.loadData === 'function' ? dataAccess.loadData() : []);

      const total = contacts.length;
      const sent = contacts.filter(c => !!c.whatsappSentAt).length;
      const delivered = contacts.filter(c => c.whatsappStatus === 'delivered').length;
      const failed = contacts.filter(c => c.whatsappStatus === 'failed').length;
      const answered = contacts.filter(c => !!c.survey).length;
      const clicked = contacts.filter(c => !!c.clickedAt).length;

      const responseRate = total > 0 ? Math.round((answered / total) * 100) : 0;
      const engagementRate = total > 0 ? Math.round((clicked / total) * 100) : 0;

      const byProvider = {};
      contacts.forEach(c => {
        if (!c.whatsappProvider) return;
        const p = c.whatsappProvider;
        if (!byProvider[p]) byProvider[p] = { total: 0, delivered: 0, failed: 0 };
        byProvider[p].total++;
        if (c.whatsappStatus === 'delivered') byProvider[p].delivered++;
        if (c.whatsappStatus === 'failed') byProvider[p].failed++;
      });

      const byNeighborhood = {};
      contacts.forEach(c => {
        const n = c.neighborhood || 'Desconhecido';
        if (!byNeighborhood[n]) byNeighborhood[n] = { total: 0, answered: 0, sent: 0 };
        byNeighborhood[n].total++;
        if (c.survey) byNeighborhood[n].answered++;
        if (c.whatsappSentAt) byNeighborhood[n].sent++;
      });

      const topNeighborhoods = Object.entries(byNeighborhood)
        .sort((a, b) => b[1].answered - a[1].answered)
        .slice(0, 5)
        .map(([name, m]) => ({ name, total: m.total, answered: m.answered, sent: m.sent }));

      const summaryLines = [
        `Contatos: ${total}`,
        `Enviadas: ${sent} • Entregues: ${delivered} • Falhas: ${failed}`,
        `Respondidas: ${answered} (${responseRate}%) • Cliques: ${clicked} (${engagementRate}%)`
      ];

      const providerLines = Object.entries(byProvider)
        .map(([p, m]) => `• ${p}: ${m.delivered}/${m.total} entregues, ${m.failed} falhas`);

      const summary = `Status do Sistema\n\n${summaryLines.join('\n')}\n\nProvedores:\n${providerLines.length ? providerLines.join('\n') : '• —'}`;

      const insights = [];
      if (failed > 0) insights.push('Há mensagens com falha; verifique credenciais e webhooks.');
      if (responseRate < 30 && total > 0) insights.push('Taxa de resposta baixa; oportunidade para otimizar mensagem e horário.');
      if (engagementRate < 40 && sent > 0) insights.push('Baixo engajamento pós-envio; considere reenvio segmentado.');
      if (topNeighborhoods.length) insights.push('Alguns bairros têm maior adesão; priorize comunicação local.');

      const recommendations = [];
      if (failed > 0) recommendations.push('Revisar configuração do provedor e logs de webhook nas últimas 24h.');
      if (responseRate < 30 && sent > 0) recommendations.push('Testar novo texto e enviar follow-up em 48–72h.');
      if (engagementRate < 40 && sent > 0) recommendations.push('Incluir contexto local e CTA claro nas mensagens.');
      if (topNeighborhoods.length) recommendations.push('Aproveitar bairros com melhor adesão para pilotos e divulgação.');

      const report = {
        text: `Relatório de Operação\n\n• Total: ${total}\n• Enviadas: ${sent}\n• Entregues: ${delivered}\n• Falhas: ${failed}\n• Respondidas: ${answered} (${responseRate}%)\n• Cliques: ${clicked} (${engagementRate}%)`,
        metrics: {
          total,
          sent,
          delivered,
          failed,
          answered,
          clicked,
          responseRate,
          engagementRate,
          providers: byProvider,
          topNeighborhoods
        }
      };

      return {
        agent: this.name,
        query,
        analysis: {
          summary,
          insights,
          recommendations,
          report,
          type: 'system_status'
        },
        dataSource: 'municipal_system',
        realData: true,
        timestamp: new Date().toISOString(),
        success: true
      };
    } catch (error) {
      return this.createErrorResponse(query, error);
    }
  }

  createErrorResponse(query, error) {
    return {
      agent: this.name,
      query,
      analysis: {
        summary: `Erro ao obter status do sistema: ${error.message}`,
        insights: [],
        recommendations: ['Verifique os logs do servidor e as variáveis de ambiente'],
        type: 'error_fallback'
      },
      success: false,
      timestamp: new Date().toISOString()
    };
  }
}

const ticketAgentInstance = new TicketAgent();

async function ticketAgent(query, llmResult, preloadedContext = null) {
  return await ticketAgentInstance.processQuery(query, llmResult, preloadedContext);
}

module.exports = { ticketAgent };

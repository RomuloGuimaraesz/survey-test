// services/whatsappService.js
const axios = require('axios');
const crypto = require('crypto');

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'meta'; // 'meta' ou 'twilio'
    this.mode = process.env.WHATSAPP_MODE || 'mock'; // 'real' ou 'mock'
    
    // Validar configurações ao inicializar
    if (this.mode === 'real') {
      this.validateConfig();
    }
  }

  validateConfig() {
    if (this.provider === 'meta') {
      if (!process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
        throw new Error('Meta WhatsApp: ACCESS_TOKEN e PHONE_NUMBER_ID são obrigatórios');
      }
    } else if (this.provider === 'twilio') {
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Twilio: ACCOUNT_SID e AUTH_TOKEN são obrigatórios');
      }
    }
  }

  async sendMessage(to, message, templateData = null) {
    console.log(`[WhatsApp] Enviando para ${to} via ${this.provider} (${this.mode})`);

    if (this.mode === 'mock') {
      return this.sendMock(to, message);
    }

    try {
      if (this.provider === 'meta') {
        return await this.sendViaMeta(to, message, templateData);
      } else if (this.provider === 'twilio') {
        return await this.sendViaTwilio(to, message);
      }
      throw new Error(`Provider não suportado: ${this.provider}`);
    } catch (error) {
      console.error(`[WhatsApp] Erro ao enviar via ${this.provider}:`, error.message);
      throw error;
    }
  }

  // Mock para desenvolvimento
  sendMock(to, message) {
    console.log(`\n--- MOCK WHATSAPP ---`);
    console.log(`Para: +${to}`);
    console.log(`Mensagem: ${message}`);
    console.log(`---------------------\n`);

    return Promise.resolve({
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock',
      to: to,
      status: 'sent'
    });
  }

  // Meta WhatsApp Cloud API
  async sendViaMeta(to, message, templateData = null) {
    const url = `https://graph.facebook.com/v18.0/${process.env.META_PHONE_NUMBER_ID}/messages`;
    
    // Remove caracteres não numéricos e o + inicial se existir
    const cleanPhone = to.replace(/\D/g, '');
    
    let payload;

  if (templateData && templateData.templateName) {
      // Usar template aprovado (produção)
      payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateData.templateName,
          language: { code: templateData.languageCode || "pt_BR" },
          components: templateData.components || []
        }
      };
    } else {
      // Mensagem de texto simples (desenvolvimento)
      payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: message }
      };
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      messageId: response.data.messages[0].id,
      provider: 'meta',
      to: cleanPhone,
      status: 'sent',
      waId: response.data.contacts[0].wa_id
    };
  }

  // Twilio WhatsApp
  async sendViaTwilio(to, message) {
    const client = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );

    const cleanPhone = to.replace(/\D/g, '');
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    const twilioMessage = await client.messages.create({
      body: message,
      from: fromNumber,
      to: `whatsapp:+${cleanPhone}`
    });

    return {
      success: true,
      messageId: twilioMessage.sid,
      provider: 'twilio',
      to: cleanPhone,
      status: twilioMessage.status,
      twilioStatus: twilioMessage.status
    };
  }

  // Validar webhook do Meta
  validateMetaWebhook(body, signature) {
    if (!process.env.META_APP_SECRET) {
      throw new Error('META_APP_SECRET não configurado');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.META_APP_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  // Processar status do Meta
  processMetaStatus(statusData) {
    return {
      messageId: statusData.id,
      status: statusData.status, // sent, delivered, read, failed
      timestamp: statusData.timestamp,
      recipientId: statusData.recipient_id,
      errors: statusData.errors || null
    };
  }

  // Processar status do Twilio
  processTwilioStatus(statusData) {
    return {
      messageId: statusData.MessageSid,
      status: this.mapTwilioStatus(statusData.MessageStatus),
      timestamp: new Date().toISOString(),
      recipientId: statusData.To?.replace('whatsapp:', ''),
      twilioStatus: statusData.MessageStatus
    };
  }

  // Mapear status do Twilio para padrão comum
  mapTwilioStatus(twilioStatus) {
    const statusMap = {
      'queued': 'sent',
      'sending': 'sent', 
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed',
      'undelivered': 'failed'
    };
    return statusMap[twilioStatus] || twilioStatus;
  }

  // Criar payload para convite de pesquisa com botão clicável (via Template aprovado)
  createSurveyTemplate(name, surveyLink) {
    // Extrai o id para suportar templates com botão de URL dinâmico por sufixo (?id={{1}})
    let idParam = '';
    try {
      const u = new URL(surveyLink);
      idParam = u.searchParams.get('id') || '';
    } catch (_) {}

    return {
      // Usar Template aprovado com botão de URL (criado previamente no WhatsApp Manager)
      templateName: "survey_invitation",
      languageCode: "pt_BR",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: surveyLink }
          ]
        },
        // Se houver um botão de URL no template com sufixo dinâmico, envie o parâmetro
        idParam
          ? {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [ { type: "text", text: idParam } ]
            }
          : undefined
      ].filter(Boolean)
    };
  }

  // Formatear número de telefone
  formatPhoneNumber(phone) {
    // Remove tudo que não é dígito
    let cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com 55 (Brasil), adiciona
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    
    return cleaned;
  }

  // Validar número de telefone brasileiro
  validateBrazilianPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    // Deve ter 13 dígitos: 55 + 11 + 9 + 8 dígitos
    // ou 12 dígitos: 55 + 11 + 8 dígitos (fixo)
    if (cleaned.length < 12 || cleaned.length > 13) {
      return false;
    }
    
    // Deve começar com 55 (Brasil)
    if (!cleaned.startsWith('55')) {
      return false;
    }
    
    return true;
  }

  // Obter estatísticas de envio
  getStats(data) {
    const total = data.length;
    const sent = data.filter(d => d.whatsappSentAt).length;
    const delivered = data.filter(d => d.whatsappStatus === 'delivered').length;
    const clicked = data.filter(d => d.clickedAt).length;
    const answered = data.filter(d => d.survey).length;

    return {
      total,
      sent,
      delivered,
      clicked,
      answered,
      rates: {
        sent: total > 0 ? (sent / total * 100).toFixed(1) + '%' : '0%',
        delivery: sent > 0 ? (delivered / sent * 100).toFixed(1) + '%' : '0%',
        click: sent > 0 ? (clicked / sent * 100).toFixed(1) + '%' : '0%',
        response: clicked > 0 ? (answered / clicked * 100).toFixed(1) + '%' : '0%'
      }
    };
  }
}

module.exports = new WhatsAppService();
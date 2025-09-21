// agents/notificationAgent.js - Refactored to use intelligent LLM responses with actual resident names
const MunicipalAnalysisEngine = require('../services/MunicipalAnalysisEngine');

class IntelligentNotificationAgent {
  constructor() {
    this.name = 'Notification Agent';
    this.analysisEngine = new MunicipalAnalysisEngine();
  }

  async processQuery(query, llmResult, preloadedContext = null) {
    try {
      console.log(`[${this.name}] Processing: ${query}`);
      
      // PRIORITY 1: Use intelligent LLM response with resident data
      if (preloadedContext?.llmResult?.response && 
          (preloadedContext.llmResult.quality?.level === 'excellent' || 
           preloadedContext.llmResult.quality?.level === 'good')) {
        console.log(`[${this.name}] Using intelligent LLM response with resident data (quality: ${preloadedContext.llmResult.quality.level})`);
        
        // Extract actual resident data based on query
        const residentData = this.extractResidentData(query, preloadedContext);
        
        // Enhance LLM response with actual resident names
        const enhancedResponse = this.enhanceLLMResponseWithResidents(
          preloadedContext.llmResult.response, 
          residentData, 
          query
        );
    // Build data-driven segment report
    const segment = this.getSegmentTypeFromQuery(query);
    const report = this.buildSegmentReport(residentData, segment);

        return {
          agent: this.name,
          query,
          analysis: {
      summary: enhancedResponse + (report?.text ? `\n\n${report.text}` : ''),
            insights: this.extractInsightsFromLLM(preloadedContext.llmResult),
            recommendations: this.extractRecommendationsFromLLM(preloadedContext.llmResult),
            residents: residentData,
      report,
            type: 'intelligent_notification_with_residents'
          },
          dataSource: 'municipal_intelligence_system',
          intelligenceLevel: preloadedContext.llmResult.intelligenceLevel,
          realData: true,
          timestamp: new Date().toISOString(),
          success: true
        };
      }

      // PRIORITY 2: Enhanced fallback with actual resident data
      if (preloadedContext?.intelligentContext) {
        console.log(`[${this.name}] Using intelligent fallback with actual resident data`);
        return await this.generateIntelligentNotificationWithResidents(query, preloadedContext);
      }

      // PRIORITY 3: Standard analysis engine fallback
      console.log(`[${this.name}] Executing fresh targeting analysis`);
      return await this.executeTargetingAnalysis(query);

    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return this.createErrorResponse(query, error);
    }
  }

  extractResidentData(query, preloadedContext) {
  const normalize = (s) => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const queryLower = (query || '').toLowerCase();
  const qn = normalize(query);
    
    // Get raw contact data from intelligent context
    const rawContacts = preloadedContext.intelligentContext?.rawData || 
                       preloadedContext.intelligentContext?.statisticalProfile?.rawContacts || [];

    if (rawContacts.length === 0) {
      console.warn('[NotificationAgent] No raw contact data available for resident extraction');
      return [];
    }

    let residents = [];

    if (
      qn.includes('dissatisfied') ||
      qn.includes('unsatisfied') ||
      qn.includes('insatisfied') ||
      qn.includes('unhappy') ||
      qn.includes('insatisf') ||
      qn.includes('insatisfeito') ||
      qn.includes('insatisfeitos')
    ) {
      // Extract dissatisfied residents with full details
      residents = rawContacts.filter(contact => 
        contact.survey && 
        ['Muito insatisfeito', 'Insatisfeito'].includes(contact.survey.satisfaction)
      ).map(contact => ({
        name: contact.name,
        neighborhood: contact.neighborhood,
        whatsapp: contact.whatsapp,
        satisfaction: contact.survey.satisfaction,
        issue: contact.survey.issue,
        priority: contact.survey.satisfaction === 'Muito insatisfeito' ? 'HIGH' : 'MEDIUM',
        participateInterest: contact.survey.participate
      }));
    } else if (
      (qn.includes('satisfied') || qn.includes('satisfeito') || qn.includes('satisfeitos')) &&
      !(
        qn.includes('dissatisfied') ||
        qn.includes('unsatisfied') ||
        qn.includes('insatisfied') ||
        qn.includes('unhappy') ||
        qn.includes('insatisfeito') ||
        qn.includes('insatisfeitos')
      )
    ) {
      // Extract satisfied residents
      residents = rawContacts.filter(contact => 
        contact.survey && 
        ['Muito satisfeito', 'Satisfeito'].includes(contact.survey.satisfaction)
      ).map(contact => ({
        name: contact.name,
        neighborhood: contact.neighborhood,
        whatsapp: contact.whatsapp,
        satisfaction: contact.survey.satisfaction,
        issue: contact.survey.issue,
        priority: contact.survey.satisfaction === 'Muito satisfeito' ? 'ADVOCATE' : 'POSITIVE',
        participateInterest: contact.survey.participate
      }));
  } else if (
      // Positive participation interest
      (qn.includes('particip') || qn.includes('interested') || qn.includes('interessad') || qn.includes('event')) &&
      !(qn.includes('nao') || qn.includes('not') || qn.includes('sem interesse') || qn.includes('nao interessados'))
    ) {
      // Extract participation-interested residents
      residents = rawContacts.filter(contact => 
        contact.survey && contact.survey.participate === 'Sim'
      ).map(contact => ({
        name: contact.name,
        neighborhood: contact.neighborhood,
        whatsapp: contact.whatsapp,
        satisfaction: contact.survey.satisfaction,
        issue: contact.survey.issue,
        participateInterest: contact.survey.participate,
        priority: 'ENGAGED'
      }));
  } else if (
      // Negative participation interest (not willing)
      qn.includes('particip') && (
        qn.includes('nao') || qn.includes('not') || qn.includes('sem interesse') || qn.includes('nao interessados') || qn.includes('nao querem participar') || qn.includes('nao participaria')
      )
    ) {
      residents = rawContacts.filter(contact => {
        const p = contact?.survey?.participate;
        if (!p) return false;
        const normalized = p.toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        return contact.survey && (normalized === 'nao' || normalized === 'no');
      }).map(contact => ({
        name: contact.name,
        neighborhood: contact.neighborhood,
        whatsapp: contact.whatsapp,
        satisfaction: contact.survey.satisfaction,
        issue: contact.survey.issue,
        participateInterest: contact.survey.participate,
        priority: 'NOT_WILLING'
      }));
  } else if (qn.includes('list') || qn.includes('show') || qn.includes('names') || qn.includes('listar') || qn.includes('mostre') || qn.includes('mostrar') || qn.includes('exibir')) {
      // List all residents with survey responses
      residents = rawContacts.filter(contact => contact.survey).map(contact => ({
        name: contact.name,
        neighborhood: contact.neighborhood,
        whatsapp: contact.whatsapp,
        satisfaction: contact.survey.satisfaction,
        issue: contact.survey.issue,
        participateInterest: contact.survey.participate,
        responded: true
      }));
    }

  // Return full resident list (no limit) as requested
  return residents;
  }

  enhanceLLMResponseWithResidents(llmResponse, residentData, query) {
    if (residentData.length === 0) {
      return llmResponse + '\n\nNote: No residents match the specified criteria in current survey data.';
    }
    const normalize = (s) => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const queryLower = (query || '').toLowerCase();
    const qn = normalize(query);
    let enhancedResponse = llmResponse;
    
    // Add actual resident list based on query type
    if (qn.includes('list') || qn.includes('show') || qn.includes('names')) {
      enhancedResponse += '\n\nACTUAL RESIDENT LIST:\n';
      
      if (qn.includes('dissatisfied') || qn.includes('insatisf')) {
        enhancedResponse += `\nDISSATISFIED RESIDENTS (${residentData.length} total):\n`;
        residentData.forEach((resident, index) => {
          enhancedResponse += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          enhancedResponse += `   • Satisfaction: ${resident.satisfaction}\n`;
          enhancedResponse += `   • Issue: ${resident.issue}\n`;
          enhancedResponse += `   • Priority: ${resident.priority}\n`;
          enhancedResponse += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      } else if ((qn.includes('satisfied') || qn.includes('satisfeito')) && !(qn.includes('dissatisfied') || qn.includes('insatisf'))) {
        enhancedResponse += `\nSATISFIED RESIDENTS (${residentData.length} total):\n`;
        residentData.forEach((resident, index) => {
          enhancedResponse += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          enhancedResponse += `   • Satisfaction: ${resident.satisfaction}\n`;
          enhancedResponse += `   • Satisfied with: ${resident.issue}\n`;
          enhancedResponse += `   • Advocacy potential: ${resident.priority}\n`;
          enhancedResponse += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      } else if (qn.includes('particip') || qn.includes('interested') || qn.includes('interessad')) {
        enhancedResponse += `\nPARTICIPATION-INTERESTED RESIDENTS (${residentData.length} total):\n`;
        residentData.forEach((resident, index) => {
          enhancedResponse += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          enhancedResponse += `   • Satisfaction: ${resident.satisfaction}\n`;
          enhancedResponse += `   • Focus area: ${resident.issue}\n`;
          enhancedResponse += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      } else if (qn.includes('particip') && (qn.includes('nao') || qn.includes('not') || qn.includes('sem interesse') || qn.includes('nao participaria'))) {
        enhancedResponse += `\nPARTICIPATION — NOT WILLING (${residentData.length} total):\n`;
        residentData.forEach((resident, index) => {
          enhancedResponse += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          enhancedResponse += `   • Satisfaction: ${resident.satisfaction}\n`;
          enhancedResponse += `   • Focus area: ${resident.issue}\n`;
          enhancedResponse += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      } else {
        enhancedResponse += `\nALL SURVEY RESPONDENTS (${residentData.length} total):\n`;
        residentData.forEach((resident, index) => {
          enhancedResponse += `${index + 1}. ${resident.name} (${resident.neighborhood}) - ${resident.satisfaction}\n`;
        });
      }
    }

    return enhancedResponse;
  }

  getSegmentTypeFromQuery(query) {
    const normalize = (s) => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const q = normalize(query);
    if (
      q.includes('dissatisfied') || q.includes('unsatisfied') || q.includes('insatisfied') || q.includes('unhappy') ||
      q.includes('insatisfeito') || q.includes('insatisfeitos')
    ) return 'dissatisfied';
    if (q.includes('satisfied') || q.includes('satisfeito') || q.includes('satisfeitos')) return 'satisfied';
  if (q.includes('particip') || q.includes('interessad')) return 'participation';
    return 'general';
  }

  buildSegmentReport(residents, segment) {
    if (!Array.isArray(residents)) return null;
    const total = residents.length;
    const byNeighborhood = {};
    const byIssue = {};
    let advocates = 0, positives = 0, high = 0, medium = 0, participateYes = 0;

    residents.forEach(r => {
      const n = (r.neighborhood || 'Desconhecido');
      byNeighborhood[n] = (byNeighborhood[n] || 0) + 1;
      const issue = (r.issue || r.mainIssue || '—');
      byIssue[issue] = (byIssue[issue] || 0) + 1;
      if (r.priority === 'ADVOCATE') advocates++;
      if (r.priority === 'POSITIVE') positives++;
      if (r.priority === 'HIGH') high++;
      if (r.priority === 'MEDIUM') medium++;
      if (r.participateInterest === 'Sim' || r.participationInterest === true) participateYes++;
    });

    const topNeighborhoods = Object.entries(byNeighborhood)
      .sort((a,b)=>b[1]-a[1]).slice(0,5);
    const topIssues = Object.entries(byIssue)
      .sort((a,b)=>b[1]-a[1]).slice(0,5);

  const label = segment === 'dissatisfied' ? 'Insatisfeitos' : segment === 'satisfied' ? 'Satisfeitos' : segment === 'participation' ? 'Interessados em participar' : 'Contatos';
    const header = `Relatório inteligente — ${label}`;
    const metricsLines = [
      `Total: ${total}`,
      segment === 'dissatisfied' ? `Prioridade: ${high} alta • ${medium} média` : null,
      segment === 'satisfied' ? `Potenciais defensores: ${advocates} • Positivos: ${positives}` : null,
      `Interesse em participar: ${participateYes}`,
      topNeighborhoods.length ? `Top bairros: ` + topNeighborhoods.map(([n,c])=>`${n} (${c})`).join(', ') : null,
      topIssues.length ? `Top assuntos: ` + topIssues.map(([i,c])=>`${i} (${c})`).join(', ') : null,
    ].filter(Boolean);

    const templates = segment === 'dissatisfied' ? [
      'Olá {NOME}, aqui é da Prefeitura. Vimos sua insatisfação com {ASSUNTO}. Podemos conversar e encaminhar sua demanda? Responda com um horário preferido.',
      'Bom dia {NOME}. Sua opinião é muito importante. Sobre {ASSUNTO}, registramos seu relato e queremos agir. Você toparia uma conversa rápida esta semana?'
    ] : segment === 'satisfied' ? [
      'Olá {NOME}! Obrigado pelo retorno positivo sobre {ASSUNTO}. Podemos usar seu depoimento (anônimo) para inspirar outras ações no bairro?',
      'Oi {NOME}, que bom saber que está satisfeito com {ASSUNTO}. Podemos convidar você para um grupo consultivo do bairro?'
    ] : [
      'Olá {NOME}, tudo bem? Gostaríamos de entender melhor suas necessidades no bairro sobre {ASSUNTO}. Podemos conversar?'
    ];

    const text = `${header}\n\n• ${metricsLines.join('\n• ')}\n`;
    return {
      text,
      metrics: {
        total,
        priorities: { high, medium },
        satisfaction: { advocates, positives },
        participationInterested: participateYes,
        topNeighborhoods,
        topIssues
      },
      whatsappTemplates: templates
    };
  }

  async generateIntelligentNotificationWithResidents(query, preloadedContext) {
    const residentData = this.extractResidentData(query, preloadedContext);
    const context = preloadedContext.intelligentContext;
    const stats = context.statisticalProfile;
    
    const queryLower = query.toLowerCase();
    let summary = '';
    const insights = [];
    const recommendations = [];
    
  if (queryLower.includes('dissatisfied') || queryLower.includes('insatisfeito') || queryLower.includes('insatisfeitos')) {
      const highPriority = residentData.filter(r => r.priority === 'HIGH').length;
      const mediumPriority = residentData.filter(r => r.priority === 'MEDIUM').length;
      
      summary = `Municipal Dissatisfaction Analysis\n\n`;
      summary += `Critical Intervention Required: ${residentData.length} residents express dissatisfaction\n\n`;
      summary += `Priority Breakdown:\n`;
      summary += `• High Priority (Muito insatisfeitos): ${highPriority} residents\n`;
      summary += `• Medium Priority (Insatisfeitos): ${mediumPriority} residents\n\n`;
      
      if (residentData.length > 0) {
        summary += `DISSATISFIED RESIDENTS LIST:\n`;
        residentData.forEach((resident, index) => {
          summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          summary += `   • Satisfaction: ${resident.satisfaction}\n`;
          summary += `   • Issue: ${resident.issue}\n`;
          summary += `   • Priority: ${resident.priority}\n`;
          summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      }
      
      insights.push(`${highPriority} cases require immediate intervention within 24-48 hours`);
      insights.push(`${mediumPriority} cases need scheduled follow-up within 1 week`);
      insights.push('Direct contact recommended for all dissatisfied residents');
      
      recommendations.push('Contact high-priority cases immediately with personalized responses');
      recommendations.push('Schedule systematic follow-up for medium-priority cases');
      recommendations.push('Address underlying service delivery issues');
      
  } else if ((queryLower.includes('satisfied') || queryLower.includes('satisfeito') || queryLower.includes('satisfeitos')) && 
         !(queryLower.includes('dissatisfied') || queryLower.includes('insatisfeito') || queryLower.includes('insatisfeitos'))) {
      summary = `Municipal Satisfaction Analysis\n\n`;
      summary += `Positive Engagement Opportunity: ${residentData.length} residents express satisfaction\n\n`;
      
      if (residentData.length > 0) {
        const advocates = residentData.filter(r => r.priority === 'ADVOCATE').length;
        const positive = residentData.filter(r => r.priority === 'POSITIVE').length;
        
        summary += `Satisfaction Breakdown:\n`;
        summary += `• Potential Advocates: ${advocates} residents (muito satisfeitos)\n`;
        summary += `• Positive Feedback: ${positive} residents (satisfeitos)\n\n`;
        
        summary += `SATISFIED RESIDENTS LIST:\n`;
        residentData.forEach((resident, index) => {
          summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          summary += `   • Satisfaction: ${resident.satisfaction}\n`;
          summary += `   • Satisfied with: ${resident.issue}\n`;
          summary += `   • Advocacy potential: ${resident.priority}\n`;
          summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      }
      
      insights.push('Satisfied residents provide valuable advocacy opportunities');
      insights.push('Can serve as community ambassadors and testimonials');
      
      recommendations.push('Engage satisfied residents for community testimonials');
      recommendations.push('Invite advocates to municipal improvement initiatives');
      recommendations.push('Use positive feedback to identify best practices');
      
    } else if (queryLower.includes('particip') || queryLower.includes('interested')) {
      summary = `Municipal Participation Analysis\n\n`;
      summary += `Community Engagement Opportunity: ${residentData.length} residents interested in participation\n\n`;
      
      if (residentData.length > 0) {
        summary += `PARTICIPATION-INTERESTED RESIDENTS:\n`;
        residentData.forEach((resident, index) => {
          summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
          summary += `   • Satisfaction: ${resident.satisfaction}\n`;
          summary += `   • Focus area: ${resident.issue}\n`;
          summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
        });
      }
      
      insights.push(`${residentData.length} residents ready for community engagement`);
      insights.push('Strong foundation for municipal events and initiatives');
      
      recommendations.push('Organize community events with interested residents');
      recommendations.push('Create citizen advisory groups from engaged residents');
      recommendations.push('Use participation interest for municipal planning input');
      
    } else {
      summary = `Municipal Contact Analysis\n\n`;
      summary += `Available for outreach: ${residentData.length} residents with survey responses\n\n`;
      
      if (residentData.length > 0) {
        summary += `RESIDENT CONTACTS:\n`;
        residentData.slice(0, 15).forEach((resident, index) => {
          summary += `${index + 1}. ${resident.name} (${resident.neighborhood}) - ${resident.satisfaction}\n`;
        });
        if (residentData.length > 15) {
          summary += `... and ${residentData.length - 15} more residents\n`;
        }
      }
      
      insights.push(`${residentData.length} residents available for targeted communication`);
      recommendations.push('Segment residents by satisfaction level for targeted messaging');
    }
    
    // Attach intelligent report for this segment
    const segment = this.getSegmentTypeFromQuery(query);
    const report = this.buildSegmentReport(residentData, segment);
    if (report?.text) {
      summary += `\n\n${report.text}`;
    }

    return {
      agent: this.name,
      query,
      analysis: {
        summary,
        insights,
        recommendations,
        residents: residentData,
        report,
        type: 'intelligent_notification_with_residents'
      },
      dataSource: 'municipal_intelligence_system',
      intelligenceLevel: 'fallback_intelligent',
      realData: true,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  extractInsightsFromLLM(llmResult) {
    const insights = [];
    
    if (llmResult.insights && Array.isArray(llmResult.insights)) {
      insights.push(...llmResult.insights.map(insight => 
        typeof insight === 'object' ? insight.content : insight
      ));
    }
    
    const bulletMatches = llmResult.response.match(/[•\-\*]\s*([^\n]+)/g);
    if (bulletMatches) {
      insights.push(...bulletMatches.slice(0, 3).map(match => 
        match.replace(/[•\-\*]\s*/, '').trim()
      ));
    }
    
    return insights.slice(0, 5);
  }

  extractRecommendationsFromLLM(llmResult) {
    const recommendations = [];
    
    if (llmResult.recommendations && Array.isArray(llmResult.recommendations)) {
      recommendations.push(...llmResult.recommendations.map(rec => 
        typeof rec === 'object' ? rec.content : rec
      ));
    }
    
    const actionPatterns = [
      /(?:contact|reach|engage|follow up|send|notify)\s+[^.]+/gi,
      /(?:within|by|before)\s+\d+\s+(?:days?|weeks?|months?)[^.]+/gi
    ];
    
    actionPatterns.forEach(pattern => {
      const matches = llmResult.response.match(pattern);
      if (matches) {
        recommendations.push(...matches.slice(0, 2).map(match => match.trim()));
      }
    });
    
    return recommendations.slice(0, 4);
  }

  async executeTargetingAnalysis(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('dissatisfied')) {
      return await this.getDissatisfiedResidents();
    } else if (queryLower.includes('satisfied') && !queryLower.includes('dissatisfied')) {
      return await this.getSatisfiedResidents();
    } else if (
      (queryLower.includes('particip') || queryLower.includes('interested')) &&
      !(queryLower.includes('nao') || queryLower.includes('não') || queryLower.includes('not'))
    ) {
      return await this.getParticipationInterested();
    } else if (queryLower.includes('particip') && (queryLower.includes('nao') || queryLower.includes('não') || queryLower.includes('not'))) {
      return await this.getParticipationNotInterested();
    } else {
      return await this.getGeneralTargeting(query);
    }
  }

  async getDissatisfiedResidents() {
    const dissatisfiedData = await this.analysisEngine.getDissatisfiedResidents();
    
    let summary = `Municipal Dissatisfaction Analysis\n\n`;
    summary += `${dissatisfiedData.urgencyLevel.charAt(0).toUpperCase() + dissatisfiedData.urgencyLevel.slice(1)} Intervention Needed: ${dissatisfiedData.total} residents express dissatisfaction\n\n`;
    
    if (dissatisfiedData.residents && dissatisfiedData.residents.length > 0) {
      const highPriority = dissatisfiedData.residents.filter(r => r.priority === 'HIGH');
      const mediumPriority = dissatisfiedData.residents.filter(r => r.priority === 'MEDIUM');
      
      summary += `Priority Assessment:\n`;
      summary += `• High Priority: ${highPriority.length} residents (muito insatisfeitos)\n`;
      summary += `• Medium Priority: ${mediumPriority.length} residents (insatisfeitos)\n\n`;
      
      summary += `DISSATISFIED RESIDENTS:\n`;
      dissatisfiedData.residents.forEach((resident, index) => {
        summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
        summary += `   • Satisfaction: ${resident.satisfaction}\n`;
        summary += `   • Issue: ${resident.mainIssue}\n`;
        summary += `   • Priority: ${resident.priority}\n`;
        summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
      });
    }
    
    return {
      agent: this.name,
      analysis: {
        summary,
        insights: dissatisfiedData.insights || [],
        recommendations: dissatisfiedData.recommendations || [],
        residents: dissatisfiedData.residents || [],
        urgencyLevel: dissatisfiedData.urgencyLevel
      },
      dataSource: 'municipal_analysis_engine',
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  async getSatisfiedResidents() {
    const analysisEngine = this.analysisEngine;
    const dataAccess = analysisEngine.dataAccess;
    const allContacts = dataAccess.getAllContacts();
    
    const satisfiedResidents = allContacts.filter(contact => 
      contact.survey && 
      ['Muito satisfeito', 'Satisfeito'].includes(contact.survey.satisfaction)
    ).map(contact => ({
      name: contact.name,
      neighborhood: contact.neighborhood,
      whatsapp: contact.whatsapp,
      satisfaction: contact.survey.satisfaction,
      mainIssue: contact.survey.issue,
      priority: contact.survey.satisfaction === 'Muito satisfeito' ? 'ADVOCATE' : 'POSITIVE'
    }));

    let summary = `Municipal Satisfaction Analysis\n\n`;
    summary += `Positive Engagement Opportunity: ${satisfiedResidents.length} residents express satisfaction\n\n`;
    
    if (satisfiedResidents.length > 0) {
      const advocates = satisfiedResidents.filter(r => r.priority === 'ADVOCATE');
      const positive = satisfiedResidents.filter(r => r.priority === 'POSITIVE');
      
      summary += `Satisfaction Breakdown:\n`;
      summary += `• Potential Advocates: ${advocates.length} residents (muito satisfeitos)\n`;
      summary += `• Positive Feedback: ${positive.length} residents (satisfeitos)\n\n`;
      
      summary += `SATISFIED RESIDENTS:\n`;
      satisfiedResidents.forEach((resident, index) => {
        summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
        summary += `   • Satisfaction: ${resident.satisfaction}\n`;
        summary += `   • Satisfied with: ${resident.mainIssue}\n`;
        summary += `   • Potential: ${resident.priority}\n`;
        summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
      });
    }
    
    return {
      agent: this.name,
      analysis: {
        summary,
        insights: [
          'Satisfied residents provide valuable advocacy opportunities',
          'Positive feedback indicates successful service delivery areas',
          'Community ambassadors can help improve overall satisfaction'
        ],
        recommendations: [
          'Engage satisfied residents for community testimonials',
          'Invite advocates to participate in municipal improvement initiatives',
          'Use positive feedback to identify and replicate best practices'
        ],
        residents: satisfiedResidents
      },
      dataSource: 'municipal_analysis_engine',
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  async getParticipationInterested() {
    const participationData = await this.analysisEngine.getParticipationWilling();
    
    let summary = `Municipal Participation Analysis\n\n`;
    summary += `Community Engagement Opportunity: ${participationData.total} residents interested in participation\n\n`;
    
    if (participationData.residents && participationData.residents.length > 0) {
      summary += `PARTICIPATION-INTERESTED RESIDENTS:\n`;
      participationData.residents.forEach((resident, index) => {
        summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
        summary += `   • Satisfaction: ${resident.satisfaction}\n`;
        summary += `   • Issue focus: ${resident.mainIssue}\n`;
        summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
      });
    }
    
    return {
      agent: this.name,
      analysis: {
        summary,
        insights: participationData.insights || [],
        recommendations: participationData.recommendations || [],
        residents: participationData.residents || []
      },
      dataSource: 'municipal_analysis_engine',
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  async getParticipationNotInterested() {
    const participationData = await this.analysisEngine.getParticipationNotWilling();
    
    let summary = `Municipal Participation Analysis — Not Willing\n\n`;
    summary += `Current Hesitation: ${participationData.total} residents not interested in participation at this time\n\n`;
    
    if (participationData.residents && participationData.residents.length > 0) {
      summary += `PARTICIPATION — NOT WILLING (RESIDENTS):\n`;
      participationData.residents.forEach((resident, index) => {
        summary += `${index + 1}. ${resident.name} (${resident.neighborhood})\n`;
        summary += `   • Satisfaction: ${resident.satisfaction}\n`;
        summary += `   • Issue focus: ${resident.mainIssue}\n`;
        summary += `   • WhatsApp: ${resident.whatsapp}\n\n`;
      });
    }
    
    return {
      agent: this.name,
      analysis: {
        summary,
        insights: participationData.insights || [],
        recommendations: participationData.recommendations || [],
        residents: participationData.residents || []
      },
      dataSource: 'municipal_analysis_engine',
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  async getGeneralTargeting(query) {
    return {
      agent: this.name,
      analysis: {
        summary: `Municipal notification targeting ready for: "${query}". Specify target criteria (dissatisfied, satisfied, interested) for detailed resident lists with names and contact information.`,
        insights: ['Resident targeting requires specific satisfaction or participation criteria'],
        recommendations: ['Use specific queries like "list dissatisfied residents" or "list satisfied residents"'],
        residents: []
      },
      dataSource: 'municipal_analysis_engine',
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  createErrorResponse(query, error) {
    return {
      agent: this.name,
      error: error.message,
      analysis: {
        summary: `Notification analysis error for: "${query}". Please try again.`,
        insights: ['System error occurred during resident targeting'],
        recommendations: ['Retry query or contact system administrator'],
        residents: []
      },
      timestamp: new Date().toISOString(),
      success: false
    };
  }
}

const notificationAgentInstance = new IntelligentNotificationAgent();

async function notificationAgent(query, llmResult, preloadedContext = null) {
  return await notificationAgentInstance.processQuery(query, llmResult, preloadedContext);
}

module.exports = { notificationAgent };
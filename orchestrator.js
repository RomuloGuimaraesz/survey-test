// orchestrator.js - Intelligent Municipal Orchestrator with Failsafe Data Pipeline
const axios = require('axios');
const IntelligentDataProcessor = require('./services/IntelligentDataProcessor');
const MunicipalPromptEngine = require('./services/MunicipalPromptEngine');
const ResponseProcessor = require('./services/ResponseProcessor');

class IntelligentOrchestrator {
  constructor() {
    this.dataProcessor = new IntelligentDataProcessor();
    this.promptEngine = new MunicipalPromptEngine();
    this.responseProcessor = new ResponseProcessor();
    this.name = 'Intelligent Municipal Orchestrator';
    this.version = '2.0-streamlined';
  }

  async orchestrate(query) {
    const startTime = Date.now();
    console.log(`[${this.name}] Processing: "${query}"`);

    try {
      // Phase 1: Query Analysis
      const queryAnalysis = this.analyzeQueryIntelligently(query);
      console.log(`[Orchestrator] Intent: ${queryAnalysis.primaryIntent}, Type: ${queryAnalysis.queryType}`);

      // Phase 2: Generate Real Data Context
      const intelligentContext = await this.dataProcessor.generateIntelligentContext(queryAnalysis);
      console.log(`[Orchestrator] Context generated with ${intelligentContext.rawData?.length || 0} contacts`);

      // Phase 3: Route to Agent for Real Data Extraction
      const agentResult = await this.routeToAgent(query, queryAnalysis, intelligentContext);
      console.log(`[Orchestrator] Agent processed, residents found: ${agentResult.analysis?.residents?.length || 0}`);

      // Phase 4: Try LLM Enhancement (Non-Critical)
      let llmResult = null;
      if (process.env.GROQ_API_KEY && queryAnalysis.primaryIntent !== 'ticket') {
        try {
          llmResult = await this.enhanceWithLLM(query, queryAnalysis, intelligentContext, agentResult);
          console.log(`[Orchestrator] LLM enhancement: ${llmResult?.quality?.level || 'failed'}`);
        } catch (error) {
          console.warn('[Orchestrator] LLM enhancement failed, using data-driven response:', error.message);
        }
      }

      // Optional Phase 5: If notification, synthesize knowledge brief leveraging results
      let knowledgeResult = null;
      if (queryAnalysis.primaryIntent === 'notification') {
        try {
          knowledgeResult = await this.synthesizeKnowledgeFromNotification(
            query, queryAnalysis, intelligentContext, agentResult, llmResult
          );
        } catch (e) {
          console.warn('[Orchestrator] Knowledge synthesis skipped:', e.message);
        }
      }

      // Phase 6: Construct Final Response (Real Data + Optional LLM Narrative + Knowledge Brief)
      const finalResponse = this.constructFinalResponse(
        query, queryAnalysis, intelligentContext, agentResult, llmResult, startTime, knowledgeResult
      );

      return finalResponse;

    } catch (error) {
      console.error('[Orchestrator] Critical error:', error);
      return this.createErrorResponse(query, error, startTime);
    }
  }

  async synthesizeKnowledgeFromNotification(query, queryAnalysis, intelligentContext, agentResult, llmResult) {
    // Build a preloaded context for knowledgeAgent using notification outputs
    const knowledgePreload = {
      intelligentContext,
      queryAnalysis: { primaryIntent: 'knowledge', queryType: 'analysis' },
      analysisResults: agentResult.analysis,
      llmResult: llmResult || null
    };
    const { knowledgeAgent } = require('./agents/knowledgeAgent');
    return await knowledgeAgent(query, null, knowledgePreload);
  }

  analyzeQueryIntelligently(query) {
  const normalize = (s) => (s || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const qn = normalize(query);
    
    const analysis = {
      primaryIntent: 'knowledge',
      queryType: 'analysis',
      dataNeeds: [],
      urgency: 'normal'
    };

  // CRITICAL: Resident listing detection - extended for PT-BR (accent-insensitive)
  const listVerbs = ['list', 'show', 'names', 'display', 'listar', 'lista', 'mostre', 'mostrar', 'exibir', 'exiba', 'traga', 'me mostre', 'me traga'];
  const residentNouns = ['resident', 'citizen', 'residente', 'morador', 'moradores', 'cidadao', 'cidadaos', 'cidadas'];
    const satisfiedTokens = [
      'dissatisfied','unsatisfied','insatisfied','unhappy',
      'satisfied',
    'insatisfeito','insatisfeitos','insatisfacao',
      'satisfeito','satisfeitos'
    ];
  const participationTokens = ['interested', 'interessado', 'interessados', 'participated', 'participar', 'participantes', 'participacao', 'participaria'];

  const hasListVerb = listVerbs.some(t => qn.includes(t));
  const hasResidentNoun = residentNouns.some(t => qn.includes(t));
  const hasSatisfiedToken = satisfiedTokens.some(t => qn.includes(t));
  const hasParticipationToken = participationTokens.some(t => qn.includes(t));

  if (hasListVerb && (hasResidentNoun || hasSatisfiedToken || hasParticipationToken)) {
      analysis.primaryIntent = 'notification';
      analysis.queryType = 'listing';
      console.log(`[Orchestrator] Resident listing detected - routing to notification agent`);
      return analysis;
    }

    // Who clicked but didn't complete
  if ((qn.includes('clicked') || qn.includes('abandoned')) && 
    (qn.includes('didn') || qn.includes('not') || qn.includes('survey'))) {
      analysis.primaryIntent = 'notification';
      analysis.queryType = 'abandonment';
      analysis.dataNeeds.push('abandonment');
      return analysis;
    }

    // Other intents
  if (qn.includes('send') || qn.includes('message') || 
    qn.includes('notify') || qn.includes('contact')) {
      analysis.primaryIntent = 'notification';
  } else if (qn.includes('system') || qn.includes('health') || 
         qn.includes('status') || qn.includes('export')) {
      analysis.primaryIntent = 'ticket';
    }

    // Data needs
    if (qn.includes('dissatisfied') || qn.includes('insatisf') || qn.includes('insatisfeito')) {
      analysis.dataNeeds.push('dissatisfied');
    }
    if ((qn.includes('satisfied') || qn.includes('satisfeito')) && 
      !(qn.includes('dissatisfied') || qn.includes('insatisfeito'))) {
      analysis.dataNeeds.push('satisfied');
    }
    if (qn.includes('particip') || qn.includes('interested') || qn.includes('interessad')) {
      analysis.dataNeeds.push('participation');
    }
    if (qn.includes('neighborhood') || qn.includes('equity') || qn.includes('bairro')) {
      analysis.dataNeeds.push('geographic');
    }

    return analysis;
  }

  async routeToAgent(query, queryAnalysis, intelligentContext) {
    console.log(`[Orchestrator] Routing to ${queryAnalysis.primaryIntent} agent`);
    
    const enhancedContext = {
      queryAnalysis,
      intelligentContext,
      processingLevel: 'intelligent'
    };

    try {
      switch (queryAnalysis.primaryIntent) {
        case 'notification':
          const { notificationAgent } = require('./agents/notificationAgent');
          return await notificationAgent(query, null, enhancedContext);
          
        case 'knowledge':
          const { knowledgeAgent } = require('./agents/knowledgeAgent');
          return await knowledgeAgent(query, null, enhancedContext);
          
        case 'ticket':
          const { ticketAgent } = require('./agents/ticketAgent');
          return await ticketAgent(query, null, enhancedContext);
          
        default:
          const { knowledgeAgent: defaultAgent } = require('./agents/knowledgeAgent');
          return await defaultAgent(query, null, enhancedContext);
      }
    } catch (error) {
      console.error(`[Orchestrator] Agent ${queryAnalysis.primaryIntent} failed:`, error.message);
      throw error;
    }
  }

  async enhanceWithLLM(query, queryAnalysis, intelligentContext, agentResult) {
    const groqApiKey = process.env.GROQ_API_KEY;
    const groqModel = 'llama-3.3-70b-versatile';
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';

    // Build focused prompt that emphasizes using the real data
    const systemPrompt = this.buildFocusedSystemPrompt(queryAnalysis, agentResult);
    const userPrompt = this.buildFocusedUserPrompt(query, agentResult, intelligentContext);

    console.log(`[LLM] Sending enhancement request (${systemPrompt.length + userPrompt.length} chars)`);

    const requestData = {
      model: groqModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
      top_p: 0.9
    };

    const response = await axios.post(groqUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const rawContent = response.data.choices[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error('Empty LLM response');
    }

    // Process and validate response
    const processedResponse = this.responseProcessor.processResponse(
      rawContent, queryAnalysis, intelligentContext, {
        provider: 'groq',
        model: groqModel
      }
    );

    return {
      ...processedResponse,
      provider: 'groq',
      model: groqModel,
      intelligenceLevel: 'high'
    };
  }

  buildFocusedSystemPrompt(queryAnalysis, agentResult) {
    return `You are a Municipal Intelligence Analyst providing data-driven insights for city governance.

CRITICAL INSTRUCTION: You have been provided with REAL citizen data including actual names and details. 
Use this specific data in your response. DO NOT generate fictional names or statistics.

Your response should:
1. Provide a clear executive summary
2. Reference the actual data provided (names, neighborhoods, issues)
3. Offer actionable recommendations based on the real patterns
4. Maintain professional municipal reporting standards

Focus on ${queryAnalysis.primaryIntent} analysis with ${queryAnalysis.queryType} format.`;
  }

  buildFocusedUserPrompt(query, agentResult, intelligentContext) {
    const stats = intelligentContext.statisticalProfile;
    
    let dataSection = '';
    if (agentResult.analysis?.residents && agentResult.analysis.residents.length > 0) {
      dataSection = `\nACTUAL RESIDENT DATA (${agentResult.analysis.residents.length} records):\n`;
      agentResult.analysis.residents.slice(0, 10).forEach((resident, index) => {
        dataSection += `${index + 1}. ${resident.name} (${resident.neighborhood}) - ${resident.satisfaction || resident.status || 'Status unknown'}\n`;
      });
      if (agentResult.analysis.residents.length > 10) {
        dataSection += `... and ${agentResult.analysis.residents.length - 10} more residents\n`;
      }
    }

    return `Query: "${query}"

MUNICIPAL DATABASE STATISTICS:
- Total Citizens: ${stats.population.total}
- Response Rate: ${stats.population.responseRate}%
- Average Satisfaction: ${stats.satisfaction.averageScore}/5
- Geographic Coverage: ${stats.geographic.totalNeighborhoods} neighborhoods
${dataSection}

AGENT ANALYSIS RESULTS:
${agentResult.analysis?.summary || 'Analysis completed'}

Provide a professional municipal intelligence brief that incorporates the ACTUAL resident data above.
Focus on actionable insights and maintain factual accuracy using the real names and data provided.`;
  }

  constructFinalResponse(query, queryAnalysis, intelligentContext, agentResult, llmResult, startTime, knowledgeResult = null) {
    const processingTime = Date.now() - startTime;
    
    // Determine primary response source
    let primaryResponse = agentResult.analysis?.summary || 'Analysis completed';
    let responseQuality = 'data-driven';
    
    // Use LLM response if it's high quality and actually uses the data
    if (llmResult?.quality?.level === 'excellent' || llmResult?.quality?.level === 'good') {
      // Verify LLM used actual data (simple check for resident names)
      const hasRealData = agentResult.analysis?.residents?.some(r => 
        llmResult.response.includes(r.name)
      );
      
      if (hasRealData || llmResult.response.length > primaryResponse.length * 1.5) {
        primaryResponse = llmResult.response;
        responseQuality = 'llm-enhanced';
        console.log('[Orchestrator] Using LLM-enhanced response');
      } else {
        console.log('[Orchestrator] LLM response lacks real data, using agent response');
      }
    }

  return {
      // Core response fields
      query,
      intent: queryAnalysis.primaryIntent,
      response: primaryResponse,
      
      // CRITICAL: Always include real resident data
      residents: agentResult.analysis?.residents || [],
  // Surface structured report from agent analysis when available
  report: agentResult.analysis?.report || null,
  // Knowledge brief synthesized from notification results (optional)
  knowledgeBrief: knowledgeResult?.analysis?.summary || null,
      
      // Additional insights
      insights: agentResult.analysis?.insights || [],
      recommendations: agentResult.analysis?.recommendations || [],
      
      // Metadata
      success: true,
      confidence: this.calculateConfidence(agentResult, llmResult),
      processingTime,
      dataSource: 'municipal_database',
      responseQuality,
      llmEnhanced: responseQuality === 'llm-enhanced',
  provider: llmResult?.provider || undefined,
  model: llmResult?.model || undefined,
      
      // Statistics summary
      statistics: {
        totalContacts: intelligentContext.statisticalProfile?.population?.total || 0,
        responseRate: intelligentContext.statisticalProfile?.population?.responseRate || 0,
        satisfactionScore: intelligentContext.statisticalProfile?.satisfaction?.averageScore || 0
      },
      
      // Architecture info
      architecture: {
        version: this.version,
        components: ['IntelligentDataProcessor', 'AgentRouter', llmResult ? 'LLM-Enhancement' : null].filter(Boolean)
      },
      
      timestamp: new Date().toISOString()
    };
  }

  calculateConfidence(agentResult, llmResult) {
    // Base confidence from data availability
    let confidence = 0.7;
    
    // Boost for having real residents
    if (agentResult.analysis?.residents?.length > 0) {
      confidence += 0.15;
    }
    
    // Boost for LLM enhancement
    if (llmResult?.quality?.level === 'excellent') {
      confidence += 0.1;
    } else if (llmResult?.quality?.level === 'good') {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }

  createErrorResponse(query, error, startTime) {
    return {
      query,
      error: error.message,
      response: `Error processing query: ${error.message}. Please try again.`,
      residents: [],
      success: false,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const orchestratorInstance = new IntelligentOrchestrator();

async function orchestrator(query) {
  return await orchestratorInstance.orchestrate(query);
}

// Export for UI endpoint compatibility
function createUIResponse(result) {
  return {
    response: result.response,
    intent: result.intent,
    confidence: result.confidence,
    agent: `${result.intent?.charAt(0).toUpperCase()}${result.intent?.slice(1)} Agent`,
    residents: result.residents,
    success: result.success,
    timestamp: result.timestamp
  };
}

module.exports = orchestrator;
module.exports.orchestrator = orchestrator;
module.exports.createUIResponse = createUIResponse;
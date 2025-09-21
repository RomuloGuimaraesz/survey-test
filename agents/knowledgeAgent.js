// agents/knowledgeAgent.js - Refactored to use intelligent LLM responses properly
const MunicipalAnalysisEngine = require('../services/MunicipalAnalysisEngine');

class IntelligentKnowledgeAgent {
  constructor() {
    this.name = 'Knowledge Agent';
    this.analysisEngine = new MunicipalAnalysisEngine();
  }

  async processQuery(query, llmResult, preloadedContext = null) {
    try {
      console.log(`[${this.name}] Processing: ${query}`);
      
      // PRIORITY 1: Use intelligent LLM response from new orchestrator
      if (preloadedContext?.llmResult?.response && 
          (preloadedContext.llmResult.quality?.level === 'excellent' || 
           preloadedContext.llmResult.quality?.level === 'good')) {
        console.log(`[${this.name}] Using intelligent LLM response from new orchestrator (quality: ${preloadedContext.llmResult.quality.level})`);
        
        return {
          agent: this.name,
          query,
          analysis: {
            summary: preloadedContext.llmResult.response,
            insights: this.extractInsightsFromLLM(preloadedContext.llmResult),
            recommendations: this.extractRecommendationsFromLLM(preloadedContext.llmResult),
            type: preloadedContext.queryAnalysis?.queryType || 'intelligent_analysis',
            confidence: preloadedContext.llmResult.metadata?.confidence || 0.85,
            dataPoints: this.extractDataPoints(preloadedContext.intelligentContext)
          },
          dataSource: 'municipal_intelligence_system',
          intelligenceLevel: preloadedContext.llmResult.intelligenceLevel,
          quality: preloadedContext.llmResult.quality,
          realData: true,
          timestamp: new Date().toISOString(),
          success: true
        };
      }

      // PRIORITY 2: Check for legacy LLM synthesis (old orchestrator compatibility)
      if (preloadedContext?.llmSynthesis?.intelligenceLevel === 'high' && preloadedContext.llmSynthesis.synthesis) {
        console.log(`[${this.name}] Using legacy LLM synthesis`);
        
        return {
          agent: this.name,
          query,
          analysis: {
            summary: preloadedContext.llmSynthesis.synthesis,
            insights: [`Processed ${preloadedContext.dataContext?.raw?.totalContacts || 'unknown'} contacts`],
            recommendations: ['Data-driven insights provided above'],
            type: preloadedContext.queryAnalysis?.queryType || 'legacy_synthesis'
          },
          dataSource: 'municipal_intelligence_system',
          intelligenceLevel: preloadedContext.llmSynthesis.intelligenceLevel,
          realData: true,
          timestamp: new Date().toISOString(),
          success: true
        };
      }

      // PRIORITY 3: Enhanced fallback with intelligent context
      if (preloadedContext?.intelligentContext) {
        console.log(`[${this.name}] No LLM response available, using intelligent fallback with context`);
        return this.generateIntelligentFallback(query, preloadedContext);
      }

      // PRIORITY 4: Standard analysis engine fallback
      console.log(`[${this.name}] Using standard analysis engine fallback`);
      return await this.executeStandardAnalysis(query, preloadedContext);

    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return this.createErrorResponse(query, error);
    }
  }

  extractInsightsFromLLM(llmResult) {
    const insights = [];
    
    // Extract insights from LLM response
    if (llmResult.insights && Array.isArray(llmResult.insights)) {
      insights.push(...llmResult.insights.map(insight => 
        typeof insight === 'object' ? insight.content : insight
      ));
    }
    
    // Extract bullet points from response text
    const bulletMatches = llmResult.response.match(/[•\-\*]\s*([^\n]+)/g);
    if (bulletMatches) {
      insights.push(...bulletMatches.slice(0, 3).map(match => 
        match.replace(/[•\-\*]\s*/, '').trim()
      ));
    }
    
    // Extract numbered points
    const numberedMatches = llmResult.response.match(/\d+\.\s*([^\n]+)/g);
    if (numberedMatches) {
      insights.push(...numberedMatches.slice(0, 2).map(match => 
        match.replace(/\d+\.\s*/, '').trim()
      ));
    }
    
    return insights.slice(0, 5); // Limit to 5 key insights
  }

  extractRecommendationsFromLLM(llmResult) {
    const recommendations = [];
    
    // Extract recommendations from structured response
    if (llmResult.recommendations && Array.isArray(llmResult.recommendations)) {
      recommendations.push(...llmResult.recommendations.map(rec => 
        typeof rec === 'object' ? rec.content : rec
      ));
    }
    
    // Look for action-oriented phrases in the response
    const actionPatterns = [
      /(?:implement|establish|create|develop|schedule|contact|address)\s+[^.]+/gi,
      /(?:should|recommend|suggest)\s+[^.]+/gi,
      /(?:within|by|before)\s+\d+\s+(?:days?|weeks?|months?)[^.]+/gi
    ];
    
    actionPatterns.forEach(pattern => {
      const matches = llmResult.response.match(pattern);
      if (matches) {
        recommendations.push(...matches.slice(0, 2).map(match => match.trim()));
      }
    });
    
    return recommendations.slice(0, 4); // Limit to 4 key recommendations
  }

  extractDataPoints(intelligentContext) {
    if (!intelligentContext || !intelligentContext.statisticalProfile) return {};
    
    const stats = intelligentContext.statisticalProfile;
    return {
      totalContacts: stats.population?.total || 0,
      responseRate: stats.population?.responseRate || 0,
      satisfactionScore: stats.satisfaction?.averageScore || 0,
      neighborhoods: stats.geographic?.totalNeighborhoods || 0,
      reliability: stats.satisfaction?.reliability || 'unknown'
    };
  }

  generateIntelligentFallback(query, preloadedContext) {
    const context = preloadedContext.intelligentContext;
    const stats = context.statisticalProfile;
    
    let summary = '';
    const insights = [];
    const recommendations = [];
    
    if (stats) {
      summary = `Municipal analysis of ${stats.population.total} citizens with ${stats.population.responseRate}% response rate. `;
      summary += `Average satisfaction: ${stats.satisfaction.averageScore}/5. `;
      summary += `Coverage: ${stats.geographic.totalNeighborhoods} neighborhoods.`;
      
      // Generate contextual insights
      if (parseFloat(stats.satisfaction.averageScore) < 3.0) {
        insights.push('Satisfaction scores below 3.0/5 indicate need for systematic intervention');
        recommendations.push('Priority focus on addressing dissatisfaction through direct engagement');
      }
      
      if (parseFloat(stats.population.responseRate) < 50) {
        insights.push('Response rate below 50% suggests engagement optimization opportunities');
        recommendations.push('Implement multi-channel outreach to improve participation');
      }
      
      if (parseFloat(stats.geographic.equityGap) > 25) {
        insights.push('Geographic equity gap exceeds 25 points indicating service disparities');
        recommendations.push('Targeted intervention for underperforming neighborhoods');
      }
    } else {
      summary = `Municipal knowledge analysis ready for: "${query}". Enhanced data processing available with adequate citizen feedback data.`;
      insights.push('Sufficient data collection needed for detailed analysis');
      recommendations.push('Implement systematic citizen feedback mechanisms');
    }
    
    return {
      agent: this.name,
      query,
      analysis: {
        summary,
        insights,
        recommendations,
        type: 'intelligent_fallback',
        dataPoints: this.extractDataPoints(context)
      },
      dataSource: 'municipal_intelligence_system',
      intelligenceLevel: 'fallback_intelligent',
      realData: true,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  async executeStandardAnalysis(query, preloadedContext) {
    const analysisType = this.determineAnalysisType(query);
    let analysis;
    
    if (preloadedContext?.analysisResults) {
      analysis = preloadedContext.analysisResults;
    } else {
      analysis = await this.executeAnalysis(analysisType, query);
    }
    
    const response = this.generateResponse(query, analysis, analysisType);
    
    return {
      agent: this.name,
      query,
      analysis: response,
      analysisType,
      dataSource: 'data.json',
      realData: true,
      timestamp: new Date().toISOString(),
      success: true
    };
  }

  createErrorResponse(query, error) {
    return {
      agent: this.name,
      error: error.message,
      analysis: {
        summary: this.getFallbackResponse(query),
        insights: ['System error occurred during processing'],
        recommendations: ['Retry query or contact system administrator'],
        type: 'error_fallback'
      },
      timestamp: new Date().toISOString(),
      success: false
    };
  }

  // === EXISTING METHODS (preserved for compatibility) ===
  
  determineAnalysisType(query) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('summary') || queryLower.includes('overview') || 
        queryLower.includes('analysis') || queryLower.includes('report')) {
      return 'comprehensive';
    }
    
    if (queryLower.includes('satisfaction') || queryLower.includes('satisf')) {
      return 'satisfaction';
    }
    
    if (queryLower.includes('issue') || queryLower.includes('problem') || 
        queryLower.includes('concern') || queryLower.includes('complaint')) {
      return 'issues';
    }
    
    if (queryLower.includes('neighborhood') || queryLower.includes('bairro') || 
        queryLower.includes('area') || queryLower.includes('district')) {
      return 'neighborhoods';
    }
    
    if (queryLower.includes('participat') || queryLower.includes('event') || 
        queryLower.includes('meeting') || queryLower.includes('community')) {
      return 'participation';
    }
    
    if (queryLower.includes('engagement') || queryLower.includes('response') || 
        queryLower.includes('rate') || queryLower.includes('click')) {
      return 'engagement';
    }
    
    return 'comprehensive';
  }

  async executeAnalysis(analysisType, query) {
    const analysis = {};
    
    switch (analysisType) {
      case 'satisfaction':
        analysis.satisfaction = await this.analysisEngine.analyzeSatisfaction();
        if (query.toLowerCase().includes('neighborhood') || query.toLowerCase().includes('bairro')) {
          analysis.neighborhoods = await this.analysisEngine.analyzeNeighborhoods();
        }
        break;
        
      case 'issues':
        analysis.issues = await this.analysisEngine.analyzeIssues();
        analysis.neighborhoods = await this.analysisEngine.analyzeNeighborhoods();
        break;
        
      case 'neighborhoods':
        analysis.neighborhoods = await this.analysisEngine.analyzeNeighborhoods();
        analysis.satisfaction = await this.analysisEngine.analyzeSatisfaction();
        break;
        
      case 'participation':
        analysis.participation = await this.analysisEngine.analyzeParticipation();
        analysis.neighborhoods = await this.analysisEngine.analyzeNeighborhoods();
        break;
        
      case 'engagement':
        analysis.engagement = await this.analysisEngine.analyzeEngagement();
        analysis.neighborhoods = await this.analysisEngine.analyzeNeighborhoods();
        break;
        
      case 'comprehensive':
      default:
        analysis.satisfaction = await this.analysisEngine.analyzeSatisfaction();
        analysis.issues = await this.analysisEngine.analyzeIssues();
        analysis.neighborhoods = await this.analysisEngine.analyzeNeighborhoods();
        analysis.engagement = await this.analysisEngine.analyzeEngagement();
        analysis.participation = await this.analysisEngine.analyzeParticipation();
        break;
    }
    
    return analysis;
  }

  generateResponse(query, analysis, analysisType) {
    const response = {
      type: analysisType,
      summary: '',
      insights: [],
      recommendations: [],
      data: analysis
    };

    response.summary = this.generateSummary(analysisType, analysis, query);
    response.insights = this.aggregateInsights(analysis);
    response.recommendations = this.aggregateRecommendations(analysis);
    
    if (Object.keys(analysis).length > 1) {
      const crossInsights = this.generateCrossAnalysisInsights(analysis, query);
      response.insights.push(...crossInsights.insights);
      response.recommendations.push(...crossInsights.recommendations);
    }

    return response;
  }

  generateSummary(analysisType, analysis, query) {
    switch (analysisType) {
      case 'satisfaction':
        const sat = analysis.satisfaction;
        if (!sat || sat.total === 0) {
          return 'No satisfaction data available for analysis.';
        }
        return `Satisfaction analysis from ${sat.total} residents shows average score of ${sat.averageScore}/5.`;

      case 'issues':
        const issues = analysis.issues;
        if (!issues || issues.total === 0) {
          return 'No issue data available for analysis.';
        }
        const topIssue = issues.breakdown[0];
        return `Issue analysis from ${issues.total} responses identifies ${topIssue.issue} as the primary concern.`;

      case 'neighborhoods':
        const neighborhoods = analysis.neighborhoods;
        if (!neighborhoods || neighborhoods.totalNeighborhoods === 0) {
          return 'No neighborhood data available.';
        }
        return `Geographic analysis covers ${neighborhoods.totalNeighborhoods} neighborhoods.`;

      case 'participation':
        const participation = analysis.participation;
        if (!participation || participation.total === 0) {
          return 'No participation data available.';
        }
        return `Community participation analysis: ${participation.interested} out of ${participation.total} residents interested.`;

      case 'engagement':
        const engagement = analysis.engagement;
        if (!engagement) {
          return 'No engagement data available.';
        }
        return `Engagement analysis: ${engagement.answered}/${engagement.total} responses.`;

      default:
        return `Municipal analysis completed.`;
    }
  }

  aggregateInsights(analysis) {
    const allInsights = [];
    
    Object.values(analysis).forEach(component => {
      if (component && component.insights) {
        allInsights.push(...component.insights.slice(0, 3));
      }
    });
    
    return allInsights.slice(0, 8);
  }

  aggregateRecommendations(analysis) {
    const allRecommendations = [];
    
    Object.values(analysis).forEach(component => {
      if (component && component.recommendations) {
        allRecommendations.push(...component.recommendations.slice(0, 2));
      }
    });
    
    return allRecommendations.slice(0, 6);
  }

  generateCrossAnalysisInsights(analysis, query) {
    const insights = [];
    const recommendations = [];

    if (analysis.satisfaction && analysis.neighborhoods) {
      const avgSatisfaction = parseFloat(analysis.satisfaction.averageScore);
      const lowResponseAreas = analysis.neighborhoods.needsAttention?.length || 0;
      
      if (avgSatisfaction < 3.0 && lowResponseAreas > 0) {
        insights.push('Low satisfaction correlates with poor response rates in some areas');
        recommendations.push('Address satisfaction issues to improve engagement');
      }
    }

    return { insights, recommendations };
  }

  getFallbackResponse(query) {
    return `Municipal knowledge analysis ready for: "${query}". Please specify what aspect you'd like to explore.`;
  }
}

const knowledgeAgentInstance = new IntelligentKnowledgeAgent();

async function knowledgeAgent(query, llmResult, preloadedContext = null) {
  return await knowledgeAgentInstance.processQuery(query, llmResult, preloadedContext);
}

module.exports = { knowledgeAgent };
// services/MunicipalPromptEngine.js - Intelligent prompt construction for municipal AI
class MunicipalPromptEngine {
  constructor() {
    this.domain = 'Municipal Citizen Engagement & Urban Governance';
    this.version = '2.0.intelligent';
  }

  /**
   * Build intelligent system prompt based on agent role and query analysis
   */
  buildSystemPrompt(agentType, queryAnalysis, intelligentContext) {
    const baseContext = this.getMunicipalExpertiseContext();
    const roleSpecialization = this.getRoleSpecialization(agentType);
    const outputFormat = this.getStructuredOutputFormat(queryAnalysis.queryType);
    
    return `${baseContext}

${roleSpecialization}

${outputFormat}

STATISTICAL CONFIDENCE REQUIREMENTS:
- Always include confidence intervals and sample sizes
- Flag insufficient data clearly
- Provide statistical significance levels
- Compare against municipal benchmarks when possible

ACTIONABLE INTELLIGENCE MANDATE:
- Every insight must include specific, measurable recommendations
- Provide implementation timelines (immediate, short-term, long-term)
- Include success metrics and monitoring approaches
- Address both symptomatic and root cause solutions`;
  }

  /**
   * Build intelligent user prompt with rich data context
   */
  buildUserPrompt(query, queryAnalysis, intelligentContext) {
    const contextualData = this.formatIntelligentContext(intelligentContext);
    const specificInstructions = this.getQuerySpecificInstructions(queryAnalysis);
    
    return `CITIZEN ENGAGEMENT INTELLIGENCE REQUEST:
"${query}"

${contextualData}

${specificInstructions}

RESPONSE REQUIREMENTS:
Provide municipal leadership-ready intelligence that:
1. Leverages the specific data above (not generic examples)
2. Includes statistical confidence and reliability assessments
3. Identifies actionable intervention opportunities
4. Provides implementation roadmap with timelines
5. Suggests success metrics for tracking improvement
6. Addresses both immediate and strategic considerations

Format as professional municipal intelligence brief.`;
  }

  getMunicipalExpertiseContext() {
    return `You are a Senior Municipal Data Intelligence Analyst with expertise in:

DOMAIN SPECIALIZATION:
- Citizen satisfaction measurement and improvement strategies
- Municipal service delivery optimization
- Community engagement and civic participation analysis
- Geographic equity assessment and intervention planning
- Statistical analysis for municipal decision-making
- Brazilian municipal governance and citizen rights frameworks

ANALYTICAL FRAMEWORKS:
- Statistical significance testing and confidence interval analysis
- Comparative benchmarking against municipal best practices
- Root cause analysis for citizen service delivery issues
- Predictive modeling for citizen engagement optimization
- Cost-benefit analysis for municipal interventions
- Equity impact assessment methodologies

MUNICIPAL BEST PRACTICES KNOWLEDGE:
- Response rates above 60% indicate strong civic engagement
- Satisfaction scores below 3.0/5 require immediate systematic intervention
- Geographic service equity gaps above 25 points indicate structural inequities
- Multi-channel communication strategies increase engagement 15-30%
- Proactive issue resolution reduces dissatisfaction by 40-60%
- Community liaison programs improve satisfaction by 0.5-1.0 points`;
  }

  getRoleSpecialization(agentType) {
    const specializations = {
      knowledge: `ROLE: Municipal Intelligence Analyst
      
Your specialized focus areas:
- Statistical pattern recognition in citizen feedback data
- Satisfaction trend analysis and predictive modeling  
- Geographic service equity assessment and improvement strategies
- Issue priority ranking using severity-frequency matrices
- Community engagement effectiveness measurement
- Municipal service delivery performance benchmarking

ANALYTICAL APPROACH:
- Always ground insights in specific data points and statistical measures
- Identify both symptomatic issues and underlying systemic causes
- Provide comparative context (vs. benchmarks, historical trends, peer municipalities)
- Highlight intervention opportunities with highest impact-to-effort ratios
- Address equity considerations in all recommendations`,

      notification: `ROLE: Municipal Communications Strategist

Your specialized focus areas:
- Citizen segmentation and behavioral targeting strategies
- Communication channel optimization and timing analysis
- Message effectiveness measurement and improvement
- Community outreach campaign design and optimization
- Stakeholder engagement and participation facilitation
- Crisis communication and reputation management

STRATEGIC APPROACH:
- Base targeting strategies on actual engagement patterns and demographics
- Optimize for both reach and message relevance
- Include multi-channel approaches with channel-specific messaging
- Consider cultural sensitivity and accessibility requirements
- Provide measurable engagement objectives and success metrics
- Address both immediate communication needs and long-term relationship building`,

      ticket: `ROLE: Municipal Operations Intelligence Manager

Your specialized focus areas:
- System performance monitoring and optimization
- Data quality assessment and improvement recommendations
- Operational efficiency measurement and enhancement
- Resource allocation optimization based on citizen demand patterns
- Process automation opportunities identification
- Municipal technology infrastructure assessment

OPERATIONAL APPROACH:
- Focus on measurable performance improvements and cost efficiencies
- Identify automation opportunities that improve citizen experience
- Provide data-driven resource allocation recommendations
- Address both current operational issues and scalability planning
- Include staff training and change management considerations
- Balance operational efficiency with citizen service quality`
    };

    return specializations[agentType] || specializations.knowledge;
  }

  getStructuredOutputFormat(queryType) {
    const formats = {
      listing: `STRUCTURED OUTPUT FORMAT:
EXECUTIVE SUMMARY: [2-3 sentences with key numbers and trends]
DETAILED FINDINGS: [Specific list with data points, percentages, and context]
STATISTICAL CONFIDENCE: [Sample sizes, confidence intervals, reliability assessment]
ACTIONABLE NEXT STEPS: [Prioritized actions with timelines and expected outcomes]
SUCCESS METRICS: [How to measure improvement and track progress]`,

      insights: `STRUCTURED OUTPUT FORMAT:
EXECUTIVE SUMMARY: [Key insight with statistical significance and municipal impact]
PATTERN ANALYSIS: [3-5 major patterns with supporting data and confidence levels]
ROOT CAUSE ASSESSMENT: [Underlying factors driving observed patterns]
STRATEGIC IMPLICATIONS: [What these patterns mean for municipal governance]
INTERVENTION OPPORTUNITIES: [Specific actions with impact projections and timelines]
MONITORING FRAMEWORK: [Metrics and methods for tracking trend changes]`,

      analysis: `STRUCTURED OUTPUT FORMAT:
EXECUTIVE SUMMARY: [Comprehensive overview with key metrics and trends]
DETAILED ANALYSIS: [Multi-dimensional analysis with statistical validation]
COMPARATIVE CONTEXT: [Benchmarking against standards and best practices]
RISK ASSESSMENT: [Current and emerging risks with probability and impact]
STRATEGIC RECOMMENDATIONS: [Prioritized actions with implementation roadmap]
SUCCESS FRAMEWORK: [Metrics, timelines, and monitoring approaches]`,

      comparison: `STRUCTURED OUTPUT FORMAT:
EXECUTIVE SUMMARY: [Key differences and their municipal significance]
COMPARATIVE ANALYSIS: [Side-by-side analysis with statistical measures]
PERFORMANCE GAPS: [Specific areas where improvement is needed]
BEST PRACTICE IDENTIFICATION: [What can be learned from top performers]
INTERVENTION STRATEGY: [How to address gaps and replicate successes]
MEASUREMENT PLAN: [Metrics for tracking convergence and improvement]`,

      action: `STRUCTURED OUTPUT FORMAT:
EXECUTIVE SUMMARY: [Recommended action with expected impact and urgency]
TARGET ANALYSIS: [Who should be contacted/engaged and why]
IMPLEMENTATION STRATEGY: [Step-by-step approach with timelines and resources]
RISK MITIGATION: [Potential challenges and how to address them]
SUCCESS METRICS: [How to measure action effectiveness and citizen response]
FOLLOW-UP FRAMEWORK: [Next steps and continuous improvement approach]`
    };

    return formats[queryType] || formats.analysis;
  }

  formatIntelligentContext(intelligentContext) {
    if (!intelligentContext) return "No contextual data available.";

    const { executiveSummary, statisticalProfile, trendAnalysis, keyInsights, benchmarkComparison } = intelligentContext;

    let contextString = `MUNICIPAL DATA INTELLIGENCE CONTEXT:

EXECUTIVE OVERVIEW:
${executiveSummary}

STATISTICAL PROFILE:
• Population: ${statisticalProfile.population.total} total citizens
• Response Rate: ${statisticalProfile.population.responseRate}% (reliability: ${statisticalProfile.satisfaction.reliability})
• Engagement Performance: ${statisticalProfile.population.engagementRate}% (vs ${benchmarkComparison.engagement.benchmark}% benchmark)
• Satisfaction Score: ${statisticalProfile.satisfaction.averageScore}/5 (confidence: ±${statisticalProfile.satisfaction.confidenceInterval.marginOfError})

PERFORMANCE BENCHMARKING:
• Satisfaction: ${benchmarkComparison.satisfaction.current}/5 vs ${benchmarkComparison.satisfaction.benchmark}/5 benchmark (${benchmarkComparison.satisfaction.performance})
• Response Rate: ${benchmarkComparison.responseRate.current}% vs ${benchmarkComparison.responseRate.benchmark}% benchmark (${benchmarkComparison.responseRate.performance})
• Engagement: ${benchmarkComparison.engagement.current}% vs ${benchmarkComparison.engagement.benchmark}% benchmark (${benchmarkComparison.engagement.performance})

GEOGRAPHIC EQUITY ANALYSIS:
• Total Neighborhoods: ${statisticalProfile.geographic.totalNeighborhoods}
• Performance Gap: ${statisticalProfile.geographic.equityGap} points (${trendAnalysis.geographic.riskLevel} risk level)
• Top Performers: ${statisticalProfile.geographic.topPerformers.map(([name, data]) => `${name} (${data.performanceScore}%)`).join(', ')}
• Need Attention: ${statisticalProfile.geographic.needsAttention.map(([name, data]) => `${name} (${data.performanceScore}%)`).join(', ')}

CRITICAL INSIGHTS:
${keyInsights.filter(insight => insight.urgency === 'immediate' || insight.urgency === 'high').map(insight => 
  `• ${insight.insight} (${insight.urgency} priority)`
).join('\n')}

ISSUE PRIORITY MATRIX:
${statisticalProfile.issues.breakdown.slice(0, 3).map(issue => 
  `• ${issue.issue}: ${issue.count} reports, severity ${issue.avgSeverity}/5, priority score ${issue.priorityScore}`
).join('\n')}`;

    return contextString;
  }

  getQuerySpecificInstructions(queryAnalysis) {
    const instructions = {
      listing: `SPECIFIC ANALYSIS REQUIREMENTS:
- Provide actual names and specific data points from the municipal database
- Include response status, satisfaction levels, and engagement metrics for each item
- Group/categorize items by relevant criteria (neighborhood, satisfaction level, response status)
- Highlight items requiring immediate attention or follow-up
- Suggest specific outreach strategies for each category`,

      insights: `SPECIFIC ANALYSIS REQUIREMENTS:
- Identify non-obvious patterns and correlations in the data
- Explain the municipal governance implications of each pattern
- Connect insights to actionable policy or operational improvements
- Assess the statistical reliability and significance of each insight
- Provide comparative context with municipal best practices`,

      analysis: `SPECIFIC ANALYSIS REQUIREMENTS:
- Perform multi-dimensional analysis connecting satisfaction, engagement, and geographic data
- Include trend analysis and predictive elements where statistically valid
- Identify both immediate intervention opportunities and strategic improvement areas
- Assess resource requirements and implementation feasibility for recommendations
- Provide comprehensive success measurement framework`,

      comparison: `SPECIFIC ANALYSIS REQUIREMENTS:
- Highlight statistically significant differences with confidence intervals
- Explain the practical significance of identified differences for municipal operations
- Identify best practices from high-performing segments that can be replicated
- Assess the root causes underlying performance differences
- Provide specific strategies for closing performance gaps`,

      action: `SPECIFIC ANALYSIS REQUIREMENTS:
- Identify specific target groups with contact information and rationale
- Design message strategy with channel selection and timing optimization
- Include engagement prediction and expected response rates
- Provide implementation timeline with resource requirements
- Design measurement framework for tracking action effectiveness`
    };

    return instructions[queryAnalysis.queryType] || instructions.analysis;
  }

  /**
   * Build follow-up prompts for multi-turn reasoning
   */
  buildFollowUpPrompt(originalQuery, initialResponse, specificFocus) {
    return `FOLLOW-UP INTELLIGENCE REQUEST:

Original Query: "${originalQuery}"
Initial Analysis Completed: ${new Date().toISOString()}

DEEP DIVE FOCUS: ${specificFocus}

Based on the initial analysis, provide additional intelligence on:

1. ROOT CAUSE ANALYSIS: What underlying factors are driving the patterns identified?
2. IMPLEMENTATION DETAILS: Specific steps, timelines, and resource requirements for top recommendations
3. RISK ASSESSMENT: What could go wrong with proposed interventions and how to mitigate risks?
4. SUCCESS PREDICTION: Statistical projections for improvement under different scenarios
5. SYSTEM INTEGRATION: How do recommended changes interact with existing municipal processes?

Provide deeper intelligence that builds on initial findings with enhanced analytical depth.`;
  }

  /**
   * Validate LLM response quality
   */
  validateResponseQuality(response, intelligentContext) {
    const quality = {
      score: 0,
      issues: [],
      strengths: []
    };

    // Check for data grounding
    if (this.containsSpecificNumbers(response, intelligentContext)) {
      quality.score += 25;
      quality.strengths.push('Contains specific data points');
    } else {
      quality.issues.push('Missing specific data references');
    }

    // Check for actionable recommendations
    if (this.containsActionableRecommendations(response)) {
      quality.score += 25;
      quality.strengths.push('Includes actionable recommendations');
    } else {
      quality.issues.push('Lacks specific actionable recommendations');
    }

    // Check for statistical confidence
    if (this.containsStatisticalContext(response)) {
      quality.score += 20;
      quality.strengths.push('Includes statistical context');
    } else {
      quality.issues.push('Missing statistical confidence information');
    }

    // Check for structured format
    if (this.followsStructuredFormat(response)) {
      quality.score += 20;
      quality.strengths.push('Follows structured format');
    } else {
      quality.issues.push('Does not follow requested structure');
    }

    // Check for municipal expertise
    if (this.demonstratesMunicipalExpertise(response)) {
      quality.score += 10;
      quality.strengths.push('Demonstrates municipal domain knowledge');
    } else {
      quality.issues.push('Generic response lacking municipal expertise');
    }

    quality.level = quality.score >= 80 ? 'excellent' : 
                   quality.score >= 60 ? 'good' : 
                   quality.score >= 40 ? 'fair' : 'poor';

    return quality;
  }

  containsSpecificNumbers(response, context) {
    if (!context || !context.statisticalProfile) return false;
    
    const keyNumbers = [
      context.statisticalProfile.population.total,
      context.statisticalProfile.population.responseRate,
      context.statisticalProfile.satisfaction.averageScore
    ];

    return keyNumbers.some(num => response.includes(String(num)));
  }

  containsActionableRecommendations(response) {
    const actionWords = ['implement', 'establish', 'contact', 'develop', 'create', 'schedule', 'organize'];
    const timeWords = ['immediate', 'within', 'days', 'weeks', 'months', 'timeline'];
    
    return actionWords.some(word => response.toLowerCase().includes(word)) &&
           timeWords.some(word => response.toLowerCase().includes(word));
  }

  containsStatisticalContext(response) {
    const statWords = ['confidence', 'significance', 'sample', 'reliability', 'margin', '%', 'interval'];
    return statWords.some(word => response.toLowerCase().includes(word));
  }

  followsStructuredFormat(response) {
    const structureWords = ['summary', 'analysis', 'recommendations', 'metrics', 'findings'];
    return structureWords.filter(word => response.toLowerCase().includes(word)).length >= 3;
  }

  demonstratesMunicipalExpertise(response) {
    const municipalTerms = ['municipal', 'citizen', 'civic', 'community', 'service delivery', 'governance'];
    return municipalTerms.filter(term => response.toLowerCase().includes(term)).length >= 2;
  }
}

module.exports = MunicipalPromptEngine;
// services/MunicipalAnalysisEngine.js - Domain-specific municipal analysis without data access
const DataAccessLayer = require('./DataAccessLayer');

class MunicipalAnalysisEngine {
  constructor() {
    this.dataAccess = new DataAccessLayer();
    this.name = 'Municipal Analysis Engine';
  }

  // ==================== SATISFACTION ANALYSIS ====================
  
  async analyzeSatisfaction(filters = {}) {
    const rawData = this.dataAccess.getSatisfactionRawData();
    
    if (rawData.total === 0) {
      return {
        total: 0,
        averageScore: 0,
        maxScore: 5,
        breakdown: [],
        insights: ['No survey responses available for analysis'],
        recommendations: ['Increase survey participation to gather satisfaction data'],
        analysisQuality: 'insufficient_data'
      };
    }

    // Calculate weighted score
    const weights = {
      'Muito satisfeito': 5,
      'Satisfeito': 4,
      'Neutro': 3,
      'Insatisfeito': 2,
      'Muito insatisfeito': 1
    };

    let totalScore = 0;
    let totalResponses = 0;

    Object.entries(rawData.breakdown).forEach(([level, count]) => {
      const weight = weights[level] || 3;
      totalScore += weight * count;
      totalResponses += count;
    });

    const averageScore = totalResponses > 0 ? (totalScore / totalResponses).toFixed(2) : 0;

    // Create breakdown with percentages
    const breakdown = Object.entries(rawData.breakdown).map(([level, count]) => ({
      level,
      count,
      percentage: ((count / rawData.total) * 100).toFixed(1)
    }));

    // Generate insights
    const analysis = this.generateSatisfactionInsights(rawData, averageScore, breakdown);

    return {
      total: rawData.total,
      averageScore,
      maxScore: 5,
      breakdown,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      analysisQuality: analysis.quality,
      dissatisfiedCount: this.calculateDissatisfiedCount(breakdown),
      satisfactionTrend: this.assessSatisfactionTrend(averageScore)
    };
  }

  generateSatisfactionInsights(rawData, averageScore, breakdown) {
    const insights = [];
    const recommendations = [];
    let quality = 'good';

    const avgScore = parseFloat(averageScore);
    const dissatisfiedPercent = this.calculateDissatisfiedPercent(breakdown);
    
    // Sample size assessment
    if (rawData.total < 30) {
      quality = 'limited';
      insights.push(`Small sample size (${rawData.total} responses) - results should be interpreted cautiously`);
      recommendations.push('Increase survey participation to improve statistical reliability');
    } else if (rawData.total >= 100) {
      quality = 'excellent';
      insights.push(`Strong sample size (${rawData.total} responses) provides reliable insights`);
    }

    // Satisfaction level analysis
    if (dissatisfiedPercent > 40) {
      insights.push(`Critical concern: ${dissatisfiedPercent}% of residents express dissatisfaction`);
      insights.push('High dissatisfaction levels indicate systemic service delivery issues');
      recommendations.push('Priority action needed: address top issues identified in survey responses');
      recommendations.push('Consider emergency response plan for community concerns');
      recommendations.push('Schedule immediate community meetings with affected residents');
    } else if (avgScore < 3.0) {
      insights.push(`Below-neutral satisfaction: Average score ${avgScore}/5 indicates room for improvement`);
      insights.push('Moderate concern requiring strategic intervention');
      recommendations.push('Analyze specific issues driving neutral/negative responses');
      recommendations.push('Implement targeted satisfaction improvement initiatives');
    } else if (avgScore >= 4.0) {
      insights.push(`Good satisfaction levels: ${avgScore}/5 average indicates positive citizen sentiment`);
      insights.push('Strong foundation for community engagement and municipal initiatives');
      recommendations.push('Maintain current service levels and identify best practices to replicate');
    } else {
      insights.push(`Moderate satisfaction: ${avgScore}/5 suggests balanced but improvable citizen perception`);
      recommendations.push('Focus on converting neutral responses to positive satisfaction');
    }

    // Distribution analysis
    const neutralCount = breakdown.find(b => b.level === 'Neutro')?.count || 0;
    if (neutralCount > rawData.total * 0.3) {
      insights.push(`High neutral responses (${neutralCount}) suggest indifferent or undecided residents`);
      recommendations.push('Engage neutral respondents to understand their specific needs');
    }

    return { insights, recommendations, quality };
  }

  // ==================== NEIGHBORHOOD ANALYSIS ====================
  
  async analyzeNeighborhoods() {
    const rawData = this.dataAccess.getNeighborhoodRawData();
    
    // Calculate rates for each neighborhood
    const neighborhoods = Object.entries(rawData).map(([name, stats]) => ({
      neighborhood: name,
      total: stats.total,
      sent: stats.sent,
      clicked: stats.clicked,
      answered: stats.answered,
      responseRate: stats.total > 0 ? ((stats.answered / stats.total) * 100).toFixed(1) : '0',
      engagementRate: stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.total - a.total);

    const analysis = this.generateNeighborhoodInsights(neighborhoods);

    return {
      neighborhoods,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      equityAssessment: analysis.equityAssessment,
      totalNeighborhoods: neighborhoods.length,
      bestPerforming: neighborhoods.find(n => parseFloat(n.responseRate) === Math.max(...neighborhoods.map(n => parseFloat(n.responseRate)))),
      needsAttention: neighborhoods.filter(n => parseFloat(n.responseRate) < 60)
    };
  }

  generateNeighborhoodInsights(neighborhoods) {
    const insights = [];
    const recommendations = [];
    let equityAssessment = 'good';

    if (neighborhoods.length === 0) {
      return {
        insights: ['No neighborhood data available'],
        recommendations: ['Ensure neighborhood information is collected during registration'],
        equityAssessment: 'unknown'
      };
    }

    const responseRates = neighborhoods.map(n => parseFloat(n.responseRate));
    const avgResponseRate = (responseRates.reduce((a, b) => a + b, 0) / responseRates.length).toFixed(1);
    const lowPerforming = neighborhoods.filter(n => parseFloat(n.responseRate) < 60);
    const highPerforming = neighborhoods.filter(n => parseFloat(n.responseRate) >= 80);

    // Overall performance
    insights.push(`Geographic analysis covers ${neighborhoods.length} neighborhoods with ${avgResponseRate}% average response rate`);
    
    // Best performing
    if (highPerforming.length > 0) {
      const best = highPerforming[0];
      insights.push(`Highest engagement: ${best.neighborhood} (${best.total} contacts, ${best.responseRate}% response rate)`);
      recommendations.push(`Study successful engagement strategies from: ${highPerforming.map(n => n.neighborhood).join(', ')}`);
    }

    // Equity analysis
    if (lowPerforming.length > 0) {
      const avgLowRate = (lowPerforming.reduce((sum, n) => sum + parseFloat(n.responseRate), 0) / lowPerforming.length).toFixed(1);
      
      insights.push(`Areas needing attention: ${lowPerforming.map(n => `${n.neighborhood} (${n.responseRate}%)`).join(', ')}`);
      insights.push(`Disparidade geográfica: ${lowPerforming.length} bairros com engajamento abaixo de 60%`);
      
      if (avgLowRate < 30) {
        equityAssessment = 'critical';
        insights.push('Critical equity gap: some neighborhoods virtually disconnected from municipal services');
        recommendations.push('Urgent intervention needed: consider physical presence and local community leaders');
        recommendations.push('Investigate structural barriers (language, technology, trust)');
      } else {
        equityAssessment = 'needs_attention';
        recommendations.push(`Targeted outreach strategy for ${lowPerforming.length} low-engagement neighborhoods`);
      }
    } else {
      equityAssessment = 'excellent';
      insights.push('Excellent equity: all neighborhoods show strong engagement levels');
    }

    // Participation distribution
    const totalParticipation = neighborhoods.reduce((sum, n) => sum + n.total, 0);
    const largestNeighborhood = neighborhoods[0];
    const participationConcentration = (largestNeighborhood.total / totalParticipation * 100).toFixed(1);
    
    if (participationConcentration > 40) {
      insights.push(`High concentration: ${participationConcentration}% of participation from ${largestNeighborhood.neighborhood}`);
      recommendations.push('Balance outreach to ensure representative geographic coverage');
    }

    return { insights, recommendations, equityAssessment };
  }

  // ==================== ISSUES ANALYSIS ====================
  
  async analyzeIssues() {
    const rawData = this.dataAccess.getIssuesRawData();
    
    if (rawData.total === 0) {
      return {
        total: 0,
        breakdown: [],
        insights: ['No issue data available for analysis'],
        recommendations: ['Increase survey participation to identify community concerns']
      };
    }

    // Sort by count and calculate percentages
    const breakdown = Object.entries(rawData.breakdown)
      .sort(([,a], [,b]) => b - a)
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: ((count / rawData.total) * 100).toFixed(1)
      }));

    const analysis = this.generateIssuesInsights(rawData, breakdown);

    return {
      total: rawData.total,
      breakdown,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      priorityIssues: breakdown.slice(0, 3),
      diversityIndex: this.calculateIssueDiversity(breakdown)
    };
  }

  generateIssuesInsights(rawData, breakdown) {
    const insights = [];
    const recommendations = [];

    if (breakdown.length === 0) {
      return { insights: ['No issues reported'], recommendations: [] };
    }

    const topIssue = breakdown[0];
    const topThreePercentage = breakdown.slice(0, 3).reduce((sum, issue) => sum + parseFloat(issue.percentage), 0);

    insights.push(`Top community concern: ${topIssue.issue} (${topIssue.percentage}% of ${rawData.total} responses)`);
    insights.push(`Top 3 issues represent ${topThreePercentage.toFixed(1)}% of all concerns`);

    // Issue concentration analysis
    if (parseFloat(topIssue.percentage) > 50) {
      insights.push('Single dominant issue indicates clear municipal priority');
      recommendations.push(`Focus immediate resources on addressing: ${topIssue.issue}`);
    } else if (topThreePercentage > 70) {
      insights.push('Concentrated concerns in few key areas - manageable scope for intervention');
      recommendations.push('Develop integrated approach addressing top 3 issues simultaneously');
    } else {
      insights.push('Diverse range of concerns requires broad municipal response strategy');
      recommendations.push('Consider comprehensive municipal improvement plan addressing multiple priorities');
    }

    // Specific issue recommendations
    breakdown.slice(0, 3).forEach(issue => {
      const specificRec = this.getIssueSpecificRecommendation(issue.issue);
      if (specificRec) recommendations.push(specificRec);
    });

    return { insights, recommendations };
  }

  // ==================== ENGAGEMENT ANALYSIS ====================
  
  async analyzeEngagement() {
    const rawData = this.dataAccess.getEngagementRawData();
    
    const rates = {
      response: rawData.total > 0 ? ((rawData.answered / rawData.total) * 100).toFixed(1) : '0',
      engagement: rawData.sent > 0 ? ((rawData.clicked / rawData.sent) * 100).toFixed(1) : '0',
      completion: rawData.clicked > 0 ? ((rawData.answered / rawData.clicked) * 100).toFixed(1) : '0'
    };

    const analysis = this.generateEngagementInsights(rawData, rates);

    return {
      total: rawData.total,
      sent: rawData.sent,
      clicked: rawData.clicked,
      answered: rawData.answered,
      rates,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      performanceLevel: analysis.performanceLevel,
      engagementFunnel: this.analyzeEngagementFunnel(rawData)
    };
  }

  generateEngagementInsights(rawData, rates) {
    const insights = [];
    const recommendations = [];
    let performanceLevel = 'fair';

    const responseRate = parseFloat(rates.response);
    const engagementRate = parseFloat(rates.engagement);
    const completionRate = parseFloat(rates.completion);

    // Overall performance assessment
    if (responseRate >= 70) {
      performanceLevel = 'excellent';
      insights.push(`Excellent response rate (${responseRate}%) indicates highly effective communication strategy`);
    } else if (responseRate >= 50) {
      performanceLevel = 'good';
      insights.push(`Good response rate (${responseRate}%) shows solid community engagement`);
    } else if (responseRate >= 30) {
      performanceLevel = 'fair';
      insights.push(`Moderate response rate (${responseRate}%) suggests room for improvement`);
      recommendations.push('Enhance outreach strategies to improve response rates');
    } else {
      performanceLevel = 'poor';
      insights.push(`Low response rate (${responseRate}%) indicates significant engagement challenges`);
      recommendations.push('Comprehensive review of communication approach needed');
    }

    // Engagement funnel analysis
    insights.push(`Engagement metrics: ${rawData.answered}/${rawData.total} responses (${responseRate}% response rate)`);
    insights.push(`Communication effectiveness: ${engagementRate}% click-through rate`);

    if (engagementRate < 60) {
      recommendations.push('Improve message content and timing to increase click-through rates');
    } else if (engagementRate >= 80) {
      insights.push('Excellent click-through rates demonstrate compelling messaging');
    }

    if (completionRate < 70 && rawData.clicked > 0) {
      insights.push(`Survey abandonment concern: only ${completionRate}% complete after clicking`);
      recommendations.push('Review survey design for usability and length optimization');
    }

    return { insights, recommendations, performanceLevel };
  }

  // ==================== PARTICIPATION ANALYSIS ====================
  
  async analyzeParticipation() {
    const rawData = this.dataAccess.getParticipationRawData();
    
    if (rawData.total === 0) {
      return {
        total: 0,
        interested: 0,
        notInterested: 0,
        rate: '0',
        insights: ['No participation data available'],
        recommendations: ['Include participation questions in future surveys']
      };
    }

    const interested = rawData.breakdown['Sim'] || 0;
    const notInterested = rawData.breakdown['Não'] || 0;
    const rate = ((interested / rawData.total) * 100).toFixed(1);

    const analysis = this.generateParticipationInsights(rawData, interested, rate);

    return {
      total: rawData.total,
      interested,
      notInterested,
      rate,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      engagementPotential: analysis.engagementPotential
    };
  }

  generateParticipationInsights(rawData, interested, rate) {
    const insights = [];
    const recommendations = [];
    let engagementPotential = 'medium';

    const participationRate = parseFloat(rate);

    if (participationRate >= 70) {
      engagementPotential = 'high';
      insights.push(`Exceptional: ${participationRate}% of residents demonstrate active civic interest`);
      insights.push('High civic engagement represents valuable social capital for municipal initiatives');
      recommendations.push('Capitalize on strong interest with regular, structured community events');
      recommendations.push('Consider forming citizen advisory committees with engaged residents');
    } else if (participationRate >= 40) {
      engagementPotential = 'medium';
      insights.push(`Good potential: ${participationRate}% show interest in community participation`);
      insights.push('Solid foundation for building stronger community engagement');
      recommendations.push(`Organize pilot community events with the ${interested} interested residents`);
      recommendations.push('Use feedback from initial events to refine and expand programming');
    } else {
      engagementPotential = 'low';
      insights.push(`Limited engagement: only ${participationRate}% express participation interest`);
      insights.push('Low interest may indicate barriers, skepticism, or communication gaps');
      recommendations.push('Research participation barriers: timing, location, format preferences');
      recommendations.push('Start with small, informal community gatherings to build trust');
      recommendations.push('Consider incentives or more accessible event formats');
    }

    if (interested > 0) {
      insights.push(`Community engagement: ${interested} residents interested in participation from ${rawData.total} responses`);
      recommendations.push(`Maintain database of ${interested} engaged residents for targeted event invitations`);
    }

    return { insights, recommendations, engagementPotential };
  }

  // ==================== NOTIFICATION TARGETING ====================
  
  async getDissatisfiedResidents() {
    const dissatisfiedContacts = this.dataAccess.getDissatisfiedContactsRaw();
    
    if (dissatisfiedContacts.length === 0) {
      return {
        total: 0,
        residents: [],
        insights: ['No dissatisfied residents identified in current data'],
        recommendations: ['Monitor satisfaction levels in future surveys'],
        urgencyLevel: 'low'
      };
    }

    // Analyze dissatisfaction levels and create priority scoring
    const residents = dissatisfiedContacts.map(contact => ({
      name: contact.name,
      whatsapp: contact.whatsapp,
      neighborhood: contact.neighborhood,
      satisfaction: contact.survey.satisfaction,
      mainIssue: contact.survey.issue,
      priority: contact.survey.satisfaction === 'Muito insatisfeito' ? 'HIGH' : 'MEDIUM',
      participationInterest: contact.survey.participate === 'Sim'
    }));

    const analysis = this.analyzeDissatisfactionPatterns(residents);

    return {
      total: dissatisfiedContacts.length,
      residents,
      breakdown: this.getDissatisfactionBreakdown(residents),
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      urgencyLevel: analysis.urgencyLevel
    };
  }

  async getParticipationWilling() {
    const interestedContacts = this.dataAccess.getParticipationInterestedRaw();
    
    if (interestedContacts.length === 0) {
      return {
        total: 0,
        residents: [],
        insights: ['No residents have expressed participation interest'],
        recommendations: ['Include participation questions in future outreach']
      };
    }

    const residents = interestedContacts.map(contact => ({
      name: contact.name,
      whatsapp: contact.whatsapp,
      neighborhood: contact.neighborhood,
      satisfaction: contact.survey.satisfaction,
      mainIssue: contact.survey.issue
    }));

    const totalSurveyResponses = this.dataAccess.getSurveyResponses().length;
    const percentage = ((interestedContacts.length / totalSurveyResponses) * 100).toFixed(1);

    return {
      total: interestedContacts.length,
      residents,
      percentage,
      insights: this.generateParticipationTargetingInsights(residents, percentage),
      recommendations: this.generateParticipationTargetingRecommendations(residents)
    };
  }

  async getParticipationNotWilling() {
    const notInterestedContacts = this.dataAccess.getParticipationNotInterestedRaw();
    
    if (notInterestedContacts.length === 0) {
      return {
        total: 0,
        residents: [],
        insights: ['All surveyed residents are either interested or undecided about participation'],
        recommendations: ['Continue fostering engagement; monitor sentiments over time']
      };
    }

    const residents = notInterestedContacts.map(contact => ({
      name: contact.name,
      whatsapp: contact.whatsapp,
      neighborhood: contact.neighborhood,
      satisfaction: contact.survey.satisfaction,
      mainIssue: contact.survey.issue
    }));

    const totalSurveyResponses = this.dataAccess.getSurveyResponses().length;
    const percentage = ((notInterestedContacts.length / totalSurveyResponses) * 100).toFixed(1);

    // Reuse insights generation with cautionary framing
    const insights = [
      `Participation hesitation: ${percentage}% of respondents indicated no interest now`,
      'Potential barriers: time availability, relevance, trust, or communication'
    ];

    const recommendations = [
      'Offer low-commitment, flexible participation formats',
      'Clarify value proposition and expected time investment',
      'Engage via neighborhood channels to build trust',
      'Re-invite after addressing top reported issues'
    ];

    return {
      total: notInterestedContacts.length,
      residents,
      percentage,
      insights,
      recommendations
    };
  }

      async getNonRespondents() {
    const rawData = this.dataAccess.getNonRespondentsRaw();
    
    const clickedButNotResponded = rawData.clickedButNotResponded;
    const contacted = rawData.contacted;
    const notContacted = rawData.notContacted;
    
    const total = clickedButNotResponded.length + contacted.length + notContacted.length;
    
    if (total === 0) {
      return {
        total: 0,
        residents: [],
        insights: ['All contacts have been processed successfully'],
        recommendations: ['Continue current engagement strategies']
      };
    }

    const residents = [
      ...clickedButNotResponded.map(c => ({ ...c, status: 'Clicked but not responded' })),
      ...contacted.map(c => ({ ...c, status: 'Contacted but no click' })),
      ...notContacted.map(c => ({ ...c, status: 'Not contacted' }))
    ];

    return {
      total,
      residents,
      clickedButNotResponded: clickedButNotResponded.length,
      contacted: contacted.length,
      notContacted: notContacted.length,
      insights: this.generateNonRespondentInsights(rawData),
      recommendations: this.generateFollowUpRecommendations(rawData)
    };
  }

  // ==================== SYSTEM HEALTH ANALYSIS ====================
  
  async analyzeSystemHealth() {
    const rawData = this.dataAccess.getSystemHealthRawData();
    
    const health = this.assessOverallHealth(rawData);
    const analysis = this.generateSystemHealthInsights(rawData, health);

    return {
      totalContacts: rawData.totalContacts,
      duplicates: rawData.duplicateIssues.length,
      incompleteProfiles: rawData.incompleteProfiles.length,
      oldPending: rawData.oldPendingContacts.length,
      health: health.level,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      actionPriority: health.priority,
      issues: rawData.allIssues
    };
  }

  // ==================== HELPER METHODS ====================
  
  calculateDissatisfiedPercent(breakdown) {
    const dissatisfiedLevels = ['Muito insatisfeito', 'Insatisfeito'];
    const dissatisfiedCount = breakdown
      .filter(b => dissatisfiedLevels.includes(b.level))
      .reduce((sum, b) => sum + parseInt(b.count), 0);
    
    const total = breakdown.reduce((sum, b) => sum + parseInt(b.count), 0);
    return total > 0 ? Math.round((dissatisfiedCount / total) * 100) : 0;
  }

  calculateDissatisfiedCount(breakdown) {
    return breakdown
      .filter(b => ['Muito insatisfeito', 'Insatisfeito'].includes(b.level))
      .reduce((sum, b) => sum + parseInt(b.count), 0);
  }

  assessSatisfactionTrend(averageScore) {
    const score = parseFloat(averageScore);
    if (score >= 4.0) return 'positive';
    if (score >= 3.0) return 'neutral';
    return 'concerning';
  }

  calculateIssueDiversity(breakdown) {
    // Shannon diversity index for issue distribution
    const total = breakdown.reduce((sum, issue) => sum + issue.count, 0);
    if (total === 0) return 0;
    
    const diversity = breakdown.reduce((sum, issue) => {
      const proportion = issue.count / total;
      return sum - (proportion * Math.log2(proportion));
    }, 0);
    
    return diversity.toFixed(2);
  }

  analyzeEngagementFunnel(rawData) {
    return {
      registered: rawData.total,
      contacted: rawData.sent,
      engaged: rawData.clicked,
      responded: rawData.answered,
      conversionRates: {
        contactToEngage: rawData.sent > 0 ? ((rawData.clicked / rawData.sent) * 100).toFixed(1) : '0',
        engageToRespond: rawData.clicked > 0 ? ((rawData.answered / rawData.clicked) * 100).toFixed(1) : '0'
      }
    };
  }

  getDissatisfactionBreakdown(residents) {
    const breakdown = {};
    residents.forEach(r => {
      breakdown[r.satisfaction] = (breakdown[r.satisfaction] || 0) + 1;
    });
    return breakdown;
  }

  analyzeDissatisfactionPatterns(residents) {
    const insights = [];
    const recommendations = [];
    let urgencyLevel = 'medium';

    const highPriority = residents.filter(r => r.priority === 'HIGH').length;
    const totalDissatisfied = residents.length;

    if (highPriority > totalDissatisfied * 0.6) {
      urgencyLevel = 'high';
      insights.push(`Critical situation: ${highPriority} residents express severe dissatisfaction`);
      insights.push('High concentration of "muito insatisfeito" responses indicates systemic issues');
      recommendations.push(`Immediate action required: direct contact with ${highPriority} high-priority cases`);
      recommendations.push('Consider emergency municipal response plan');
    } else if (highPriority > 0) {
      insights.push(`Priority concern: ${highPriority} cases require immediate attention`);
      insights.push(`Additional ${totalDissatisfied - highPriority} cases need scheduled follow-up`);
      recommendations.push(`Escalated response for ${highPriority} most critical cases`);
    }

    // Issue pattern analysis
    const issueFrequency = {};
    residents.forEach(resident => {
      const issue = resident.mainIssue;
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    });

    if (Object.keys(issueFrequency).length > 0) {
      const topIssue = Object.keys(issueFrequency).reduce((a, b) => 
        issueFrequency[a] > issueFrequency[b] ? a : b
      );
      insights.push(`Primary concern among dissatisfied residents: ${topIssue} (${issueFrequency[topIssue]} cases)`);
      recommendations.push(`Address systemic issue: ${topIssue} affects multiple dissatisfied residents`);
    }

    return { insights, recommendations, urgencyLevel };
  }

  generateParticipationTargetingInsights(residents, percentage) {
    const insights = [];
    const rate = parseFloat(percentage);

    if (rate >= 60) {
      insights.push(`Strong civic engagement: ${rate}% participation interest indicates active community`);
      insights.push('High engagement represents valuable social capital for municipal initiatives');
    } else if (rate >= 30) {
      insights.push(`Moderate engagement: ${rate}% participation rate provides solid foundation`);
      insights.push('Good potential for community building with proper cultivation');
    } else {
      insights.push(`Limited engagement: ${rate}% participation suggests barriers or communication gaps`);
      insights.push('Low interest may indicate need for different engagement approaches');
    }

    // Neighborhood distribution
    const neighborhoods = {};
    residents.forEach(r => {
      neighborhoods[r.neighborhood] = (neighborhoods[r.neighborhood] || 0) + 1;
    });

    if (Object.keys(neighborhoods).length > 1) {
      const topNeighborhood = Object.keys(neighborhoods).reduce((a, b) => 
        neighborhoods[a] > neighborhoods[b] ? a : b
      );
      insights.push(`Geographic concentration: ${topNeighborhood} leads with ${neighborhoods[topNeighborhood]} interested residents`);
    }

    return insights;
  }

  generateParticipationTargetingRecommendations(residents) {
    const recommendations = [];
    
    if (residents.length > 20) {
      recommendations.push(`Strong base: ${residents.length} interested residents can anchor regular community events`);
      recommendations.push('Consider forming citizen advisory committee with most engaged residents');
    } else if (residents.length > 5) {
      recommendations.push(`Start with pilot events targeting ${residents.length} interested residents`);
      recommendations.push('Use feedback to refine approach before broader community outreach');
    } else {
      recommendations.push('Small but valuable group - focus on individual engagement and relationship building');
    }

    recommendations.push('Maintain dedicated contact list for community event invitations');
    recommendations.push('Survey this group for preferred event types, timing, and locations');

    return recommendations;
  }

  generateNonRespondentInsights(rawData) {
    const insights = [];
    const total = rawData.clickedButNotResponded.length + rawData.contacted.length + rawData.notContacted.length;

    if (rawData.clickedButNotResponded.length > 0) {
      const abandonmentRate = (rawData.clickedButNotResponded.length / total * 100).toFixed(1);
      insights.push(`Survey abandonment: ${rawData.clickedButNotResponded.length} residents clicked but didn't complete (${abandonmentRate}%)`);
      if (rawData.clickedButNotResponded.length > total * 0.3) {
        insights.push('High abandonment rate suggests usability or survey length issues');
      }
    }

    if (rawData.contacted.length > 0) {
      insights.push(`Low initial engagement: ${rawData.contacted.length} contacted residents haven't clicked survey link`);
    }

    if (rawData.notContacted.length > 0) {
      insights.push(`Outreach opportunity: ${rawData.notContacted.length} residents haven't been contacted yet`);
    }

    return insights;
  }

  generateFollowUpRecommendations(rawData) {
    const recommendations = [];

    if (rawData.clickedButNotResponded.length > 0) {
      recommendations.push(`Priority follow-up: ${rawData.clickedButNotResponded.length} residents who showed initial interest`);
      recommendations.push('Consider phone outreach for residents who clicked but didn\'t complete');
      if (rawData.clickedButNotResponded.length > 10) {
        recommendations.push('Review survey design for potential usability improvements');
      }
    }

    if (rawData.contacted.length > 0) {
      recommendations.push(`Re-engagement strategy: ${rawData.contacted.length} residents need different communication approach`);
      recommendations.push('Try alternative messaging or timing for non-clickers');
    }

    if (rawData.notContacted.length > 0) {
      recommendations.push(`Expand outreach: ${rawData.notContacted.length} residents await initial contact`);
      recommendations.push('Systematic contact plan for remaining residents');
    }

    return recommendations;
  }

  assessOverallHealth(rawData) {
    const totalIssues = rawData.duplicateIssues.length + rawData.incompleteProfiles.length;
    const issueRate = totalIssues / rawData.totalContacts;

    if (issueRate < 0.05) {
      return { level: 'excellent', priority: 'low' };
    } else if (issueRate < 0.15) {
      return { level: 'good', priority: 'medium' };
    } else {
      return { level: 'needs_attention', priority: 'high' };
    }
  }

  generateSystemHealthInsights(rawData, health) {
    const insights = [];
    const recommendations = [];

    insights.push(`System health assessment: ${health.level} condition with ${rawData.totalContacts} total contacts`);

    if (rawData.duplicateIssues.length > 0) {
      const duplicateRate = (rawData.duplicateIssues.length / rawData.totalContacts * 100).toFixed(1);
      insights.push(`Data quality issue: ${rawData.duplicateIssues.length} duplicate contacts (${duplicateRate}%)`);
      recommendations.push('Implement duplicate detection and cleanup procedures');
    }

    if (rawData.incompleteProfiles.length > 0) {
      const incompleteRate = (rawData.incompleteProfiles.length / rawData.totalContacts * 100).toFixed(1);
      insights.push(`Profile completeness: ${rawData.incompleteProfiles.length} incomplete profiles (${incompleteRate}%)`);
      recommendations.push('Contact cleanup campaign to complete missing information');
    }

    if (rawData.oldPendingContacts.length > 0) {
      insights.push(`Follow-up needed: ${rawData.oldPendingContacts.length} contacts with responses pending over 7 days`);
      recommendations.push('Systematic follow-up for long-pending contacts');
    }

    if (health.level === 'excellent') {
      insights.push('System operating at optimal data quality levels');
      recommendations.push('Continue current data management practices');
    }

    return { insights, recommendations };
  }

  getIssueSpecificRecommendation(issue) {
    const recommendations = {
      'Segurança': 'Coordinate with public security for enhanced safety measures',
      'Saúde': 'Review healthcare service capacity and accessibility',
      'Transporte': 'Analyze public transportation routes and frequency',
      'Educação': 'Assess educational facility capacity and quality',
      'Emprego': 'Develop job creation and economic development programs',
      'Outros': 'Conduct detailed analysis of custom issue responses'
    };
    
    return recommendations[issue] || null;
  }
}

module.exports = MunicipalAnalysisEngine;
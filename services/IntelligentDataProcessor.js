// services/IntelligentDataProcessor.js - Transform raw data into intelligent insights
const DataAccessLayer = require('./DataAccessLayer');

class IntelligentDataProcessor {
  constructor() {
    this.dataAccess = new DataAccessLayer();
    this.municipalBenchmarks = {
      satisfactionScore: 3.5,
      responseRate: 45,
      engagementRate: 60,
      issueResolutionTime: 7
    };
  }

  /**
   * Generate intelligent context for LLM processing
   */
  async generateIntelligentContext(queryAnalysis) {
    const rawData = this.dataAccess.loadData();
    const statistics = this.calculateAdvancedStatistics(rawData);
    const trends = this.analyzeTrends(rawData);
    const insights = this.generateKeyInsights(statistics, trends);
    const risks = this.assessRisks(statistics, trends);

    return {
      executiveSummary: this.createExecutiveSummary(statistics, trends),
      statisticalProfile: {
        ...statistics,
        rawContacts: rawData  // Include raw contact data for resident extraction
      },
      trendAnalysis: trends,
      keyInsights: insights,
      riskAssessment: risks,
      benchmarkComparison: this.compareToBenchmarks(statistics),
      actionableMetrics: this.generateActionableMetrics(statistics, queryAnalysis),
      municipalContext: this.getMunicipalContext(),
      rawData: rawData  // Also include at root level for easy access
    };
  }

  calculateAdvancedStatistics(rawData) {
    const total = rawData.length;
    const responses = rawData.filter(c => c.survey);
    const sent = rawData.filter(c => c.whatsappSentAt);
    const clicked = rawData.filter(c => c.clickedAt);

    // Satisfaction analysis with confidence intervals
    const satisfactionData = this.analyzeSatisfactionWithConfidence(responses);
    
    // Geographic distribution analysis
    const geoAnalysis = this.analyzeGeographicDistribution(rawData);
    
    // Engagement funnel analysis
    const funnelAnalysis = this.analyzeFunnelPerformance(total, sent.length, clicked.length, responses.length);
    
    // Issue severity analysis
    const issueAnalysis = this.analyzeIssueSeverity(responses);

    return {
      population: {
        total,
        responseRate: ((responses.length / total) * 100).toFixed(1),
        engagementRate: sent.length > 0 ? ((clicked.length / sent.length) * 100).toFixed(1) : 0,
        completionRate: clicked.length > 0 ? ((responses.length / clicked.length) * 100).toFixed(1) : 0
      },
      satisfaction: satisfactionData,
      geographic: geoAnalysis,
      funnel: funnelAnalysis,
      issues: issueAnalysis,
      temporal: this.analyzeTemporalPatterns(rawData)
    };
  }

  analyzeSatisfactionWithConfidence(responses) {
    if (responses.length === 0) {
      return { averageScore: 0, confidence: 'insufficient_data', distribution: {} };
    }

    const weights = {
      'Muito satisfeito': 5,
      'Satisfeito': 4,
      'Neutro': 3,
      'Insatisfeito': 2,
      'Muito insatisfeito': 1
    };

    const scores = responses.map(r => weights[r.survey.satisfaction] || 3);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length);
    
    // Statistical significance
    const sampleSize = responses.length;
    const marginOfError = 1.96 * (stdDev / Math.sqrt(sampleSize)); // 95% confidence interval
    
    const distribution = {};
    responses.forEach(r => {
      const level = r.survey.satisfaction || 'Unknown';
      distribution[level] = (distribution[level] || 0) + 1;
    });

    return {
      averageScore: average.toFixed(2),
      confidenceInterval: {
        lower: (average - marginOfError).toFixed(2),
        upper: (average + marginOfError).toFixed(2),
        marginOfError: marginOfError.toFixed(2)
      },
      distribution,
      standardDeviation: stdDev.toFixed(2),
      sampleSize,
      reliability: sampleSize >= 30 ? 'high' : sampleSize >= 15 ? 'moderate' : 'low'
    };
  }

  analyzeGeographicDistribution(rawData) {
    const neighborhoods = {};
    const geoMetrics = {};

    rawData.forEach(contact => {
      const neighborhood = contact.neighborhood || 'Unknown';
      if (!neighborhoods[neighborhood]) {
        neighborhoods[neighborhood] = {
          total: 0,
          responded: 0,
          clicked: 0,
          sent: 0,
          satisfactionSum: 0,
          satisfactionCount: 0
        };
      }

      const n = neighborhoods[neighborhood];
      n.total++;
      if (contact.survey) {
        n.responded++;
        const weights = { 'Muito satisfeito': 5, 'Satisfeito': 4, 'Neutro': 3, 'Insatisfeito': 2, 'Muito insatisfeito': 1 };
        n.satisfactionSum += weights[contact.survey.satisfaction] || 3;
        n.satisfactionCount++;
      }
      if (contact.clickedAt) n.clicked++;
      if (contact.whatsappSentAt) n.sent++;
    });

    // Calculate performance metrics for each neighborhood
    Object.keys(neighborhoods).forEach(name => {
      const n = neighborhoods[name];
      geoMetrics[name] = {
        ...n,
        responseRate: ((n.responded / n.total) * 100).toFixed(1),
        engagementRate: n.sent > 0 ? ((n.clicked / n.sent) * 100).toFixed(1) : 0,
        avgSatisfaction: n.satisfactionCount > 0 ? (n.satisfactionSum / n.satisfactionCount).toFixed(2) : 0,
        performanceScore: this.calculateNeighborhoodPerformance(n)
      };
    });

    // Identify top and bottom performers
    const sortedByPerformance = Object.entries(geoMetrics)
      .sort(([,a], [,b]) => b.performanceScore - a.performanceScore);

    return {
      neighborhoods: geoMetrics,
      totalNeighborhoods: Object.keys(neighborhoods).length,
      topPerformers: sortedByPerformance.slice(0, 3),
      needsAttention: sortedByPerformance.slice(-3),
      equityGap: this.calculateEquityGap(geoMetrics)
    };
  }

  calculateNeighborhoodPerformance(neighborhood) {
    const responseWeight = 0.4;
    const engagementWeight = 0.3;
    const satisfactionWeight = 0.3;

    const responseScore = Math.min((neighborhood.responded / neighborhood.total) * 100, 100);
    const engagementScore = neighborhood.sent > 0 ? Math.min((neighborhood.clicked / neighborhood.sent) * 100, 100) : 0;
    const satisfactionScore = neighborhood.satisfactionCount > 0 ? 
      ((neighborhood.satisfactionSum / neighborhood.satisfactionCount) / 5) * 100 : 0;

    return (responseScore * responseWeight + engagementScore * engagementWeight + satisfactionScore * satisfactionWeight).toFixed(1);
  }

  calculateEquityGap(geoMetrics) {
    const performanceScores = Object.values(geoMetrics).map(n => parseFloat(n.performanceScore));
    if (performanceScores.length === 0) return 0;
    
    const highest = Math.max(...performanceScores);
    const lowest = Math.min(...performanceScores);
    return (highest - lowest).toFixed(1);
  }

  analyzeFunnelPerformance(total, sent, clicked, responded) {
    return {
      stages: {
        registered: total,
        contacted: sent,
        engaged: clicked,
        responded: responded
      },
      conversionRates: {
        contactRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 0,
        engagementRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0,
        responseRate: clicked > 0 ? ((responded / clicked) * 100).toFixed(1) : 0,
        overallConversion: total > 0 ? ((responded / total) * 100).toFixed(1) : 0
      },
      dropoffAnalysis: {
        preContact: total - sent,
        postContact: sent - clicked,
        postEngagement: clicked - responded
      }
    };
  }

  analyzeIssueSeverity(responses) {
    const issues = {};
    const severityWeights = {
      'Muito insatisfeito': 5,
      'Insatisfeito': 3,
      'Neutro': 1,
      'Satisfeito': 0,
      'Muito satisfeito': 0
    };

    responses.forEach(response => {
      if (response.survey && response.survey.issue) {
        const issue = response.survey.issue;
        const severity = severityWeights[response.survey.satisfaction] || 1;
        
        if (!issues[issue]) {
          issues[issue] = { count: 0, totalSeverity: 0, avgSeverity: 0 };
        }
        
        issues[issue].count++;
        issues[issue].totalSeverity += severity;
        issues[issue].avgSeverity = (issues[issue].totalSeverity / issues[issue].count).toFixed(2);
      }
    });

    // Sort by priority (severity * frequency)
    const prioritizedIssues = Object.entries(issues)
      .map(([issue, data]) => ({
        issue,
        ...data,
        priorityScore: (data.avgSeverity * data.count).toFixed(2)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    return {
      totalIssues: Object.keys(issues).length,
      breakdown: prioritizedIssues,
      criticalIssues: prioritizedIssues.filter(i => parseFloat(i.avgSeverity) >= 3),
      mostFrequent: prioritizedIssues[0] || null
    };
  }

  analyzeTemporalPatterns(rawData) {
    const now = new Date();
    const last24h = rawData.filter(c => c.createdAt && (now - new Date(c.createdAt)) < 24 * 60 * 60 * 1000);
    const last7d = rawData.filter(c => c.createdAt && (now - new Date(c.createdAt)) < 7 * 24 * 60 * 60 * 1000);
    const last30d = rawData.filter(c => c.createdAt && (now - new Date(c.createdAt)) < 30 * 24 * 60 * 60 * 1000);

    return {
      recent: {
        last24h: last24h.length,
        last7d: last7d.length,
        last30d: last30d.length
      },
      momentum: {
        daily: (last24h.length * 30).toFixed(1), // projected monthly
        weekly: (last7d.length * 4.3).toFixed(1), // projected monthly
        trend: this.calculateMomentumTrend(rawData)
      }
    };
  }

  calculateMomentumTrend(rawData) {
    // Simple trend calculation based on creation dates
    const now = new Date();
    const week1 = rawData.filter(c => {
      const age = (now - new Date(c.createdAt || 0)) / (24 * 60 * 60 * 1000);
      return age <= 7;
    }).length;
    
    const week2 = rawData.filter(c => {
      const age = (now - new Date(c.createdAt || 0)) / (24 * 60 * 60 * 1000);
      return age > 7 && age <= 14;
    }).length;

    if (week2 === 0) return 'insufficient_data';
    const change = ((week1 - week2) / week2) * 100;
    
    if (change > 10) return 'accelerating';
    if (change < -10) return 'declining';
    return 'stable';
  }

  analyzeTrends(rawData) {
    const statistics = this.calculateAdvancedStatistics(rawData);
    
    return {
      satisfaction: {
        current: parseFloat(statistics.satisfaction.averageScore),
        trend: this.calculateSatisfactionTrend(statistics.satisfaction),
        reliability: statistics.satisfaction.reliability
      },
      engagement: {
        current: parseFloat(statistics.population.engagementRate),
        benchmark: this.municipalBenchmarks.engagementRate,
        performance: this.assessPerformance(parseFloat(statistics.population.engagementRate), this.municipalBenchmarks.engagementRate)
      },
      geographic: {
        equityGap: parseFloat(statistics.geographic.equityGap),
        riskLevel: this.assessEquityRisk(parseFloat(statistics.geographic.equityGap))
      }
    };
  }

  calculateSatisfactionTrend(satisfactionData) {
    const score = parseFloat(satisfactionData.averageScore);
    if (score >= 4.0) return 'positive';
    if (score >= 3.5) return 'moderate';
    if (score >= 3.0) return 'neutral';
    return 'concerning';
  }

  assessPerformance(current, benchmark) {
    const ratio = current / benchmark;
    if (ratio >= 1.2) return 'excellent';
    if (ratio >= 1.0) return 'good';
    if (ratio >= 0.8) return 'fair';
    return 'poor';
  }

  assessEquityRisk(equityGap) {
    if (equityGap >= 40) return 'critical';
    if (equityGap >= 25) return 'high';
    if (equityGap >= 15) return 'moderate';
    return 'low';
  }

  generateKeyInsights(statistics, trends) {
    const insights = [];
    
    // Satisfaction insights
    if (trends.satisfaction.current < 3.0) {
      insights.push({
        type: 'critical',
        category: 'satisfaction',
        insight: `Critical satisfaction crisis: ${trends.satisfaction.current}/5 average score indicates systemic service delivery failures`,
        impact: 'high',
        urgency: 'immediate'
      });
    } else if (trends.satisfaction.current >= 4.0) {
      insights.push({
        type: 'positive',
        category: 'satisfaction',
        insight: `Strong satisfaction performance: ${trends.satisfaction.current}/5 score demonstrates effective municipal services`,
        impact: 'positive',
        urgency: 'maintain'
      });
    }

    // Engagement insights
    if (parseFloat(statistics.population.engagementRate) < 50) {
      insights.push({
        type: 'concern',
        category: 'engagement',
        insight: `Low engagement rate (${statistics.population.engagementRate}%) suggests communication barriers or citizen apathy`,
        impact: 'medium',
        urgency: 'high'
      });
    }

    // Geographic equity insights
    if (trends.geographic.riskLevel === 'critical' || trends.geographic.riskLevel === 'high') {
      insights.push({
        type: 'equity',
        category: 'geographic',
        insight: `Significant service equity gap (${trends.geographic.equityGap} points) between neighborhoods requires intervention`,
        impact: 'high',
        urgency: 'high'
      });
    }

    // Issue priority insights
    if (statistics.issues.criticalIssues.length > 0) {
      const topCritical = statistics.issues.criticalIssues[0];
      insights.push({
        type: 'operational',
        category: 'issues',
        insight: `Priority intervention needed: ${topCritical.issue} shows high severity (${topCritical.avgSeverity}/5) across ${topCritical.count} cases`,
        impact: 'high',
        urgency: 'immediate'
      });
    }

    return insights;
  }

  assessRisks(statistics, trends) {
    const risks = [];

    // Statistical reliability risk
    if (statistics.satisfaction.reliability === 'low') {
      risks.push({
        type: 'data_quality',
        risk: 'Low sample size reduces statistical confidence in satisfaction measurements',
        probability: 'high',
        impact: 'medium'
      });
    }

    // Satisfaction trend risk
    if (trends.satisfaction.trend === 'concerning') {
      risks.push({
        type: 'satisfaction',
        risk: 'Declining satisfaction may lead to reduced civic engagement and trust',
        probability: 'medium',
        impact: 'high'
      });
    }

    // Geographic equity risk
    if (trends.geographic.riskLevel === 'critical') {
      risks.push({
        type: 'equity',
        risk: 'Severe service disparities may create community tensions and inequitable outcomes',
        probability: 'high',
        impact: 'high'
      });
    }

    return risks;
  }

  compareToBenchmarks(statistics) {
    return {
      satisfaction: {
        current: parseFloat(statistics.satisfaction.averageScore),
        benchmark: this.municipalBenchmarks.satisfactionScore,
        performance: this.assessPerformance(parseFloat(statistics.satisfaction.averageScore), this.municipalBenchmarks.satisfactionScore),
        gap: (parseFloat(statistics.satisfaction.averageScore) - this.municipalBenchmarks.satisfactionScore).toFixed(2)
      },
      responseRate: {
        current: parseFloat(statistics.population.responseRate),
        benchmark: this.municipalBenchmarks.responseRate,
        performance: this.assessPerformance(parseFloat(statistics.population.responseRate), this.municipalBenchmarks.responseRate),
        gap: (parseFloat(statistics.population.responseRate) - this.municipalBenchmarks.responseRate).toFixed(1)
      },
      engagement: {
        current: parseFloat(statistics.population.engagementRate),
        benchmark: this.municipalBenchmarks.engagementRate,
        performance: this.assessPerformance(parseFloat(statistics.population.engagementRate), this.municipalBenchmarks.engagementRate),
        gap: (parseFloat(statistics.population.engagementRate) - this.municipalBenchmarks.engagementRate).toFixed(1)
      }
    };
  }

  generateActionableMetrics(statistics, queryAnalysis) {
    const metrics = {};

    // Response rate improvement potential
    const currentResponse = parseFloat(statistics.population.responseRate);
    const targetResponse = Math.min(currentResponse + 20, 80); // Realistic improvement target
    metrics.responseImprovement = {
      current: currentResponse,
      target: targetResponse,
      contactsNeeded: Math.ceil((targetResponse - currentResponse) * statistics.population.total / 100)
    };

    // Satisfaction improvement potential
    const currentSatisfaction = parseFloat(statistics.satisfaction.averageScore);
    const targetSatisfaction = Math.min(currentSatisfaction + 0.5, 4.5);
    metrics.satisfactionImprovement = {
      current: currentSatisfaction,
      target: targetSatisfaction,
      impactEstimate: statistics.issues.criticalIssues.length > 0 ? 
        `Addressing ${statistics.issues.criticalIssues[0].issue} could improve satisfaction by 0.3-0.7 points` : 
        'Systematic service improvements needed'
    };

    return metrics;
  }

  getMunicipalContext() {
    return {
      domain: 'Municipal Citizen Engagement',
      bestPractices: [
        'Response rates above 60% indicate strong civic engagement',
        'Satisfaction scores below 3.0 require immediate intervention',
        'Geographic equity gaps above 25 points indicate systemic issues',
        'Multi-channel communication increases engagement by 15-30%'
      ],
      benchmarks: this.municipalBenchmarks,
      industryStandards: {
        minimumSampleSize: 30,
        confidenceLevel: 95,
        acceptableEquityGap: 15
      }
    };
  }

  createExecutiveSummary(statistics, trends) {
    const responseRate = parseFloat(statistics.population.responseRate);
    const satisfaction = parseFloat(statistics.satisfaction.averageScore);
    const engagement = parseFloat(statistics.population.engagementRate);
    
    let summary = `Municipal engagement analysis of ${statistics.population.total} citizens reveals `;
    
    // Response rate assessment
    if (responseRate >= 60) {
      summary += `strong civic participation (${responseRate}% response rate)`;
    } else if (responseRate >= 40) {
      summary += `moderate civic participation (${responseRate}% response rate)`;
    } else {
      summary += `limited civic participation (${responseRate}% response rate requiring improvement)`;
    }
    
    // Satisfaction assessment
    if (satisfaction >= 4.0) {
      summary += ` with high citizen satisfaction (${satisfaction}/5)`;
    } else if (satisfaction >= 3.5) {
      summary += ` with acceptable satisfaction levels (${satisfaction}/5)`;
    } else if (satisfaction >= 3.0) {
      summary += ` with concerning satisfaction levels (${satisfaction}/5)`;
    } else {
      summary += ` with critical satisfaction issues (${satisfaction}/5)`;
    }
    
    // Key challenges
    const criticalIssues = statistics.issues.criticalIssues.length;
    const equityGap = parseFloat(statistics.geographic.equityGap);
    
    if (criticalIssues > 0 || equityGap > 25) {
      summary += `. Priority concerns include `;
      const concerns = [];
      if (criticalIssues > 0) concerns.push(`${criticalIssues} critical service issues`);
      if (equityGap > 25) concerns.push(`significant geographic service disparities (${equityGap} point gap)`);
      summary += concerns.join(' and ');
    }
    
    summary += `.`;
    
    return summary;
  }
}

module.exports = IntelligentDataProcessor;
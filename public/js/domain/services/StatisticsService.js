/**
 * StatisticsService - Domain Service (DDD)
 * Calculates statistics from citizen data
 * Single Responsibility: Only statistical calculations
 */
export class StatisticsService {
  /**
   * Calculate comprehensive statistics
   * @param {Citizen[]} citizens
   * @returns {Statistics}
   */
  calculate(citizens) {
    return {
      total: this.getTotalCount(citizens),
      sent: this.getSentCount(citizens),
      responded: this.getRespondedCount(citizens),
      pending: this.getPendingCount(citizens),
      clicked: this.getClickedCount(citizens),
      satisfactionBreakdown: this.getSatisfactionBreakdown(citizens),
      participationBreakdown: this.getParticipationBreakdown(citizens),
      issueBreakdown: this.getIssueBreakdown(citizens),
      neighborhoodBreakdown: this.getNeighborhoodBreakdown(citizens)
    };
  }

  getTotalCount(citizens) {
    return citizens.length;
  }

  getSentCount(citizens) {
    return citizens.filter(c => c.wasContacted()).length;
  }

  getRespondedCount(citizens) {
    return citizens.filter(c => c.hasResponded()).length;
  }

  getPendingCount(citizens) {
    return citizens.filter(c => c.isPending()).length;
  }

  getClickedCount(citizens) {
    return citizens.filter(c => c.isEngaged()).length;
  }

  getSatisfactionBreakdown(citizens) {
    const breakdown = {};
    citizens
      .filter(c => c.hasResponded())
      .forEach(citizen => {
        const level = citizen.getSatisfactionLevel();
        if (level) {
          breakdown[level] = (breakdown[level] || 0) + 1;
        }
      });
    return breakdown;
  }

  getParticipationBreakdown(citizens) {
    const willing = citizens.filter(c => c.isWillingToParticipate()).length;
    const responded = this.getRespondedCount(citizens);
    const notWilling = responded - willing;

    return {
      willing,
      notWilling,
      total: responded
    };
  }

  getIssueBreakdown(citizens) {
    const breakdown = {};
    citizens
      .filter(c => c.hasResponded())
      .forEach(citizen => {
        const issue = citizen.getCivicIssue();
        if (issue) {
          breakdown[issue] = (breakdown[issue] || 0) + 1;
        }
      });
    return breakdown;
  }

  getNeighborhoodBreakdown(citizens) {
    const breakdown = {};
    citizens.forEach(citizen => {
      const neighborhood = citizen.personalInfo.neighborhood || 'Não especificado';
      breakdown[neighborhood] = (breakdown[neighborhood] || 0) + 1;
    });
    return breakdown;
  }

  getAverageSatisfactionRating(citizens) {
    const responded = citizens.filter(c => c.hasResponded());
    if (responded.length === 0) return 0;

    const totalRating = responded.reduce((sum, citizen) => {
      return sum + (citizen.surveyResponse?.getSatisfactionRating() || 0);
    }, 0);

    return totalRating / responded.length;
  }
}

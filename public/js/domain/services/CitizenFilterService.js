/**
 * CitizenFilterService - Domain Service (DDD)
 * Handles filtering logic for citizens
 * Single Responsibility: Only filtering operations
 */
export class CitizenFilterService {
  /**
   * Apply filter criteria to citizens
   * @param {Citizen[]} citizens
   * @param {FilterCriteriaDTO} criteria
   * @returns {Citizen[]}
   */
  apply(citizens, criteria) {
    let filtered = [...citizens];

    if (criteria.neighborhood) {
      filtered = this.filterByNeighborhood(filtered, criteria.neighborhood);
    }

    if (criteria.hasResponded !== null) {
      filtered = this.filterByResponseStatus(filtered, criteria.hasResponded);
    }

    if (criteria.satisfactionLevel) {
      filtered = this.filterBySatisfaction(filtered, criteria.satisfactionLevel);
    }

    if (criteria.participationIntent !== null) {
      filtered = this.filterByParticipation(filtered, criteria.participationIntent);
    }

    return filtered;
  }

  filterByNeighborhood(citizens, neighborhood) {
    const searchTerm = neighborhood.toLowerCase().trim();
    return citizens.filter(citizen => {
      const citizenNeighborhood = citizen.personalInfo.neighborhood || '';
      return citizenNeighborhood.toLowerCase().includes(searchTerm);
    });
  }

  filterByResponseStatus(citizens, hasResponded) {
    return citizens.filter(citizen => citizen.hasResponded() === hasResponded);
  }

  filterBySatisfaction(citizens, satisfactionLevel) {
    return citizens.filter(citizen => {
      return citizen.getSatisfactionLevel() === satisfactionLevel;
    });
  }

  filterByParticipation(citizens, willingToParticipate) {
    return citizens.filter(citizen => {
      return citizen.isWillingToParticipate() === willingToParticipate;
    });
  }

  filterByEngagementStatus(citizens, status) {
    return citizens.filter(citizen => citizen.getEngagementStatus() === status);
  }
}

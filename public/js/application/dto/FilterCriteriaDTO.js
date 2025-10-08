/**
 * FilterCriteriaDTO - Data Transfer Object
 * Represents filter criteria for citizen queries
 */
export class FilterCriteriaDTO {
  constructor(options = {}) {
    this.neighborhood = options.neighborhood || null;
    this.hasResponded = options.hasResponded !== undefined ? options.hasResponded : null;
    this.satisfactionLevel = options.satisfactionLevel || null;
    this.participationIntent = options.participationIntent !== undefined ? options.participationIntent : null;
    this.engagementStatus = options.engagementStatus || null;
  }

  static empty() {
    return new FilterCriteriaDTO();
  }

  static fromFormData(formData) {
    return new FilterCriteriaDTO({
      neighborhood: formData.neighborhood?.trim() || null,
      hasResponded: formData.answered === 'true' ? true : formData.answered === 'false' ? false : null
    });
  }

  hasFilters() {
    return this.neighborhood !== null ||
           this.hasResponded !== null ||
           this.satisfactionLevel !== null ||
           this.participationIntent !== null ||
           this.engagementStatus !== null;
  }
}

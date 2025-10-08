/**
 * LoadCitizensUseCase - Application Use Case
 * Orchestrates loading and filtering citizens
 * Single Responsibility: Coordinate citizen loading workflow
 */
import { CitizenDTO } from '../dto/CitizenDTO.js';

export class LoadCitizensUseCase {
  constructor(citizenRepository, filterService, statisticsService) {
    this.repository = citizenRepository;
    this.filterService = filterService;
    this.statisticsService = statisticsService;
  }

  async execute(filterCriteria) {
    try {
      // Load all citizens from repository
      const allCitizens = await this.repository.findAll();

      // Apply filters if any
      const filteredCitizens = filterCriteria.hasFilters()
        ? this.filterService.apply(allCitizens, filterCriteria)
        : allCitizens;

      // Calculate statistics
      const statistics = this.statisticsService.calculate(filteredCitizens);

      // Convert to DTOs for presentation layer
      const citizenDTOs = CitizenDTO.fromCitizenList(filteredCitizens);

      return {
        success: true,
        citizens: citizenDTOs,
        statistics,
        totalCount: allCitizens.length,
        filteredCount: filteredCitizens.length
      };
    } catch (error) {
      console.error('[LoadCitizensUseCase] Error:', error);
      return {
        success: false,
        error: error.message,
        citizens: [],
        statistics: null
      };
    }
  }
}

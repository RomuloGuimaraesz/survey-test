/**
 * ExportCitizensUseCase - Application Use Case
 * Handles exporting citizen data
 * Single Responsibility: Orchestrate data export workflow
 */
export class ExportCitizensUseCase {
  constructor(citizenRepository) {
    this.repository = citizenRepository;
  }

  async execute() {
    try {
      // Delegate to repository which handles the API call
      await this.repository.exportToCSV();

      return {
        success: true,
        message: 'Exportação iniciada'
      };
    } catch (error) {
      console.error('[ExportCitizensUseCase] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

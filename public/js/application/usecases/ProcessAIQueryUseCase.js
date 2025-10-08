/**
 * ProcessAIQueryUseCase - Application Use Case
 * Handles AI assistant queries
 * Single Responsibility: Orchestrate AI query processing
 */
export class ProcessAIQueryUseCase {
  constructor(aiService) {
    this.aiService = aiService;
  }

  async execute(query) {
    try {
      const result = await this.aiService.processQuery(query);

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('[ProcessAIQueryUseCase] Error:', error);
      return {
        success: false,
        error: error.message,
        response: `Erro ao processar consulta: ${error.message}`
      };
    }
  }
}

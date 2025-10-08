/**
 * AIAssistantService - Infrastructure
 * Handles communication with AI backend
 * Single Responsibility: AI query processing
 */
import { ApiEndpoints } from '../../shared/constants.js';

export class AIAssistantService {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async processQuery(query) {
    try {
      const response = await this.api.post(ApiEndpoints.AGENT_UI, { query });

      if (!response) {
        throw new Error('Empty response from AI service');
      }

      return {
        success: response.success || false,
        response: response.response || response.message,
        intent: response.intent,
        residents: response.residents || [],
        insights: response.insights || [],
        recommendations: response.recommendations || [],
        report: response.report || null,
        timestamp: response.timestamp || new Date().toISOString(),
        confidence: response.confidence
      };
    } catch (error) {
      console.error('[AIAssistantService] processQuery error:', error);
      throw new Error('Falha ao processar consulta de IA');
    }
  }
}

/**
 * HttpCitizenRepository - Infrastructure
 * Concrete implementation of ICitizenRepository using HTTP
 * Follows Liskov Substitution Principle - can replace ICitizenRepository
 */
import { ICitizenRepository } from '../../domain/repositories/ICitizenRepository.js';
import { Citizen } from '../../domain/entities/Citizen.js';
import { ApiEndpoints } from '../../shared/constants.js';

export class HttpCitizenRepository extends ICitizenRepository {
  constructor(apiClient) {
    super();
    this.api = apiClient;
  }

  async findAll() {
    try {
      // Try multiple data sources with fallback
      const candidates = [
        ApiEndpoints.CONTACTS + '?legacy=true',
        '/data.json',
        '../data.json',
        './data.json'
      ];

      for (const url of candidates) {
        try {
          const response = await this.api.get(url);
          const rawData = Array.isArray(response) ? response : response.data;

          if (Array.isArray(rawData) && rawData.length > 0) {
            // Convert raw data to domain entities
            return rawData.map(data => Citizen.fromRawData(data));
          }
        } catch (error) {
          // Try next candidate
          continue;
        }
      }

      // No data found, return empty array
      console.warn('[HttpCitizenRepository] No data found, returning empty array');
      return [];
    } catch (error) {
      console.error('[HttpCitizenRepository] findAll error:', error);
      throw new Error('Falha ao carregar cidadãos');
    }
  }

  async findById(id) {
    try {
      const allCitizens = await this.findAll();
      return allCitizens.find(citizen => citizen.id === id) || null;
    } catch (error) {
      console.error('[HttpCitizenRepository] findById error:', error);
      throw new Error('Falha ao buscar cidadão');
    }
  }

  async save(citizen) {
    try {
      const rawData = citizen.toRawData();
      const response = await this.api.put(`${ApiEndpoints.CONTACTS}/${citizen.id}`, rawData);
      return Citizen.fromRawData(response);
    } catch (error) {
      console.error('[HttpCitizenRepository] save error:', error);
      throw new Error('Falha ao salvar cidadão');
    }
  }

  async markAsSent(id) {
    try {
      await this.api.post(ApiEndpoints.MARK_SENT(id));
      return true;
    } catch (error) {
      console.error('[HttpCitizenRepository] markAsSent error:', error);
      return false;
    }
  }

  async exportToCSV() {
    try {
      // Trigger CSV download via endpoint
      window.location.href = ApiEndpoints.EXPORT;
    } catch (error) {
      console.error('[HttpCitizenRepository] exportToCSV error:', error);
      throw new Error('Falha ao exportar dados');
    }
  }
}

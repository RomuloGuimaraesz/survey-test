// services/DataAccessLayer.js - Pure data access without analysis logic
const fs = require('fs');
const path = require('path');

class DataAccessLayer {
  constructor() {
  // Align with server.js: support DB_FILE env (absolute or relative)
  const dbFile = process.env.DB_FILE || '../data.json';
  this.dataPath = path.isAbsolute(dbFile) ? dbFile : path.join(__dirname, dbFile);
    this.cache = null;
    this.cacheTime = null;
    this.cacheTTL = 30000; // 30 seconds cache
  }

  // Core data loading
  loadData() {
    // Check cache first
    if (this.cache && this.cacheTime && (Date.now() - this.cacheTime) < this.cacheTTL) {
      return this.cache;
    }

    try {
      let resolvedPath = this.dataPath;
      if (!fs.existsSync(resolvedPath)) {
        // Fallback 1: try CWD/data.json
        const cwdPath = path.resolve(process.cwd(), 'data.json');
        if (fs.existsSync(cwdPath)) {
          resolvedPath = cwdPath;
        } else {
          // Fallback 2: try latest backup file in server root
          const serverRoot = path.resolve(__dirname, '..');
          const files = fs.readdirSync(serverRoot).filter(f => f.startsWith('data.backup.') && f.endsWith('.json'));
          if (files.length) {
            files.sort();
            resolvedPath = path.join(serverRoot, files[files.length - 1]);
            console.warn(`[DataAccessLayer] data.json missing, using backup: ${path.basename(resolvedPath)}`);
          } else {
            console.warn(`[DataAccessLayer] No data file found at ${this.dataPath} or ${cwdPath}`);
            return [];
          }
        }
      }

      const rawData = fs.readFileSync(resolvedPath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Update cache
      this.cache = Array.isArray(data) ? data : [];
      this.cacheTime = Date.now();
      
      console.log(`[DataAccessLayer] Loaded ${this.cache.length} contacts from ${path.basename(resolvedPath)}`);
      return this.cache;
    } catch (error) {
      console.error('[DataAccessLayer] Error loading data:', error.message);
      return [];
    }
  }

  // Raw data retrieval methods
  getAllContacts(filters = {}) {
    let data = this.loadData();

    if (filters.answered === true) {
      data = data.filter(d => d.survey);
    } else if (filters.answered === false) {
      data = data.filter(d => !d.survey);
    }

    if (filters.sent === true) {
      data = data.filter(d => d.whatsappSentAt);
    } else if (filters.sent === false) {
      data = data.filter(d => !d.whatsappSentAt);
    }

    if (filters.neighborhood) {
      data = data.filter(d => 
        d.neighborhood && 
        d.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())
      );
    }

    if (filters.satisfaction) {
      data = data.filter(d => 
        d.survey && d.survey.satisfaction === filters.satisfaction
      );
    }

    return data;
  }

  getSurveyResponses(filters = {}) {
    return this.getAllContacts(filters).filter(contact => contact.survey);
  }

  getEngagementRawData() {
    const data = this.loadData();
    return {
      total: data.length,
      sent: data.filter(d => d.whatsappSentAt).length,
      clicked: data.filter(d => d.clickedAt).length,
      answered: data.filter(d => d.survey).length,
      rawContacts: data
    };
  }

  getNeighborhoodRawData() {
    const data = this.loadData();
    const neighborhoods = {};
    
    data.forEach(contact => {
      const neighborhood = contact.neighborhood || 'Unknown';
      if (!neighborhoods[neighborhood]) {
        neighborhoods[neighborhood] = {
          total: 0,
          sent: 0,
          clicked: 0,
          answered: 0,
          contacts: []
        };
      }
      
      neighborhoods[neighborhood].total++;
      neighborhoods[neighborhood].contacts.push(contact);
      if (contact.whatsappSentAt) neighborhoods[neighborhood].sent++;
      if (contact.clickedAt) neighborhoods[neighborhood].clicked++;
      if (contact.survey) neighborhoods[neighborhood].answered++;
    });

    return neighborhoods;
  }

  getSatisfactionRawData() {
    const responses = this.getSurveyResponses();
    const satisfaction = {};
    
    responses.forEach(response => {
      const level = response.survey.satisfaction || 'Unknown';
      satisfaction[level] = (satisfaction[level] || 0) + 1;
    });

    return {
      total: responses.length,
      breakdown: satisfaction,
      responses: responses
    };
  }

  getIssuesRawData() {
    const responses = this.getSurveyResponses();
    const issues = {};
    
    responses.forEach(response => {
      const issue = response.survey.issue || 'Unknown';
      issues[issue] = (issues[issue] || 0) + 1;
    });

    return {
      total: responses.length,
      breakdown: issues,
      responses: responses
    };
  }

  getParticipationRawData() {
    const responses = this.getSurveyResponses();
    const participation = {};
    
    responses.forEach(response => {
      const interest = response.survey.participate || 'Unknown';
      participation[interest] = (participation[interest] || 0) + 1;
    });

    return {
      total: responses.length,
      breakdown: participation,
      responses: responses
    };
  }

  getSystemHealthRawData() {
    const data = this.loadData();
    const issues = [];
    
    // Check for duplicates
    const phones = {};
    data.forEach((contact, index) => {
      if (contact.whatsapp) {
        if (phones[contact.whatsapp]) {
          issues.push({
            type: 'duplicate_phone',
            contact: contact.name,
            phone: contact.whatsapp
          });
        } else {
          phones[contact.whatsapp] = index;
        }
      }
    });

    // Check for incomplete profiles
    const incomplete = data.filter(contact => 
      !contact.name || !contact.age || !contact.neighborhood || !contact.whatsapp
    );

    // Check for old pending responses
    const now = new Date();
    const oldPending = data.filter(contact => {
      if (!contact.whatsappSentAt || contact.survey) return false;
      const sentDate = new Date(contact.whatsappSentAt);
      const daysSince = (now - sentDate) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    });

    return {
      totalContacts: data.length,
      duplicateIssues: issues.filter(i => i.type === 'duplicate_phone'),
      incompleteProfiles: incomplete,
      oldPendingContacts: oldPending,
      allIssues: issues
    };
  }

  // Targeting data for notification agent
  getDissatisfiedContactsRaw() {
    const data = this.getSurveyResponses();
    return data.filter(contact => 
      contact.survey && 
      ['Muito insatisfeito', 'Insatisfeito'].includes(contact.survey.satisfaction)
    );
  }

  getParticipationInterestedRaw() {
    const data = this.getSurveyResponses();
    return data.filter(contact => 
      contact.survey && contact.survey.participate === 'Sim'
    );
  }

  getParticipationNotInterestedRaw() {
    const data = this.getSurveyResponses();
    return data.filter(contact => {
      const p = contact?.survey?.participate;
      if (!p) return false;
      const normalized = p
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
      return normalized === 'nao' || normalized === 'no';
    });
  }

  getNonRespondentsRaw() {
    const data = this.getAllContacts();
    return {
      clickedButNotResponded: data.filter(d => d.clickedAt && !d.survey),
      contacted: data.filter(d => d.whatsappSentAt && !d.clickedAt),
      notContacted: data.filter(d => !d.whatsappSentAt)
    };
  }

  // Administrative data access
  getContactsByStatus(status) {
    const data = this.getAllContacts();
    
    switch (status) {
      case 'answered':
        return data.filter(d => d.survey);
      case 'unanswered':
        return data.filter(d => d.whatsappSentAt && !d.survey);
      case 'old':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return data.filter(d => 
          d.whatsappSentAt && 
          new Date(d.whatsappSentAt) < weekAgo && 
          !d.survey
        );
      case 'failed':
        return data.filter(d => d.whatsappStatus === 'failed');
      default:
        return data;
    }
  }

  getRecentActivityRaw() {
    const data = this.getAllContacts();
    const activities = [];

    data.forEach(contact => {
      if (contact.survey) {
        activities.push({
          name: contact.name,
          action: 'completed survey',
          timestamp: contact.survey.answeredAt,
          details: `Issue: ${contact.survey.issue}, Satisfaction: ${contact.survey.satisfaction}`
        });
      }
      if (contact.clickedAt) {
        activities.push({
          name: contact.name,
          action: 'clicked survey link',
          timestamp: contact.clickedAt,
          details: `From ${contact.neighborhood}`
        });
      }
      if (contact.whatsappSentAt) {
        activities.push({
          name: contact.name,
          action: 'received WhatsApp',
          timestamp: contact.whatsappSentAt,
          details: `Status: ${contact.whatsappStatus || 'sent'}`
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
  }

  // Utility methods
  clearCache() {
    this.cache = null;
    this.cacheTime = null;
  }

  getDataStats() {
    const data = this.loadData();
    const neighborhoods = new Set(data.map(d => d.neighborhood).filter(Boolean));
    
    return {
      contacts: data.length,
      neighborhoods: neighborhoods.size,
      lastModified: fs.existsSync(this.dataPath) ? fs.statSync(this.dataPath).mtime : null
    };
  }
}

module.exports = DataAccessLayer;
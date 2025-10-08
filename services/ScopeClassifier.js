// services/ScopeClassifier.js - LLM-based domain scope classification (municipal intelligence)
// Provides an early guard to prevent off-domain / out-of-scope queries from generating fabricated reports.
// Relies on the existing GROQ_API_KEY; gracefully degrades if unavailable or on failure.

const axios = require('axios');

class ScopeClassifier {
  constructor(options = {}) {
    this.provider = 'groq';
    this.apiKey = process.env.GROQ_API_KEY || null;
    this.model = options.model || process.env.SCOPE_CLASSIFIER_MODEL || 'llama-3.3-70b-versatile'; // reuse if only one model available
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    this.enabled = !!this.apiKey; // auto-disable if no key
  }

  /**
   * Classify a user query as in-scope or out-of-scope for the municipal intelligence domain.
   * @param {string} query
   * @returns {Promise<{inScope:boolean, confidence:number, categories:string[], reason:string, raw?:string, error?:string}>}
   */
  async classify(query) {
    if (!query || !query.trim()) {
      return { inScope: false, confidence: 0, categories: [], reason: 'Empty query' };
    }

    if (!this.enabled) {
      // If disabled, optimistically mark in-scope so existing logic proceeds.
      return { inScope: true, confidence: 0.5, categories: ['unknown'], reason: 'LLM scope classifier disabled (no API key)' };
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = `QUERY:\n${query}\n\nReturn ONLY strict JSON.`;

    try {
      const response = await axios.post(this.endpoint, {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0,
        max_tokens: 300
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      });

      const raw = response.data.choices?.[0]?.message?.content || '';
      const parsed = this.safeParseJson(raw);
      if (!parsed) {
        return { inScope: true, confidence: 0.4, categories: ['unparsed'], reason: 'Could not parse classifier JSON', raw };
      }

      // Normalize output structure
      const inScope = parsed.in_scope === true || parsed.inScope === true || /in[-_]?scope/i.test(parsed.status || '');
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : (typeof parsed.score === 'number' ? parsed.score : 0.5);
      const categories = Array.isArray(parsed.categories) ? parsed.categories : [];
      const reason = parsed.reason || parsed.explanation || 'No reason provided';
      let finalInScope = inScope;
      let finalReason = reason;

      // Heuristic safeguard: if model was uncertain (confidence <0.65) AND query clearly lacks municipal tokens, flip to out_of_scope.
      if (finalInScope) {
        const ql = query.toLowerCase();
        const municipalTokens = [
          'satisfacao','satisfação','engajamento','participacao','participação','bairro','equidade','municip','cidada','cidadã','cidadão','governanca','governança','resposta','taxa','survey','residente','morador'
        ];
        const matches = municipalTokens.filter(t => ql.includes(t)).length;
        if (confidence < 0.65 && matches === 0) {
          finalInScope = false;
          finalReason = 'Low confidence and no municipal domain tokens detected';
        }
      }

      return { inScope: finalInScope, confidence: Math.max(0, Math.min(1, confidence)), categories, reason: finalReason, raw };
    } catch (error) {
      return { inScope: true, confidence: 0.5, categories: ['error-fallback'], reason: 'Classifier call failed', error: error.message };
    }
  }

  buildSystemPrompt() {
    return `You are a strict domain scope classifier for a Municipal Citizen Engagement & Urban Governance intelligence system.\n\nALLOWED DOMAIN CATEGORIES (IN-SCOPE):\n1. Citizen Satisfaction & Feedback (scores, response rates, dissatisfaction, improvement)\n2. Citizen Engagement & Participation (participation rates, outreach, messaging strategies)\n3. Geographic Equity & Neighborhood Performance (neighborhood disparities, equity gaps)\n4. Operational Performance & Service Delivery (system health, response efficiency, resource allocation)\n5. Municipal Benchmarking & Comparative Analysis (benchmarks, trends, statistical confidence)\n6. Survey Data Insights (survey completion, abandonment, segmentation, targeting)\n\nOUT-OF-SCOPE EXAMPLES: food orders (pizza, restaurant), weather forecasts, entertainment (movies, Netflix), sports scores, astrology, generic chit-chat, jokes, gaming, personal finance unrelated to municipal services, medical advice, ecommerce, travel, coding help.\n\nTASK: Classify the user query. DO NOT answer the query. Output STRICT JSON with keys: inScope (boolean), confidence (0-1 float), categories (array of zero or more of the allowed categories EXACTLY as listed above), reason (short explanation), canonical_intent (string: one of satisfaction|engagement|geographic|operational|benchmarking|survey|out_of_scope). If out of scope set inScope false and categories [].\n\nCRITICAL: Output ONLY JSON, no markdown.`;
  }

  safeParseJson(text) {
    if (!text) return null;
    // Attempt direct parse
    try { return JSON.parse(text); } catch (_) {}
    // Extract first JSON object heuristically
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try { return JSON.parse(candidate); } catch (_) { return null; }
    }
    return null;
  }
}

module.exports = ScopeClassifier;

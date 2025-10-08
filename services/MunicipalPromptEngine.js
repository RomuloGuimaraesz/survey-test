// services/MunicipalPromptEngine.js - Intelligent prompt construction for municipal AI
class MunicipalPromptEngine {
  constructor() {
    this.domain = 'Municipal Citizen Engagement & Urban Governance';
    this.version = '2.0.intelligent';
  }

  /**
   * Build intelligent system prompt based on agent role and query analysis
   */
  buildSystemPrompt(agentType, queryAnalysis, intelligentContext) {
    const baseContext = this.getMunicipalExpertiseContext();
    const roleSpecialization = this.getRoleSpecialization(agentType);
    const outputFormat = this.getStructuredOutputFormat(queryAnalysis.queryType);
    
    return `${baseContext}
            ${roleSpecialization}
            ${outputFormat}

            REQUISITOS DE CONFIANÇA ESTATÍSTICA:
            - Sempre inclua intervalos de confiança e tamanhos de amostra
            - Sinalize dados insuficientes claramente
            - Forneça níveis de significância estatística
            - Compare contra benchmarks municipais quando possível

            MANDATO DE INTELIGÊNCIA ACIONÁVEL:
            - Cada insight deve incluir recomendações específicas e mensuráveis
            - Forneça cronogramas de implementação (imediato, curto prazo, longo prazo)
            - Inclua métricas de sucesso e abordagens de monitoramento
            - Aborde tanto soluções sintomáticas quanto de causa raiz`;
  }

  /**
   * Build intelligent user prompt with rich data context
   */
  buildUserPrompt(query, queryAnalysis, intelligentContext) {
    const contextualData = this.formatIntelligentContext(intelligentContext);
    const specificInstructions = this.getQuerySpecificInstructions(queryAnalysis);
    
    return `REQUISIÇÃO DE INTELIGÊNCIA DE ENGAJAMENTO CIDADÃO:
"${query}"

${contextualData}

${specificInstructions}

REQUISITOS DE RESPOSTA:
Forneça inteligência pronta para liderança municipal que:
1. Aproveite os dados específicos acima (não exemplos genéricos)
2. Inclua avaliações de confiança estatística e confiabilidade
3. Identifique oportunidades de intervenção acionáveis
4. Forneça roteiro de implementação com cronogramas
5. Sugira métricas de sucesso para rastrear melhoria
6. Aborde tanto considerações imediatas quanto estratégicas

Formate como briefing de inteligência municipal profissional.`;
  }

  getMunicipalExpertiseContext() {
    return `Você é um Analista Sênior de Inteligência de Dados Municipais com expertise em:

ESPECIALIZAÇÃO DE DOMÍNIO:
- Medição e estratégias de melhoria de satisfação cidadã
- Otimização de prestação de serviços municipais
- Análise de engajamento comunitário e participação cívica
- Avaliação de equidade geográfica e planejamento de intervenções
- Análise estatística para tomada de decisões municipais
- Governança municipal brasileira e marcos de direitos cidadãos

FRAMEWORKS ANALÍTICOS:
- Testes de significância estatística e análise de intervalos de confiança
- Benchmarking comparativo contra melhores práticas municipais
- Análise de causa raiz para problemas de prestação de serviços ao cidadão
- Modelagem preditiva para otimização de engajamento cidadão
- Análise de custo-benefício para intervenções municipais
- Metodologias de avaliação de impacto de equidade

CONHECIMENTO DE MELHORES PRÁTICAS MUNICIPAIS:
- Taxas de resposta acima de 60% indicam forte engajamento cívico
- Pontuações de satisfação abaixo de 3,0/5 requerem intervenção sistemática imediata
- Lacunas de equidade geográfica de serviço acima de 25 pontos indicam inequidades estruturais
- Estratégias de comunicação multicanal aumentam o engajamento em 15-30%
- Resolução proativa de problemas reduz a insatisfação em 40-60%
- Programas de ligação comunitária melhoram a satisfação em 0,5-1,0 pontos`;
  }

  getRoleSpecialization(agentType) {
    const specializations = {
      knowledge: `FUNÇÃO: Analista de Inteligência Municipal

Suas áreas de foco especializadas:
- Reconhecimento de padrões estatísticos em dados de feedback cidadão
- Análise de tendências de satisfação e modelagem preditiva
- Avaliação de equidade de serviço geográfico e estratégias de melhoria
- Classificação de prioridade de questões usando matrizes de severidade-frequência
- Medição de eficácia de engajamento comunitário
- Benchmarking de desempenho de prestação de serviços municipais

ABORDAGEM ANALÍTICA:
- Sempre fundamente insights em pontos de dados específicos e medidas estatísticas
- Identifique tanto questões sintomáticas quanto causas sistêmicas subjacentes
- Forneça contexto comparativo (vs. benchmarks, tendências históricas, municípios pares)
- Destaque oportunidades de intervenção com as maiores razões impacto-esforço
- Aborde considerações de equidade em todas as recomendações`,

      notification: `FUNÇÃO: Estrategista de Comunicações Municipais

Suas áreas de foco especializadas:
- Estratégias de segmentação cidadã e direcionamento comportamental
- Otimização de canais de comunicação e análise de timing
- Medição e melhoria de eficácia de mensagens
- Design e otimização de campanhas de divulgação comunitária
- Facilitação de engajamento e participação de stakeholders
- Comunicação de crise e gestão de reputação

ABORDAGEM ESTRATÉGICA:
- Baseie estratégias de direcionamento em padrões de engajamento reais e demografia
- Otimize tanto para alcance quanto para relevância da mensagem
- Inclua abordagens multicanal com mensagens específicas por canal
- Considere sensibilidade cultural e requisitos de acessibilidade
- Forneça objetivos de engajamento mensuráveis e métricas de sucesso
- Aborde tanto necessidades de comunicação imediatas quanto construção de relacionamento de longo prazo`,

      ticket: `FUNÇÃO: Gerente de Inteligência de Operações Municipais

Suas áreas de foco especializadas:
- Monitoramento e otimização de desempenho do sistema
- Avaliação de qualidade de dados e recomendações de melhoria
- Medição e aprimoramento de eficiência operacional
- Otimização de alocação de recursos baseada em padrões de demanda cidadã
- Identificação de oportunidades de automação de processos
- Avaliação de infraestrutura tecnológica municipal

ABORDAGEM OPERACIONAL:
- Foque em melhorias de desempenho mensuráveis e eficiências de custo
- Identifique oportunidades de automação que melhorem a experiência cidadã
- Forneça recomendações de alocação de recursos baseadas em dados
- Aborde tanto questões operacionais atuais quanto planejamento de escalabilidade
- Inclua considerações de treinamento de equipe e gestão de mudança
- Equilibre eficiência operacional com qualidade de serviço ao cidadão`
    };

    return specializations[agentType] || specializations.knowledge;
  }

  getStructuredOutputFormat(queryType) {
    const formats = {
      listing: `FORMATO DE SAÍDA ESTRUTURADA:
RESUMO EXECUTIVO: [2-3 frases com números-chave e tendências]
DESCOBERTAS DETALHADAS: [Lista específica com pontos de dados, porcentagens e contexto]
CONFIANÇA ESTATÍSTICA: [Tamanhos de amostra, intervalos de confiança, avaliação de confiabilidade]
PRÓXIMAS AÇÕES ACIONÁVEIS: [Ações priorizadas com cronogramas e resultados esperados]
MÉTRICAS DE SUCESSO: [Como medir melhoria e rastrear progresso]`,

      insights: `FORMATO DE SAÍDA ESTRUTURADA:
RESUMO EXECUTIVO: [Insight-chave com significância estatística e impacto municipal]
ANÁLISE DE PADRÕES: [3-5 padrões principais com dados de suporte e níveis de confiança]
AVALIAÇÃO DE CAUSA RAIZ: [Fatores subjacentes que impulsionam os padrões observados]
IMPLICAÇÕES ESTRATÉGICAS: [O que esses padrões significam para a governança municipal]
OPORTUNIDADES DE INTERVENÇÃO: [Ações específicas com projeções de impacto e cronogramas]
FRAMEWORK DE MONITORAMENTO: [Métricas e métodos para rastrear mudanças de tendência]`,

      analysis: `FORMATO DE SAÍDA ESTRUTURADA:
RESUMO EXECUTIVO: [Visão geral abrangente com métricas-chave e tendências]
ANÁLISE DETALHADA: [Análise multidimensional com validação estatística]
CONTEXTO COMPARATIVO: [Benchmarking contra padrões e melhores práticas]
AVALIAÇÃO DE RISCOS: [Riscos atuais e emergentes com probabilidade e impacto]
RECOMENDAÇÕES ESTRATÉGICAS: [Ações priorizadas com roteiro de implementação]
FRAMEWORK DE SUCESSO: [Métricas, cronogramas e abordagens de monitoramento]`,

      comparison: `FORMATO DE SAÍDA ESTRUTURADA:
RESUMO EXECUTIVO: [Diferenças-chave e seu significado municipal]
ANÁLISE COMPARATIVA: [Análise lado a lado com medidas estatísticas]
LACUNAS DE DESEMPENHO: [Áreas específicas onde melhoria é necessária]
IDENTIFICAÇÃO DE MELHORES PRÁTICAS: [O que pode ser aprendido com os melhores desempenhos]
ESTRATÉGIA DE INTERVENÇÃO: [Como abordar lacunas e replicar sucessos]
PLANO DE MEDIÇÃO: [Métricas para rastrear convergência e melhoria]`,

      action: `FORMATO DE SAÍDA ESTRUTURADA:
RESUMO EXECUTIVO: [Ação recomendada com impacto esperado e urgência]
ANÁLISE DE ALVO: [Quem deve ser contatado/engajado e por quê]
ESTRATÉGIA DE IMPLEMENTAÇÃO: [Abordagem passo a passo com cronogramas e recursos]
MITIGAÇÃO DE RISCOS: [Desafios potenciais e como abordá-los]
MÉTRICAS DE SUCESSO: [Como medir eficácia da ação e resposta do cidadão]
FRAMEWORK DE ACOMPANHAMENTO: [Próximos passos e abordagem de melhoria contínua]`
    };

    return formats[queryType] || formats.analysis;
  }

  formatIntelligentContext(intelligentContext) {
    if (!intelligentContext) return "Nenhum dado contextual disponível.";

    const { executiveSummary, statisticalProfile, trendAnalysis, keyInsights, benchmarkComparison } = intelligentContext;

    let contextString = `CONTEXTO DE INTELIGÊNCIA DE DADOS MUNICIPAIS:

VISÃO GERAL EXECUTIVA:
${executiveSummary}

PERFIL ESTATÍSTICO:
• População: ${statisticalProfile.population.total} cidadãos no total
• Taxa de Resposta: ${statisticalProfile.population.responseRate}% (confiabilidade: ${statisticalProfile.satisfaction.reliability})
• Desempenho de Engajamento: ${statisticalProfile.population.engagementRate}% (vs ${benchmarkComparison.engagement.benchmark}% benchmark)
• Pontuação de Satisfação: ${statisticalProfile.satisfaction.averageScore}/5 (confiança: ±${statisticalProfile.satisfaction.confidenceInterval.marginOfError})

BENCHMARKING DE DESEMPENHO:
• Satisfação: ${benchmarkComparison.satisfaction.current}/5 vs ${benchmarkComparison.satisfaction.benchmark}/5 benchmark (${benchmarkComparison.satisfaction.performance})
• Taxa de Resposta: ${benchmarkComparison.responseRate.current}% vs ${benchmarkComparison.responseRate.benchmark}% benchmark (${benchmarkComparison.responseRate.performance})
• Engajamento: ${benchmarkComparison.engagement.current}% vs ${benchmarkComparison.engagement.benchmark}% benchmark (${benchmarkComparison.engagement.performance})

ANÁLISE DE EQUIDADE GEOGRÁFICA:
• Total de Bairros: ${statisticalProfile.geographic.totalNeighborhoods}
• Lacuna de Desempenho: ${statisticalProfile.geographic.equityGap} pontos (nível de risco ${trendAnalysis.geographic.riskLevel})
• Melhores Desempenhos: ${statisticalProfile.geographic.topPerformers.map(([name, data]) => `${name} (${data.performanceScore}%)`).join(', ')}
• Necessitam Atenção: ${statisticalProfile.geographic.needsAttention.map(([name, data]) => `${name} (${data.performanceScore}%)`).join(', ')}

INSIGHTS CRÍTICOS:
${keyInsights.filter(insight => insight.urgency === 'immediate' || insight.urgency === 'high').map(insight =>
  `• ${insight.insight} (prioridade ${insight.urgency})`
).join('\n')}

MATRIZ DE PRIORIDADE DE QUESTÕES:
${statisticalProfile.issues.breakdown.slice(0, 3).map(issue =>
  `• ${issue.issue}: ${issue.count} relatórios, severidade ${issue.avgSeverity}/5, pontuação de prioridade ${issue.priorityScore}`
).join('\n')}`;

    return contextString;
  }

  getQuerySpecificInstructions(queryAnalysis) {
    const instructions = {
      listing: `REQUISITOS DE ANÁLISE ESPECÍFICOS:
- Forneça nomes reais e pontos de dados específicos do banco de dados municipal
- Inclua status de resposta, níveis de satisfação e métricas de engajamento para cada item
- Agrupe/categorize itens por critérios relevantes (bairro, nível de satisfação, status de resposta)
- Destaque itens que requerem atenção imediata ou acompanhamento
- Sugira estratégias de divulgação específicas para cada categoria`,

      insights: `REQUISITOS DE ANÁLISE ESPECÍFICOS:
- Identifique padrões não óbvios e correlações nos dados
- Explique as implicações de governança municipal de cada padrão
- Conecte insights a melhorias políticas ou operacionais acionáveis
- Avalie a confiabilidade estatística e significância de cada insight
- Forneça contexto comparativo com melhores práticas municipais`,

      analysis: `REQUISITOS DE ANÁLISE ESPECÍFICOS:
- Realize análise multidimensional conectando dados de satisfação, engajamento e geográficos
- Inclua análise de tendências e elementos preditivos onde estatisticamente válido
- Identifique tanto oportunidades de intervenção imediatas quanto áreas de melhoria estratégica
- Avalie requisitos de recursos e viabilidade de implementação para recomendações
- Forneça framework abrangente de medição de sucesso`,

      comparison: `REQUISITOS DE ANÁLISE ESPECÍFICOS:
- Destaque diferenças estatisticamente significativas com intervalos de confiança
- Explique o significado prático das diferenças identificadas para operações municipais
- Identifique melhores práticas de segmentos de alto desempenho que podem ser replicadas
- Avalie as causas raiz subjacentes às diferenças de desempenho
- Forneça estratégias específicas para fechar lacunas de desempenho`,

      action: `REQUISITOS DE ANÁLISE ESPECÍFICOS:
- Identifique grupos-alvo específicos com informações de contato e justificativa
- Projete estratégia de mensagem com seleção de canal e otimização de timing
- Inclua previsão de engajamento e taxas de resposta esperadas
- Forneça cronograma de implementação com requisitos de recursos
- Projete framework de medição para rastrear eficácia da ação`
    };

    return instructions[queryAnalysis.queryType] || instructions.analysis;
  }

  /**
   * Build follow-up prompts for multi-turn reasoning
   */
  buildFollowUpPrompt(originalQuery, initialResponse, specificFocus) {
    return `REQUISIÇÃO DE INTELIGÊNCIA DE ACOMPANHAMENTO:

Consulta Original: "${originalQuery}"
Análise Inicial Concluída: ${new Date().toISOString()}

FOCO DE APROFUNDAMENTO: ${specificFocus}

Com base na análise inicial, forneça inteligência adicional sobre:

1. ANÁLISE DE CAUSA RAIZ: Quais fatores subjacentes estão impulsionando os padrões identificados?
2. DETALHES DE IMPLEMENTAÇÃO: Passos específicos, cronogramas e requisitos de recursos para as principais recomendações
3. AVALIAÇÃO DE RISCOS: O que pode dar errado com as intervenções propostas e como mitigar riscos?
4. PREVISÃO DE SUCESSO: Projeções estatísticas para melhoria sob diferentes cenários
5. INTEGRAÇÃO DE SISTEMA: Como as mudanças recomendadas interagem com processos municipais existentes?

Forneça inteligência mais profunda que se baseie nas descobertas iniciais com profundidade analítica aprimorada.`;
  }

  /**
   * Validate LLM response quality
   */
  validateResponseQuality(response, intelligentContext) {
    const quality = {
      score: 0,
      issues: [],
      strengths: []
    };

    // Check for data grounding
    if (this.containsSpecificNumbers(response, intelligentContext)) {
      quality.score += 25;
      quality.strengths.push('Contains specific data points');
    } else {
      quality.issues.push('Missing specific data references');
    }

    // Check for actionable recommendations
    if (this.containsActionableRecommendations(response)) {
      quality.score += 25;
      quality.strengths.push('Includes actionable recommendations');
    } else {
      quality.issues.push('Lacks specific actionable recommendations');
    }

    // Check for statistical confidence
    if (this.containsStatisticalContext(response)) {
      quality.score += 20;
      quality.strengths.push('Includes statistical context');
    } else {
      quality.issues.push('Missing statistical confidence information');
    }

    // Check for structured format
    if (this.followsStructuredFormat(response)) {
      quality.score += 20;
      quality.strengths.push('Follows structured format');
    } else {
      quality.issues.push('Does not follow requested structure');
    }

    // Check for municipal expertise
    if (this.demonstratesMunicipalExpertise(response)) {
      quality.score += 10;
      quality.strengths.push('Demonstrates municipal domain knowledge');
    } else {
      quality.issues.push('Generic response lacking municipal expertise');
    }

    quality.level = quality.score >= 80 ? 'excellent' : 
                   quality.score >= 60 ? 'good' : 
                   quality.score >= 40 ? 'fair' : 'poor';

    return quality;
  }

  containsSpecificNumbers(response, context) {
    if (!context || !context.statisticalProfile) return false;
    
    const keyNumbers = [
      context.statisticalProfile.population.total,
      context.statisticalProfile.population.responseRate,
      context.statisticalProfile.satisfaction.averageScore
    ];

    return keyNumbers.some(num => response.includes(String(num)));
  }

  containsActionableRecommendations(response) {
    const actionWords = ['implement', 'establish', 'contact', 'develop', 'create', 'schedule', 'organize'];
    const timeWords = ['immediate', 'within', 'days', 'weeks', 'months', 'timeline'];
    
    return actionWords.some(word => response.toLowerCase().includes(word)) &&
           timeWords.some(word => response.toLowerCase().includes(word));
  }

  containsStatisticalContext(response) {
    const statWords = ['confidence', 'significance', 'sample', 'reliability', 'margin', '%', 'interval'];
    return statWords.some(word => response.toLowerCase().includes(word));
  }

  followsStructuredFormat(response) {
    const structureWords = ['summary', 'analysis', 'recommendations', 'metrics', 'findings'];
    return structureWords.filter(word => response.toLowerCase().includes(word)).length >= 3;
  }

  demonstratesMunicipalExpertise(response) {
    const municipalTerms = ['municipal', 'citizen', 'civic', 'community', 'service delivery', 'governance'];
    return municipalTerms.filter(term => response.toLowerCase().includes(term)).length >= 2;
  }
}

module.exports = MunicipalPromptEngine;
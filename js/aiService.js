/**
 * Serviço de Integração com Inteligência Artificial para Geração de Quizzes
 * Suporta Google Gemini API (com auto-detecção de modelos e fallback resiliente)
 */

const STORAGE_API_KEY = 'QUIZMASTER_AI_API_KEY';
const STORAGE_AI_PROVIDER = 'QUIZMASTER_AI_PROVIDER';

// Lista de modelos Gemini suportados em ordem de preferência
const GEMINI_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-pro'
];

export class AIService {
  constructor() {
    this.apiKey = localStorage.getItem(STORAGE_API_KEY) || '';
    this.provider = localStorage.getItem(STORAGE_AI_PROVIDER) || 'gemini';
    this.cachedWorkingModel = null;
  }

  getApiKey() {
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    this.cachedWorkingModel = null;
    localStorage.setItem(STORAGE_API_KEY, this.apiKey);
  }

  getProvider() {
    return this.provider;
  }

  setProvider(provider) {
    this.provider = provider;
    localStorage.setItem(STORAGE_AI_PROVIDER, provider);
  }

  /**
   * Gera um conjunto de perguntas usando a I.A selecionada
   */
  async generateQuiz({ topic, baseText, count = 5, difficulty = 'Misto', format = 'multiple_choice', category = 'Geral' }) {
    if (!this.apiKey) {
      throw new Error('Por favor, informe sua chave de API para utilizar a I.A.');
    }

    let systemInstruction = '';
    let userPrompt = '';

    if (format === 'fact_fake') {
      systemInstruction = `Você é um Especialista em Gamificação Educacional e Quizmaster Sênior. 
Seu objetivo é criar um quiz interativo no formato "FATO OU FAKE" (Verdadeiro ou Falso / Mitos e Fatos).
Cada item deve ser uma frase ou afirmação provocativa, instigante e clara, na qual o estudante precisa decidir se é FATO (verdadeiro) ou FAKE (mito/falso).
Para cada questão:
- "question": "A afirmação/frase para avaliar (sem dar a resposta no texto)"
- "type": "fact_fake"
- "options": ["Fato", "Fake"]
- "correctAnswer": 0 (se for Fato/Verdadeiro) ou 1 (se for Fake/Falso)
- "curiosity": "Explicação científica, factual ou histórica de 1 a 2 frases comprovando a verdade ou desmistificando a mentira."

Você DEVE responder ESTRITAMENTE em formato JSON puro no seguinte formato:
{
  "title": "Título instigante para o Quiz Fato ou Fake",
  "author": "I.A QuizMaster",
  "questions": [
    {
      "question": "Texto da afirmação a ser julgada?",
      "type": "fact_fake",
      "category": "Nome da Categoria/Matéria",
      "difficulty": "Fácil|Médio|Difícil",
      "options": ["Fato", "Fake"],
      "correctAnswer": 0,
      "curiosity": "Explicação detalhada comprovando o fato ou desmentindo o fake."
    }
  ]
}`;

      userPrompt = `Crie exatamente ${count} afirmações de FATO OU FAKE.
Tema principal: ${topic}
${baseText ? `\nTexto base de referência:\n"""\n${baseText}\n"""\n` : ''}
Nível de dificuldade solicitado: ${difficulty} (Se for Misto, faça progressão: afirmações fáceis no começo e mitos mais sutis no final).
Categoria padrão: ${category}
Equilibre entre fatos reais surpreendentes (correctAnswer: 0) e mitos populares comuns (correctAnswer: 1).`;

    } else if (format === 'mixed') {
      systemInstruction = `Você é um Especialista em Gamificação Educacional e Quizmaster Sênior. 
Seu objetivo é criar um quiz variado contendo tanto perguntas de MÚLTIPLA ESCOLHA (4 alternativas) quanto afirmações de FATO OU FAKE (2 opções).
Para perguntas de Múltipla Escolha: "type": "multiple_choice", "options": ["A", "B", "C", "D"], "correctAnswer": 0..3.
Para afirmações de Fato ou Fake: "type": "fact_fake", "options": ["Fato", "Fake"], "correctAnswer": 0 (Fato) ou 1 (Fake).

Você DEVE responder ESTRITAMENTE em formato JSON puro no seguinte formato:
{
  "title": "Título criativo para o Quiz",
  "author": "I.A QuizMaster",
  "questions": [
    {
      "question": "Texto da pergunta ou afirmação",
      "type": "multiple_choice|fact_fake",
      "category": "Nome da Categoria/Matéria",
      "difficulty": "Fácil|Médio|Difícil",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": 0,
      "curiosity": "Curiosidade didática de 1 ou 2 frases explicando o contexto."
    }
  ]
}`;

      userPrompt = `Crie exatamente ${count} questões mesclando perguntas de Múltipla Escolha e afirmações de Fato ou Fake.
Tema principal: ${topic}
${baseText ? `\nTexto base de referência:\n"""\n${baseText}\n"""\n` : ''}
Nível de dificuldade: ${difficulty}.
Categoria padrão: ${category}.`;

    } else {
      // Padrão: Múltipla Escolha (4 Alternativas)
      systemInstruction = `Você é um Especialista em Gamificação Educacional e Quizmaster Sênior. 
Seu objetivo é criar um quiz educativo, instigante, sem ambiguidades e com 4 alternativas por questão (A, B, C, D), indicando o índice da resposta correta (0 para A, 1 para B, 2 para C, 3 para D) e uma breve pílula de curiosidade didática de 1 a 2 frases para cada pergunta.

Você DEVE responder ESTRITAMENTE em formato JSON puro no seguinte formato:
{
  "title": "Título criativo para o Quiz",
  "author": "I.A QuizMaster",
  "questions": [
    {
      "question": "Texto da pergunta?",
      "type": "multiple_choice",
      "category": "Nome da Categoria/Matéria",
      "difficulty": "Fácil|Médio|Difícil",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": 0,
      "curiosity": "Curiosidade didática de 1 ou 2 frases explicando o contexto da resposta."
    }
  ]
}`;

      userPrompt = `Crie exatamente ${count} perguntas de múltipla escolha.
Tema principal: ${topic}
${baseText ? `\nTexto base de referência:\n"""\n${baseText}\n"""\n` : ''}
Nível de dificuldade solicitado: ${difficulty} (Se for Misto, faça progressão: perguntas iniciais Fáceis, intermediárias Médias e finais Difíceis).
Categoria padrão: ${category}
Lembre-se: Todas as perguntas devem ter 4 alternativas sem pegadinhas inúteis e com uma curiosidade explicativa.`;
    }

    if (this.provider === 'gemini') {
      return await this.callGeminiWithFallback(systemInstruction, userPrompt, format);
    } else {
      return await this.callOpenAICompatibleAPI(systemInstruction, userPrompt, format);
    }
  }

  /**
   * Chamada resiliente à API do Google Gemini com teste automático de modelos
   */
  async callGeminiWithFallback(systemInstruction, userPrompt, format = 'multiple_choice') {
    // 1. Se já sabemos um modelo que funciona nesta sessão, tenta ele primeiro
    const modelsToTry = this.cachedWorkingModel 
      ? [this.cachedWorkingModel, ...GEMINI_CANDIDATE_MODELS.filter(m => m !== this.cachedWorkingModel)]
      : [...GEMINI_CANDIDATE_MODELS];

    let lastError = null;

    // Tenta primeiro descobrir a lista oficial de modelos disponíveis para a chave do usuário
    try {
      const availableModels = await this.fetchAvailableGeminiModels();
      if (availableModels.length > 0) {
        // Coloca os modelos disponíveis no início da fila
        modelsToTry.unshift(...availableModels.filter(m => !modelsToTry.includes(m)));
      }
    } catch (e) {
      console.warn('Não foi possível listar modelos via ListModels, usando lista estática de candidatos:', e);
    }

    for (const model of modelsToTry) {
      try {
        console.log(`Tentando gerar quiz com o modelo Gemini: ${model}...`);
        const result = await this.trySingleGeminiModel(model, systemInstruction, userPrompt, format);
        this.cachedWorkingModel = model;
        console.log(`Sucesso com o modelo Gemini: ${model}`);
        return result;
      } catch (err) {
        console.warn(`Modelo ${model} falhou:`, err.message);
        lastError = err;
        // Se o erro for de autenticação (400 ou 403 API key inválida), não adianta tentar outros modelos
        if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('403') || err.message.includes('API key not valid'))) {
          throw new Error('Sua chave de API do Google Gemini é inválida ou expirou. Verifique sua chave no Google AI Studio.');
        }
      }
    }

    throw new Error(lastError ? lastError.message : 'Nenhum modelo Gemini compatível pôde ser acessado com sua chave de API.');
  }

  /**
   * Lista os modelos compatíveis com generateContent para a chave informada
   */
  async fetchAvailableGeminiModels() {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(this.apiKey)}`;
    const res = await fetch(listUrl);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) return [];

    return data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
  }

  /**
   * Executa a requisição para um modelo Gemini específico
   */
  async trySingleGeminiModel(model, systemInstruction, userPrompt, format = 'multiple_choice') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemInstruction + '\n\n' + userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error && errData.error.message ? errData.error.message : response.statusText;
      throw new Error(`(${response.status}) ${errMsg}`);
    }

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    const textOutput = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;

    if (!textOutput) {
      throw new Error('A I.A não retornou uma resposta válida.');
    }

    return this.parseAndValidateQuizResponse(textOutput, format);
  }

  /**
   * Chamada à API compatível com OpenAI (OpenAI, Groq, Ollama)
   */
  async callOpenAICompatibleAPI(systemInstruction, userPrompt, format = 'multiple_choice') {
    const url = 'https://api.openai.com/v1/chat/completions';

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error && errData.error.message ? errData.error.message : response.statusText;
      throw new Error(`Erro na API OpenAI (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const textOutput = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!textOutput) {
      throw new Error('A I.A não retornou nenhuma resposta.');
    }

    return this.parseAndValidateQuizResponse(textOutput, format);
  }

  /**
   * Faz o parse seguro do JSON e normaliza os dados retornados pela I.A
   */
  parseAndValidateQuizResponse(jsonString, requestedFormat = 'multiple_choice') {
    let cleanJson = jsonString.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Procura o primeiro { e o último } caso haja texto ao redor
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleanJson);
    const questionsRaw = parsed.questions || (Array.isArray(parsed) ? parsed : []);

    if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
      throw new Error('O formato retornado pela I.A não contém uma lista válida de perguntas.');
    }

    const validatedQuestions = questionsRaw.map((q, idx) => {
      // 1. Detecta se a questão é Fato ou Fake
      const isFactFake = requestedFormat === 'fact_fake' || 
                         q.type === 'fact_fake' || 
                         q.type === 'boolean' || 
                         (Array.isArray(q.options) && q.options.length === 2);

      let correctIdx = 0;
      if (typeof q.correctAnswer === 'number') {
        correctIdx = q.correctAnswer;
      } else if (typeof q.correctAnswer === 'string') {
        const clean = q.correctAnswer.trim().toUpperCase();
        if (clean === 'FATO' || clean === 'VERDADEIRO' || clean === 'V' || clean === 'TRUE' || clean === 'A' || clean === '0') {
          correctIdx = 0;
        } else if (clean === 'FAKE' || clean === 'FALSO' || clean === 'F' || clean === 'FALSE' || clean === 'B' || clean === '1') {
          correctIdx = 1;
        } else if (clean === 'C' || clean === '2') {
          correctIdx = 2;
        } else if (clean === 'D' || clean === '3') {
          correctIdx = 3;
        }
      }

      if (isFactFake) {
        return {
          id: idx + 1,
          type: 'fact_fake',
          question: q.question || `Afirmação #${idx + 1}`,
          category: q.category || 'Geral',
          difficulty: q.difficulty || 'Médio',
          options: (Array.isArray(q.options) && q.options.length === 2) ? q.options : ['Fato', 'Fake'],
          correctAnswer: correctIdx === 1 ? 1 : 0,
          curiosity: q.curiosity || 'Explicação didática gerada por Inteligência Artificial.'
        };
      } else {
        return {
          id: idx + 1,
          type: 'multiple_choice',
          question: q.question || `Pergunta #${idx + 1}`,
          category: q.category || 'Geral',
          difficulty: q.difficulty || 'Médio',
          options: Array.isArray(q.options) && q.options.length >= 4 
            ? q.options.slice(0, 4) 
            : (Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Opção A', 'Opção B', 'Opção C', 'Opção D']),
          correctAnswer: Math.max(0, Math.min(3, correctIdx)),
          curiosity: q.curiosity || 'Explicação didática gerada por Inteligência Artificial.'
        };
      }
    });

    return {
      title: parsed.title || 'Quiz Gerado por I.A',
      author: parsed.author || 'I.A QuizMaster',
      questions: validatedQuestions
    };
  }
}

export const aiService = new AIService();

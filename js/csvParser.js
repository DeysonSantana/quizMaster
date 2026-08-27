/**
 * Módulo de Parser e Validação de arquivos CSV para o QuizMaster
 */

export function parseCSV(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('O arquivo CSV está vazio.');
  }

  // Detecta delimitador (, ou ;)
  const firstLine = text.split(/\r\n|\n/)[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  // Parse manual de linhas respeitando aspas e quebras de linha
  const rows = parseCSVRows(text, delimiter);

  if (rows.length < 2) {
    throw new Error('O arquivo CSV deve conter um cabeçalho e pelo menos uma linha de pergunta.');
  }

  const rawHeaders = rows[0].map(h => normalizeHeader(h));
  const expectedCols = ['pergunta', 'categoria', 'dificuldade', 'opcaoa', 'opcaob', 'opcaoc', 'opcaod', 'respostacorreta'];

  // Mapeamento dos índices
  const headerMap = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  // Validação dos cabeçalhos mínimos
  const missingCols = expectedCols.filter(col => headerMap[col] === undefined);
  if (missingCols.length > 0) {
    throw new Error(
      `Cabeçalho inválido. Colunas ausentes ou com nomes incorretos: ${missingCols.join(', ')}.\n` +
      `Use o modelo: Pergunta, Categoria, Dificuldade, OpcaoA, OpcaoB, OpcaoC, OpcaoD, RespostaCorreta, Curiosidade`
    );
  }

  const curiosityIdx = headerMap['curiosidade'] !== undefined ? headerMap['curiosidade'] : -1;

  const parsedQuestions = [];
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Ignora linhas totalmente vazias
    if (row.length === 0 || (row.length === 1 && row[0].trim() === '')) {
      continue;
    }

    const lineNum = i + 1;
    const questionText = (row[headerMap['pergunta']] || '').trim();
    const category = (row[headerMap['categoria']] || 'Geral').trim();
    let difficulty = (row[headerMap['dificuldade']] || 'Médio').trim();
    
    // Normaliza dificuldade
    const diffLower = difficulty.toLowerCase();
    if (diffLower.includes('f') || diffLower.includes('easy')) difficulty = 'Fácil';
    else if (diffLower.includes('d') || diffLower.includes('hard') || diffLower.includes('dif')) difficulty = 'Difícil';
    else difficulty = 'Médio';

    const optA = (row[headerMap['opcaoa']] || '').trim();
    const optB = (row[headerMap['opcaob']] || '').trim();
    const optC = (row[headerMap['opcaoc']] || '').trim();
    const optD = (row[headerMap['opcaod']] || '').trim();
    const rawCorrect = (row[headerMap['respostacorreta']] || '').trim();
    const curiosity = curiosityIdx !== -1 && row[curiosityIdx] ? row[curiosityIdx].trim() : 'Sem curiosidade adicional informada.';

    // Validações
    if (!questionText) {
      errors.push(`Linha ${lineNum}: O texto da pergunta está vazio.`);
      continue;
    }
    if (!optA || !optB || !optC || !optD) {
      errors.push(`Linha ${lineNum}: Todas as 4 opções (A, B, C, D) devem estar preenchidas.`);
      continue;
    }

    // Identifica resposta correta
    const correctIndex = parseCorrectAnswer(rawCorrect, [optA, optB, optC, optD]);
    if (correctIndex === -1) {
      errors.push(`Linha ${lineNum}: Resposta correta "${rawCorrect}" inválida. Utilize 'A', 'B', 'C', 'D' ou o número 1 a 4.`);
      continue;
    }

    parsedQuestions.push({
      id: parsedQuestions.length + 1,
      question: questionText,
      category: category,
      difficulty: difficulty,
      options: [optA, optB, optC, optD],
      correctAnswer: correctIndex,
      curiosity: curiosity
    });
  }

  if (errors.length > 0 && parsedQuestions.length === 0) {
    throw new Error(`Falha na importação do CSV:\n- ${errors.slice(0, 5).join('\n- ')}`);
  }

  return {
    questions: parsedQuestions,
    warnings: errors
  };
}

/**
 * Faz o parsing detalhado de linhas e colunas CSV considerando aspas e quebras de linha
 */
function parseCSVRows(text, delimiter) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // pula a aspa duplicada escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal);
      currentVal = '';
      if (currentRow.some(val => val.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal);
    if (currentRow.some(val => val.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normaliza cabeçalho removendo acentos, espaços e caracteres especiais
 */
function normalizeHeader(h) {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Identifica o índice da resposta correta (0 = A, 1 = B, 2 = C, 3 = D)
 */
function parseCorrectAnswer(val, options) {
  const clean = val.trim().toUpperCase();
  
  if (clean === 'A' || clean === '1') return 0;
  if (clean === 'B' || clean === '2') return 1;
  if (clean === 'C' || clean === '3') return 2;
  if (clean === 'D' || clean === '4') return 3;
  if (clean === '0') return 0;

  // Busca exata pelo texto de uma das opções
  const matchIndex = options.findIndex(opt => opt.trim().toLowerCase() === val.trim().toLowerCase());
  return matchIndex;
}

/**
 * Retorna o conteúdo de um arquivo CSV de exemplo / modelo pronto para download
 */
export function generateCSVTemplate() {
  const headers = [
    'Pergunta',
    'Categoria',
    'Dificuldade',
    'OpcaoA',
    'OpcaoB',
    'OpcaoC',
    'OpcaoD',
    'RespostaCorreta',
    'Curiosidade'
  ];

  const sampleRows = [
    [
      'Qual planeta do Sistema Solar é conhecido como o Planeta Vermelho?',
      'Ciência e Tecnologia',
      'Fácil',
      'Vênus',
      'Júpiter',
      'Marte',
      'Mercúrio',
      'C',
      'A cor avermelhada de Marte ocorre devido ao óxido de ferro em sua superfície.'
    ],
    [
      'Qual é a capital oficial da França?',
      'Geografia',
      'Fácil',
      'Lyon',
      'Paris',
      'Marselha',
      'Nice',
      'B',
      'Paris ficou conhecida como Cidade Luz por ter sido pioneira na iluminação a gás.'
    ],
    [
      'A Queda da Bastilha ocorreu em qual ano?',
      'História',
      'Médio',
      '1776',
      '1789',
      '1799',
      '1804',
      'B',
      'O evento de 14 de julho de 1789 marcou simbolicamente o início da Revolução Francesa.'
    ],
    [
      'Qual banda lançou o álbum The Dark Side of the Moon em 1973?',
      'Arte e Cultura Pop',
      'Médio',
      'Led Zeppelin',
      'The Rolling Stones',
      'Queen',
      'Pink Floyd',
      'D',
      'O álbum permaneceu por mais de 900 semanas consecutivas nas paradas da Billboard.'
    ],
    [
      'Quem foi a primeira cientista a ganhar dois Prêmios Nobel em áreas científicas distintas?',
      'Ciência e Tecnologia',
      'Difícil',
      'Albert Einstein',
      'Marie Curie',
      'Linus Pauling',
      'Niels Bohr',
      'B',
      'Marie Curie venceu o Nobel de Física em 1903 e o de Química em 1911.'
    ]
  ];

  const formatRow = row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',');
  return [formatRow(headers), ...sampleRows.map(formatRow)].join('\r\n');
}

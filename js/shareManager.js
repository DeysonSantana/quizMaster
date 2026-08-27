/**
 * Módulo de Compartilhamento de Quiz via URL e QR Code
 */
import { generateQRCodeCanvas } from './qrcodeEngine.js';

/**
 * Compacta a estrutura de dados do quiz para reduzir tamanho do payload
 */
function minifyQuizPayload(quizData) {
  return {
    t: quizData.title || 'Quiz Personalizado',
    u: quizData.author || 'Criador',
    q: (quizData.questions || []).map(item => [
      item.question || '',
      item.category || 'Geral',
      item.difficulty || 'Fácil',
      item.options || ['', '', '', ''],
      typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
      item.curiosity || ''
    ])
  };
}

/**
 * Restaura a estrutura completa do quiz a partir da versão compactada
 */
function unminifyQuizPayload(minified) {
  // Se já estiver no formato completo
  if (minified.questions && Array.isArray(minified.questions)) {
    return minified;
  }

  const title = minified.t || minified.title || 'Quiz Personalizado';
  const author = minified.u || minified.author || 'Criador';
  const rawQuestions = minified.q || minified.questions || [];

  const questions = rawQuestions.map((item, idx) => {
    if (Array.isArray(item)) {
      return {
        id: idx + 1,
        question: item[0] || '',
        category: item[1] || 'Geral',
        difficulty: item[2] || 'Fácil',
        options: Array.isArray(item[3]) ? item[3] : ['', '', '', ''],
        correctAnswer: typeof item[4] === 'number' ? item[4] : 0,
        curiosity: item[5] || 'Resposta correta registrada!'
      };
    } else {
      return {
        id: item.id || (idx + 1),
        question: item.question || item.q || '',
        category: item.category || item.c || 'Geral',
        difficulty: item.difficulty || item.d || 'Fácil',
        options: item.options || item.o || ['', '', '', ''],
        correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : (typeof item.a === 'number' ? item.a : 0),
        curiosity: item.curiosity || item.cur || 'Resposta correta registrada!'
      };
    }
  });

  return {
    title: title,
    author: author,
    questions: questions
  };
}

/**
 * Codifica o objeto do quiz em uma string compactada e segura para URL
 */
export function encodeQuizToUrl(quizData) {
  try {
    const minified = minifyQuizPayload(quizData);
    const jsonStr = JSON.stringify(minified);
    let encoded = '';
    
    if (window.LZString && typeof window.LZString.compressToEncodedURIComponent === 'function') {
      encoded = window.LZString.compressToEncodedURIComponent(jsonStr);
    } else {
      // Fallback para Base64 URL-safe com UTF-8
      encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    }

    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    return `${baseUrl}#quiz=${encoded}`;
  } catch (err) {
    console.error('Erro ao codificar quiz para URL:', err);
    const fallbackBaseUrl = window.location.href.split('#')[0].split('?')[0];
    return `${fallbackBaseUrl}#quiz=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(quizData)))))}`;
  }
}

/**
 * Decodifica o quiz a partir do hash ou parâmetro da URL
 */
export function decodeQuizFromUrl() {
  try {
    const hash = window.location.hash;
    let payload = '';

    if (hash && hash.startsWith('#quiz=')) {
      payload = hash.replace('#quiz=', '');
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      payload = urlParams.get('quiz');
    }

    if (!payload) return null;

    let jsonStr = '';
    if (window.LZString && typeof window.LZString.decompressFromEncodedURIComponent === 'function') {
      jsonStr = window.LZString.decompressFromEncodedURIComponent(payload);
    }

    // Se o LZString falhar ou retornar nulo, tenta fallback Base64
    if (!jsonStr) {
      try {
        jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(payload))));
      } catch (e) {
        try {
          jsonStr = atob(payload);
        } catch (e2) {
          jsonStr = '';
        }
      }
    }

    if (!jsonStr) return null;

    const parsedData = JSON.parse(jsonStr);
    const fullQuiz = unminifyQuizPayload(parsedData);
    
    if (!fullQuiz || !Array.isArray(fullQuiz.questions) || fullQuiz.questions.length === 0) {
      return null;
    }

    return fullQuiz;
  } catch (err) {
    console.warn('Erro ao decodificar quiz da URL:', err);
    return null;
  }
}

/**
 * Renderiza o QR Code do link gerado no elemento desejado usando motor Canvas nativo
 */
export function renderQRCode(containerElement, url) {
  if (!containerElement) return;
  containerElement.innerHTML = '';

  try {
    // Utiliza o motor local de alta capacidade
    const canvas = generateQRCodeCanvas(url, 180);
    containerElement.appendChild(canvas);
  } catch (err) {
    console.warn('Motor local de QR Code gerou aviso, tentando fallback:', err);
    // Fallback externo caso necessário
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
    img.alt = 'QR Code do Quiz';
    img.className = 'w-[180px] h-[180px] rounded-lg shadow-sm mx-auto bg-white p-1';
    img.onerror = () => {
      containerElement.innerHTML = `
        <div class="w-[180px] h-[180px] flex flex-col items-center justify-center bg-gray-100 rounded-lg text-gray-700 p-2 text-center text-xs font-medium">
          <span>🔗 Link gerado com sucesso!</span>
          <span class="text-[10px] text-gray-500 mt-1">Utilize o botão "Copiar" abaixo.</span>
        </div>
      `;
    };
    containerElement.appendChild(img);
  }
}

/**
 * Copia texto para a área de transferência com múltiplos fallbacks
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('navigator.clipboard falhou, tentando fallback textarea...');
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Falha ao copiar texto:', err);
    return false;
  }
}

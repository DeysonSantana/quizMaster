/**
 * Controlador do Modal de Geração de Quizzes com Inteligência Artificial
 */
import { aiService } from './aiService.js';
import { soundFx } from './audio.js';

export class AIQuizModal {
  constructor(builder) {
    this.builder = builder;
    this.loadingInterval = null;

    this.dom = {
      aiModal: document.getElementById('ai-quiz-modal'),
      openAiHeaderBtn: document.getElementById('open-ai-modal-btn'),
      openAiBuilderBtn: document.getElementById('builder-ai-btn'),
      closeAiModalBtn: document.getElementById('close-ai-modal-btn'),
      cancelAiModalBtn: document.getElementById('cancel-ai-modal-btn'),
      generateAiQuizBtn: document.getElementById('generate-ai-quiz-btn'),

      // Inputs
      apiKeyInput: document.getElementById('ai-api-key-input'),
      toggleKeyVisibilityBtn: document.getElementById('toggle-key-visibility-btn'),
      saveApiKeyBtn: document.getElementById('save-api-key-btn'),
      aiKeyStatus: document.getElementById('ai-key-status'),
      topicInput: document.getElementById('ai-topic-input'),
      baseTextInput: document.getElementById('ai-base-text'),
      countSelect: document.getElementById('ai-count-select'),
      difficultySelect: document.getElementById('ai-difficulty-select'),
      suggestionTags: document.querySelectorAll('.ai-suggestion-tag'),

      // Loading & Feedback
      loadingContainer: document.getElementById('ai-loading-container'),
      loadingStepText: document.getElementById('ai-loading-step-text'),
      errorMsg: document.getElementById('ai-error-msg')
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateKeyStatusUI();
  }

  bindEvents() {
    // Abrir modal a partir do Header
    if (this.dom.openAiHeaderBtn) {
      this.dom.openAiHeaderBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openModal();
      });
    }

    // Abrir modal a partir do Construtor de Quiz
    if (this.dom.openAiBuilderBtn) {
      this.dom.openAiBuilderBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openModal();
      });
    }

    // Fechar modal
    if (this.dom.closeAiModalBtn) {
      this.dom.closeAiModalBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.dom.cancelAiModalBtn) {
      this.dom.cancelAiModalBtn.addEventListener('click', () => this.closeModal());
    }

    // Salvar Chave de API
    if (this.dom.saveApiKeyBtn) {
      this.dom.saveApiKeyBtn.addEventListener('click', () => {
        soundFx.playClick();
        const key = this.dom.apiKeyInput.value.trim();
        if (key) {
          aiService.setApiKey(key);
          this.updateKeyStatusUI();
          this.showError('');
        } else {
          this.showError('Insira uma chave de API válida.');
        }
      });
    }

    // Alternar visibilidade da chave
    if (this.dom.toggleKeyVisibilityBtn) {
      this.dom.toggleKeyVisibilityBtn.addEventListener('click', () => {
        const type = this.dom.apiKeyInput.type === 'password' ? 'text' : 'password';
        this.dom.apiKeyInput.type = type;
        this.dom.toggleKeyVisibilityBtn.innerHTML = type === 'password' 
          ? `<i data-lucide="eye" class="w-4 h-4"></i>`
          : `<i data-lucide="eye-off" class="w-4 h-4 text-purple-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Tags de sugestão rápida
    this.dom.suggestionTags.forEach(tag => {
      tag.addEventListener('click', () => {
        soundFx.playClick();
        const topic = tag.getAttribute('data-topic');
        if (topic) {
          this.dom.topicInput.value = topic;
          this.dom.topicInput.focus();
        }
      });
    });

    // Botão Gerar Quiz com I.A
    if (this.dom.generateAiQuizBtn) {
      this.dom.generateAiQuizBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.handleGenerate();
      });
    }
  }

  openModal() {
    this.dom.apiKeyInput.value = aiService.getApiKey();
    this.updateKeyStatusUI();
    this.dom.errorMsg.classList.add('hidden');
    this.dom.loadingContainer.classList.add('hidden');
    this.dom.aiModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeModal() {
    clearInterval(this.loadingInterval);
    this.dom.aiModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  updateKeyStatusUI() {
    const key = aiService.getApiKey();
    if (this.dom.aiKeyStatus) {
      if (key) {
        this.dom.aiKeyStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> <span class="text-emerald-400 font-semibold">Chave de API salva e configurada!</span>`;
      } else {
        this.dom.aiKeyStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> <span class="text-amber-300">Chave de API necessária para gerar com I.A</span>`;
      }
    }
  }

  showError(msg) {
    if (this.dom.errorMsg) {
      if (msg) {
        this.dom.errorMsg.innerHTML = msg;
        this.dom.errorMsg.classList.remove('hidden');
      } else {
        this.dom.errorMsg.classList.add('hidden');
      }
    }
  }

  startLoadingAnimation() {
    this.dom.loadingContainer.classList.remove('hidden');
    this.dom.generateAiQuizBtn.disabled = true;
    this.dom.generateAiQuizBtn.classList.add('opacity-60', 'cursor-not-allowed');

    const steps = [
      '🔍 Analisando tema e contexto pedagógico...',
      '📝 Criando perguntas e alternativas balanceadas...',
      '💡 Gerando pílulas de curiosidade explicativas...',
      '✨ Quase pronto! Formatando dados do Quiz...'
    ];

    let stepIdx = 0;
    this.dom.loadingStepText.textContent = steps[0];

    this.loadingInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      this.dom.loadingStepText.textContent = steps[stepIdx];
    }, 2200);
  }

  stopLoadingAnimation() {
    clearInterval(this.loadingInterval);
    this.dom.loadingContainer.classList.add('hidden');
    this.dom.generateAiQuizBtn.disabled = false;
    this.dom.generateAiQuizBtn.classList.remove('opacity-60', 'cursor-not-allowed');
  }

  async handleGenerate() {
    const topic = this.dom.topicInput.value.trim();
    const baseText = this.dom.baseTextInput.value.trim();
    const count = parseInt(this.dom.countSelect.value, 10) || 5;
    const difficulty = this.dom.difficultySelect.value;
    const key = this.dom.apiKeyInput.value.trim();

    if (key && key !== aiService.getApiKey()) {
      aiService.setApiKey(key);
      this.updateKeyStatusUI();
    }

    if (!aiService.getApiKey()) {
      this.showError('Por favor, informe sua <strong>chave da API Gemini</strong> no campo acima.<br><a href="https://aistudio.google.com/app/apikey" target="_blank" class="underline text-indigo-400">Clique aqui para obter uma chave gratuita no Google AI Studio.</a>');
      this.dom.apiKeyInput.focus();
      soundFx.playWrong();
      return;
    }

    if (!topic) {
      this.showError('Por favor, digite o <strong>tema ou assunto</strong> do quiz.');
      this.dom.topicInput.focus();
      soundFx.playWrong();
      return;
    }

    this.showError('');
    this.startLoadingAnimation();

    try {
      const quizResult = await aiService.generateQuiz({
        topic: topic,
        baseText: baseText,
        count: count,
        difficulty: difficulty
      });

      this.stopLoadingAnimation();
      this.closeModal();

      // Transfere o quiz gerado pela I.A diretamente para o construtor visual
      this.builder.openBuilderWithAIQuiz(quizResult);

      soundFx.playVictory();
      if (this.builder.app) {
        this.builder.app.triggerGrandConfetti();
      }

    } catch (err) {
      console.error('Erro na geração com I.A:', err);
      this.stopLoadingAnimation();
      this.showError(`❌ <strong>Falha na geração:</strong> ${err.message}`);
      soundFx.playWrong();
    }
  }
}

/**
 * Módulo do Criador Visual de Quiz e Gerenciador de Quizzes Salvos (LocalStorage)
 */
import { encodeQuizToUrl, renderQRCode, copyToClipboard } from './shareManager.js';
import { parseCSV, generateCSVTemplate } from './csvParser.js';
import { AIQuizModal } from './aiQuizModal.js';
import { soundFx } from './audio.js';

const STORAGE_KEY = 'QUIZMASTER_USER_QUIZZES';

export class QuizBuilder {
  constructor(app) {
    this.app = app;
    this.editingQuizId = null;

    // Elementos DOM
    this.dom = {
      builderModal: document.getElementById('quiz-builder-modal'),
      shareModal: document.getElementById('quiz-share-modal'),
      myQuizzesModal: document.getElementById('my-quizzes-modal'),

      // Builder Controls
      openBuilderBtn: document.getElementById('open-builder-btn'),
      closeBuilderBtn: document.getElementById('close-builder-btn'),
      cancelBuilderBtn: document.getElementById('cancel-builder-btn'),
      builderTitleInput: document.getElementById('builder-quiz-title'),
      builderAuthorInput: document.getElementById('builder-quiz-author'),
      builderQuestionsContainer: document.getElementById('builder-questions-container'),
      addQuestionBtn: document.getElementById('add-question-item-btn'),
      builderQuestionCountBadge: document.getElementById('builder-question-count-badge'),
      saveQuizBtn: document.getElementById('save-builder-quiz-btn'),
      builderErrorMsg: document.getElementById('builder-error-msg'),

      // Builder CSV & AI Controls
      builderCsvFileInput: document.getElementById('builder-csv-file-input'),
      builderCsvUploadBtn: document.getElementById('builder-csv-upload-btn'),
      builderCsvTemplateBtn: document.getElementById('builder-csv-template-btn'),
      builderAiBtn: document.getElementById('builder-ai-btn'),

      // Share Controls
      closeShareBtn: document.getElementById('close-share-btn'),
      shareQuizTitle: document.getElementById('share-quiz-title'),
      shareQuizInfo: document.getElementById('share-quiz-info'),
      shareUrlInput: document.getElementById('share-url-input'),
      copyShareUrlBtn: document.getElementById('copy-share-url-btn'),
      copyFeedback: document.getElementById('copy-feedback'),
      qrCodeContainer: document.getElementById('share-qrcode-container'),
      playSharedQuizBtn: document.getElementById('play-shared-quiz-btn'),
      shareCSVQuizBtn: document.getElementById('share-csv-quiz-btn'),
      headerShareBtn: document.getElementById('header-share-btn'),

      // My Quizzes Controls
      openMyQuizzesBtn: document.getElementById('open-my-quizzes-btn'),
      closeMyQuizzesBtn: document.getElementById('close-my-quizzes-btn'),
      myQuizzesListContainer: document.getElementById('my-quizzes-list-container'),
      createFirstQuizBtn: document.getElementById('create-first-quiz-btn')
    };

    this.init();
  }

  init() {
    this.aiModal = new AIQuizModal(this);
    this.bindEvents();
    this.bindBuilderCSVEvents();
  }

  bindEvents() {
    // Abrir criador
    if (this.dom.openBuilderBtn) {
      this.dom.openBuilderBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openBuilder();
      });
    }

    if (this.dom.createFirstQuizBtn) {
      this.dom.createFirstQuizBtn.addEventListener('click', () => {
        this.closeModal(this.dom.myQuizzesModal);
        this.openBuilder();
      });
    }

    // Fechar criador
    if (this.dom.closeBuilderBtn) {
      this.dom.closeBuilderBtn.addEventListener('click', () => this.closeModal(this.dom.builderModal));
    }
    if (this.dom.cancelBuilderBtn) {
      this.dom.cancelBuilderBtn.addEventListener('click', () => this.closeModal(this.dom.builderModal));
    }

    // Adicionar nova pergunta
    if (this.dom.addQuestionBtn) {
      this.dom.addQuestionBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.addQuestionCard();
        this.updateQuestionCount();
      });
    }

    // Salvar e Compartilhar Quiz Criado
    if (this.dom.saveQuizBtn) {
      this.dom.saveQuizBtn.addEventListener('click', (e) => {
        e.preventDefault();
        soundFx.playClick();
        this.saveAndShareQuiz();
      });
    }

    // Fechar Share Modal
    if (this.dom.closeShareBtn) {
      this.dom.closeShareBtn.addEventListener('click', () => this.closeModal(this.dom.shareModal));
    }

    // Copiar Link
    if (this.dom.copyShareUrlBtn) {
      this.dom.copyShareUrlBtn.addEventListener('click', async () => {
        soundFx.playClick();
        const url = this.dom.shareUrlInput.value;
        if (url) {
          const success = await copyToClipboard(url);
          if (success) {
            this.showCopyFeedback('Link copiado para a área de transferência! 🎉');
          } else {
            this.showCopyFeedback('Selecione e copie o texto acima manualmente (Ctrl+C).');
          }
        }
      });
    }

    // Jogar Quiz Compartilhado Imediatamente
    if (this.dom.playSharedQuizBtn) {
      this.dom.playSharedQuizBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeModal(this.dom.shareModal);
        if (this.currentShareQuizData && this.currentShareQuizData.questions && this.currentShareQuizData.questions.length > 0) {
          this.app.activeQuestions = this.currentShareQuizData.questions;
          this.app.isCustomQuiz = true;
          this.app.customFileName = this.currentShareQuizData.title || 'Quiz Personalizado';
          this.app.dom.quizSourceLabel.innerHTML = `<strong class="text-indigo-400">${this.app.customFileName}</strong> (${this.app.activeQuestions.length} perguntas)`;
          this.app.dom.resetDefaultQuizBtn.classList.remove('hidden');
          if (this.app.dom.shareCSVQuizBtn) {
            this.app.dom.shareCSVQuizBtn.classList.remove('hidden');
          }
        }
        this.app.startQuiz();
      });
    }

    // Botão de compartilhar o Quiz ativo (na barra de status)
    if (this.dom.shareCSVQuizBtn) {
      this.dom.shareCSVQuizBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.shareCurrentActiveQuiz();
      });
    }

    // Botão de compartilhar no Header
    if (this.dom.headerShareBtn) {
      this.dom.headerShareBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.shareCurrentActiveQuiz();
      });
    }

    // Abrir e Fechar Meus Quizzes
    if (this.dom.openMyQuizzesBtn) {
      this.dom.openMyQuizzesBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openMyQuizzes();
      });
    }
    if (this.dom.closeMyQuizzesBtn) {
      this.dom.closeMyQuizzesBtn.addEventListener('click', () => this.closeModal(this.dom.myQuizzesModal));
    }
  }

  shareCurrentActiveQuiz() {
    const questions = this.app.activeQuestions && this.app.activeQuestions.length > 0
      ? this.app.activeQuestions
      : this.app.defaultQuestions;

    let title = 'Quiz de Conhecimentos Gerais';
    if (this.app.isCustomQuiz && this.app.customFileName) {
      title = this.app.customFileName.replace(/\.csv$/i, '');
    }

    const quizData = {
      id: 'quiz_' + Date.now(),
      title: title,
      author: 'Professor / Criador',
      createdAt: new Date().toISOString(),
      questions: questions
    };

    this.openShareModal(quizData);
  }

  bindBuilderCSVEvents() {
    // Botão de Carregar CSV dentro do Criador
    if (this.dom.builderCsvUploadBtn && this.dom.builderCsvFileInput) {
      this.dom.builderCsvUploadBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.dom.builderCsvFileInput.click();
      });

      this.dom.builderCsvFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.importCSVIntoBuilder(file);
          this.dom.builderCsvFileInput.value = '';
        }
      });
    }

    // Botão de Baixar Modelo CSV dentro do Criador
    if (this.dom.builderCsvTemplateBtn) {
      this.dom.builderCsvTemplateBtn.addEventListener('click', () => {
        soundFx.playClick();
        const csvContent = generateCSVTemplate();
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'quiz_modelo.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }
  }

  importCSVIntoBuilder(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showBuilderError('Por favor, selecione um arquivo válido com extensão .CSV.');
      soundFx.playWrong();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const result = parseCSV(content);

        if (!result.questions || result.questions.length === 0) {
          throw new Error('Nenhuma pergunta válida foi encontrada no arquivo CSV.');
        }

        // Se o título estiver vazio, usa o nome do arquivo
        if (!this.dom.builderTitleInput.value.trim()) {
          const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          this.dom.builderTitleInput.value = autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1);
        }

        // Limpa perguntas existentes no formulário e adiciona as importadas
        this.dom.builderQuestionsContainer.innerHTML = '';
        result.questions.forEach(q => {
          this.addQuestionCard(q);
        });

        this.updateQuestionCount();
        this.dom.builderErrorMsg.classList.add('hidden');

        soundFx.playVictory();
        this.app.triggerMiniConfetti();

      } catch (err) {
        console.error('Erro ao importar CSV no construtor:', err);
        this.showBuilderError(`Erro no CSV: ${err.message}`);
        soundFx.playWrong();
      }
    };

    reader.onerror = () => {
      this.showBuilderError('Erro ao ler o arquivo CSV selecionado.');
      soundFx.playWrong();
    };

    reader.readAsText(file, 'UTF-8');
  }

  showBuilderError(msg) {
    if (this.dom.builderErrorMsg) {
      this.dom.builderErrorMsg.textContent = msg;
      this.dom.builderErrorMsg.classList.remove('hidden');
    }
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  openBuilder(quizToEdit = null) {
    this.dom.builderQuestionsContainer.innerHTML = '';
    this.dom.builderErrorMsg.classList.add('hidden');

    if (quizToEdit) {
      this.editingQuizId = quizToEdit.id;
      this.dom.builderTitleInput.value = quizToEdit.title || '';
      this.dom.builderAuthorInput.value = quizToEdit.author || '';
      
      quizToEdit.questions.forEach(q => {
        this.addQuestionCard(q);
      });
    } else {
      this.editingQuizId = null;
      this.dom.builderTitleInput.value = '';
      this.dom.builderAuthorInput.value = '';
      // Adiciona 2 perguntas em branco para começar
      this.addQuestionCard();
      this.addQuestionCard();
    }

    this.updateQuestionCount();
    this.openModal(this.dom.builderModal);
  }

  openBuilderWithAIQuiz(quizData) {
    this.dom.builderQuestionsContainer.innerHTML = '';
    this.dom.builderErrorMsg.classList.add('hidden');

    this.editingQuizId = 'quiz_ai_' + Date.now();
    this.dom.builderTitleInput.value = quizData.title || 'Quiz Gerado por I.A';
    this.dom.builderAuthorInput.value = quizData.author || 'I.A QuizMaster';

    if (Array.isArray(quizData.questions)) {
      quizData.questions.forEach(q => {
        this.addQuestionCard(q);
      });
    }

    this.updateQuestionCount();
    this.openModal(this.dom.builderModal);
  }

  updateQuestionCount() {
    if (this.dom.builderQuestionCountBadge) {
      const count = this.dom.builderQuestionsContainer.children.length;
      this.dom.builderQuestionCountBadge.textContent = `${count} ${count === 1 ? 'pergunta' : 'perguntas'}`;
    }
  }

  addQuestionCard(data = null) {
    const container = this.dom.builderQuestionsContainer;
    const qIndex = container.children.length + 1;

    const card = document.createElement('div');
    card.className = 'p-3.5 sm:p-5 rounded-2xl bg-gray-900/80 border border-gray-700/70 space-y-3.5 sm:space-y-4 relative question-builder-item';
    
    const questionText = data ? data.question : '';
    const category = data ? data.category : 'Geral';
    const difficulty = data ? data.difficulty : 'Fácil';
    const options = data ? data.options : ['', '', '', ''];
    const correctAnswer = data ? data.correctAnswer : 0;
    const curiosity = data ? (data.curiosity || '') : '';

    const uniqueRadioName = `correct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    card.innerHTML = `
      <div class="flex items-center justify-between border-b border-gray-800 pb-3">
        <span class="font-bold text-sm text-indigo-400 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold q-num">
            ${qIndex}
          </span>
          Pergunta
        </span>
        <button type="button" class="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/30 delete-q-btn transition-colors" title="Excluir Pergunta">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Enunciado -->
      <div>
        <label class="block text-xs font-semibold text-gray-300 mb-1">Enunciado da Pergunta *</label>
        <input type="text" class="q-text-input w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border border-gray-700 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Ex: Qual é a capital do Brasil?" value="${this.escapeHtml(questionText)}" required />
      </div>

      <!-- Categoria e Dificuldade -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1">Categoria / Matéria</label>
          <input type="text" class="q-category-input w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-gray-100 placeholder-gray-500 focus:border-indigo-500" placeholder="Ex: Geografia, Matemática, História" value="${this.escapeHtml(category)}" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1">Dificuldade</label>
          <select class="q-diff-select w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-gray-100 focus:border-indigo-500">
            <option value="Fácil" ${difficulty === 'Fácil' ? 'selected' : ''}>🟢 Fácil</option>
            <option value="Médio" ${difficulty === 'Médio' ? 'selected' : ''}>🟡 Médio</option>
            <option value="Difícil" ${difficulty === 'Difícil' ? 'selected' : ''}>🔴 Difícil</option>
          </select>
        </div>
      </div>

      <!-- 4 Alternativas com Seleção da Correta -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-gray-300">Alternativas (Selecione o botão da resposta correta):</label>
        ${['A', 'B', 'C', 'D'].map((letter, optIdx) => `
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-1.5 cursor-pointer px-2.5 py-2 rounded-xl border ${correctAnswer === optIdx ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold' : 'bg-gray-800/60 border-gray-700 text-gray-400'} text-xs radio-label transition-colors">
              <input type="radio" name="${uniqueRadioName}" value="${optIdx}" ${correctAnswer === optIdx ? 'checked' : ''} class="hidden correct-radio" />
              <span>${letter}</span>
            </label>
            <input type="text" class="opt-input w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-gray-100 placeholder-gray-500 focus:border-indigo-500" placeholder="Opção ${letter}" value="${this.escapeHtml(options[optIdx] || '')}" required />
          </div>
        `).join('')}
      </div>

      <!-- Curiosidade Didática -->
      <div>
        <label class="block text-xs font-semibold text-gray-300 mb-1">💡 Curiosidade Didática (Opcional)</label>
        <input type="text" class="q-curiosity-input w-full px-3 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-xs text-gray-100 placeholder-gray-500 focus:border-indigo-500" placeholder="Breve explicação ou curiosidade que aparece após a resposta" value="${this.escapeHtml(curiosity)}" />
      </div>
    `;

    // Eventos dentro do card
    const deleteBtn = card.querySelector('.delete-q-btn');
    deleteBtn.addEventListener('click', () => {
      if (container.children.length <= 1) {
        alert('O quiz precisa ter pelo menos 1 pergunta.');
        return;
      }
      card.remove();
      this.reindexQuestions();
      this.updateQuestionCount();
    });

    // Mudança de resposta correta
    const radios = card.querySelectorAll('.correct-radio');
    const radioLabels = card.querySelectorAll('.radio-label');
    radios.forEach((radio, rIdx) => {
      radio.addEventListener('change', () => {
        radioLabels.forEach((lbl, lIdx) => {
          if (lIdx === rIdx) {
            lbl.className = 'flex items-center gap-1.5 cursor-pointer px-2.5 py-2 rounded-xl border bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold text-xs radio-label transition-colors';
          } else {
            lbl.className = 'flex items-center gap-1.5 cursor-pointer px-2.5 py-2 rounded-xl border bg-gray-800/60 border-gray-700 text-gray-400 text-xs radio-label transition-colors';
          }
        });
      });
    });

    container.appendChild(card);
    if (window.lucide) window.lucide.createIcons();
  }

  reindexQuestions() {
    const cards = this.dom.builderQuestionsContainer.querySelectorAll('.question-builder-item');
    cards.forEach((card, idx) => {
      const numSpan = card.querySelector('.q-num');
      if (numSpan) numSpan.textContent = `${idx + 1}`;
    });
  }

  saveAndShareQuiz() {
    const title = this.dom.builderTitleInput.value.trim() || 'Meu Quiz Personalizado';
    const author = this.dom.builderAuthorInput.value.trim() || 'Criador';
    const cardElements = this.dom.builderQuestionsContainer.querySelectorAll('.question-builder-item');

    const questions = [];
    let validationError = null;

    if (cardElements.length === 0) {
      this.showBuilderError('Adicione pelo menos 1 pergunta ao quiz.');
      soundFx.playWrong();
      return;
    }

    cardElements.forEach((card, idx) => {
      if (validationError) return;

      const qTextInput = card.querySelector('.q-text-input');
      const qText = qTextInput ? qTextInput.value.trim() : '';
      const catInput = card.querySelector('.q-category-input');
      const category = catInput ? (catInput.value.trim() || 'Geral') : 'Geral';
      const diffSelect = card.querySelector('.q-diff-select');
      const difficulty = diffSelect ? diffSelect.value : 'Fácil';
      const curInput = card.querySelector('.q-curiosity-input');
      const curiosity = curInput && curInput.value.trim() ? curInput.value.trim() : 'Resposta correta registrada!';

      const optInputs = card.querySelectorAll('.opt-input');
      const options = Array.from(optInputs).map(input => input.value.trim());

      const checkedRadio = card.querySelector('.correct-radio:checked');
      const correctAnswer = checkedRadio ? parseInt(checkedRadio.value, 10) : 0;

      if (!qText) {
        validationError = `A pergunta #${idx + 1} precisa de um enunciado.`;
        if (qTextInput) qTextInput.focus();
        return;
      }

      if (options.some(opt => !opt)) {
        validationError = `A pergunta #${idx + 1} precisa de todas as 4 alternativas preenchidas.`;
        return;
      }

      questions.push({
        id: idx + 1,
        question: qText,
        category: category,
        difficulty: difficulty,
        options: options,
        correctAnswer: isNaN(correctAnswer) ? 0 : correctAnswer,
        curiosity: curiosity
      });
    });

    if (validationError) {
      this.showBuilderError(validationError);
      soundFx.playWrong();
      return;
    }

    const quizData = {
      id: this.editingQuizId || 'quiz_' + Date.now(),
      title: title,
      author: author,
      updatedAt: new Date().toISOString(),
      questions: questions
    };

    // Salva no LocalStorage
    this.saveQuizToStorage(quizData);

    // Fecha o builder e abre o modal de compartilhamento
    this.closeModal(this.dom.builderModal);
    this.openShareModal(quizData);

    // Carrega o quiz criado no motor da aplicação
    this.app.activeQuestions = questions;
    this.app.isCustomQuiz = true;
    this.app.customFileName = title;
    this.app.dom.quizSourceLabel.innerHTML = `<strong class="text-indigo-400">${title}</strong> por ${author} (${questions.length} perguntas)`;
    this.app.dom.resetDefaultQuizBtn.classList.remove('hidden');
    if (this.app.dom.shareCSVQuizBtn) {
      this.app.dom.shareCSVQuizBtn.classList.remove('hidden');
    }
    if (this.app.dom.startBtnText) {
      this.app.dom.startBtnText.textContent = `Iniciar ${title} (${questions.length})`;
    }
  }

  saveQuizToStorage(quizData) {
    try {
      const list = this.getSavedQuizzes();
      const existingIdx = list.findIndex(q => q.id === quizData.id);
      if (existingIdx >= 0) {
        list[existingIdx] = quizData;
      } else {
        list.unshift(quizData);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Não foi possível salvar quiz no localStorage:', e);
    }
  }

  getSavedQuizzes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  openShareModal(quizData) {
    try {
      this.currentShareQuizData = quizData;
      const shareUrl = encodeQuizToUrl(quizData);

      this.dom.shareQuizTitle.textContent = quizData.title || 'Quiz Personalizado';
      this.dom.shareQuizInfo.textContent = `${quizData.questions.length} perguntas • Criado por ${quizData.author || 'Anônimo'}`;
      this.dom.shareUrlInput.value = shareUrl;
      this.dom.copyFeedback.classList.add('hidden');

      // Renderiza QR Code
      renderQRCode(this.dom.qrCodeContainer, shareUrl);

      this.openModal(this.dom.shareModal);
      soundFx.playStreak();
    } catch (err) {
      console.error('Erro ao abrir modal de compartilhamento:', err);
      alert('Erro ao gerar link de compartilhamento: ' + err.message);
    }
  }

  showCopyFeedback(text) {
    this.dom.copyFeedback.textContent = text;
    this.dom.copyFeedback.classList.remove('hidden');
    setTimeout(() => {
      this.dom.copyFeedback.classList.add('hidden');
    }, 3500);
  }

  openMyQuizzes() {
    const list = this.getSavedQuizzes();
    const container = this.dom.myQuizzesListContainer;
    container.innerHTML = '';

    if (list.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400 space-y-3">
          <i data-lucide="folder-open" class="w-12 h-12 mx-auto text-gray-600"></i>
          <p class="text-sm">Você ainda não criou nenhum quiz personalizado.</p>
          <button id="create-quiz-empty-btn" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors">
            Criar Meu Primeiro Quiz
          </button>
        </div>
      `;
      const btn = container.querySelector('#create-quiz-empty-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          this.closeModal(this.dom.myQuizzesModal);
          this.openBuilder();
        });
      }
    } else {
      list.forEach(quiz => {
        const item = document.createElement('div');
        item.className = 'p-4 rounded-2xl bg-gray-900/80 border border-gray-700/60 flex flex-wrap items-center justify-between gap-3';
        item.innerHTML = `
          <div>
            <h4 class="font-bold text-sm text-gray-100">${this.escapeHtml(quiz.title)}</h4>
            <span class="text-xs text-gray-400">${quiz.questions.length} perguntas • Autor: ${this.escapeHtml(quiz.author || 'Você')}</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="play-quiz-btn px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1">
              <i data-lucide="play" class="w-3.5 h-3.5"></i> Jogar
            </button>
            <button class="share-quiz-btn px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-indigo-400 font-semibold transition-all flex items-center gap-1">
              <i data-lucide="share-2" class="w-3.5 h-3.5"></i> Link
            </button>
            <button class="edit-quiz-btn p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Editar">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
            <button class="delete-quiz-btn p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors" title="Excluir">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;

        // Ações de cada quiz salvo
        item.querySelector('.play-quiz-btn').addEventListener('click', () => {
          soundFx.playClick();
          this.closeModal(this.dom.myQuizzesModal);
          this.app.activeQuestions = quiz.questions;
          this.app.isCustomQuiz = true;
          this.app.customFileName = quiz.title;
          this.app.dom.quizSourceLabel.innerHTML = `<strong class="text-indigo-400">${quiz.title}</strong> (${quiz.questions.length} perguntas)`;
          this.app.dom.resetDefaultQuizBtn.classList.remove('hidden');
          if (this.app.dom.shareCSVQuizBtn) {
            this.app.dom.shareCSVQuizBtn.classList.remove('hidden');
          }
          this.app.startQuiz();
        });

        item.querySelector('.share-quiz-btn').addEventListener('click', () => {
          soundFx.playClick();
          this.closeModal(this.dom.myQuizzesModal);
          this.openShareModal(quiz);
        });

        item.querySelector('.edit-quiz-btn').addEventListener('click', () => {
          soundFx.playClick();
          this.closeModal(this.dom.myQuizzesModal);
          this.openBuilder(quiz);
        });

        item.querySelector('.delete-quiz-btn').addEventListener('click', () => {
          if (confirm(`Tem certeza que deseja excluir o quiz "${quiz.title}"?`)) {
            const updated = this.getSavedQuizzes().filter(q => q.id !== quiz.id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            this.openMyQuizzes();
          }
        });

        container.appendChild(item);
      });
    }

    this.openModal(this.dom.myQuizzesModal);
    if (window.lucide) window.lucide.createIcons();
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

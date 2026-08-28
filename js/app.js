import { QUIZ_QUESTIONS } from './questions.js';
import { soundFx } from './audio.js';
import { parseCSV, generateCSVTemplate } from './csvParser.js';
import { decodeQuizFromUrl } from './shareManager.js';
import { QuizBuilder } from './quizBuilder.js';
import { AuthManager } from './authManager.js';
import { RoomManager } from './roomManager.js';
import { LeaderboardManager } from './leaderboardManager.js';

class QuizApp {
  constructor() {
    this.defaultQuestions = [...QUIZ_QUESTIONS];
    this.activeQuestions = [...QUIZ_QUESTIONS];
    this.questions = [...this.activeQuestions];
    this.isCustomQuiz = false;
    this.customFileName = '';

    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.userAnswers = [];
    
    // Configurações
    this.timerEnabled = true;
    this.timerSeconds = 20;
    this.timerRemaining = 20;
    this.timerInterval = null;
    this.soundEnabled = true;
    
    // Elementos DOM
    this.screens = {
      welcome: document.getElementById('welcome-screen'),
      quiz: document.getElementById('quiz-screen'),
      results: document.getElementById('results-screen')
    };

    this.dom = {
      // Header / Top Stats
      progressBar: document.getElementById('progress-bar'),
      progressText: document.getElementById('progress-text'),
      scoreBadge: document.getElementById('score-badge'),
      streakBadge: document.getElementById('streak-badge'),
      streakCount: document.getElementById('streak-count'),
      timerDisplay: document.getElementById('timer-display'),
      timerContainer: document.getElementById('timer-container'),
      
      // Question Card
      categoryBadge: document.getElementById('category-badge'),
      difficultyBadge: document.getElementById('difficulty-badge'),
      questionText: document.getElementById('question-text'),
      optionsContainer: document.getElementById('options-container'),
      curiosityBox: document.getElementById('curiosity-box'),
      curiosityText: document.getElementById('curiosity-text'),
      nextBtn: document.getElementById('next-btn'),
      
      // Results Screen
      finalScore: document.getElementById('final-score'),
      finalAccuracy: document.getElementById('final-accuracy'),
      finalStreak: document.getElementById('final-streak'),
      performanceBadge: document.getElementById('performance-badge'),
      categoryStatsContainer: document.getElementById('category-stats-container'),
      reviewListContainer: document.getElementById('review-list-container'),
      reviewHeadingText: document.getElementById('review-heading-text'),
      
      // Controls & Buttons
      startBtn: document.getElementById('start-btn'),
      startBtnText: document.getElementById('start-btn-text'),
      restartBtn: document.getElementById('restart-btn'),
      reviewOnlyWrongBtn: document.getElementById('review-wrong-btn'),
      soundToggleBtn: document.getElementById('sound-toggle-btn'),
      timerToggleCheckbox: document.getElementById('timer-toggle-checkbox'),

      // CSV & Share Controls
      dropZone: document.getElementById('drop-zone'),
      csvFileInput: document.getElementById('csv-file-input'),
      downloadTemplateBtn: document.getElementById('download-template-btn'),
      quizSourceLabel: document.getElementById('quiz-source-label'),
      resetDefaultQuizBtn: document.getElementById('reset-default-quiz-btn'),
      shareCSVQuizBtn: document.getElementById('share-csv-quiz-btn'),
      uploadFeedback: document.getElementById('upload-feedback'),

      // Mobile Aside Drawer Controls
      mobileMenuToggleBtn: document.getElementById('mobile-menu-toggle-btn'),
      closeMobileDrawerBtn: document.getElementById('close-mobile-drawer-btn'),
      mobileDrawerContainer: document.getElementById('mobile-drawer-container'),
      mobileDrawerBackdrop: document.getElementById('mobile-drawer-backdrop'),
      mobileDrawerPanel: document.getElementById('mobile-drawer-panel'),
      mobileQuickCreateBtn: document.getElementById('mobile-quick-create-btn'),
      drawerAiBtn: document.getElementById('drawer-ai-btn'),
      drawerBuilderBtn: document.getElementById('drawer-builder-btn'),
      drawerMyQuizzesBtn: document.getElementById('drawer-my-quizzes-btn'),
      drawerRoomsBtn: document.getElementById('drawer-rooms-btn'),
      drawerShareBtn: document.getElementById('drawer-share-btn'),
      drawerAuthBtn: document.getElementById('drawer-auth-btn'),
      drawerSoundBtn: document.getElementById('drawer-sound-btn')
    };

    this.init();
  }

  init() {
    this.authManager = new AuthManager(this);
    this.quizBuilder = new QuizBuilder(this);
    this.roomManager = new RoomManager(this);
    this.leaderboardManager = new LeaderboardManager(this);

    this.bindEvents();
    this.bindMobileDrawerEvents();
    this.bindCSVUploadEvents();
    this.checkSharedUrlQuiz();
    this.updateAudioState();

    window.addEventListener('hashchange', () => {
      this.checkSharedUrlQuiz();
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  checkSharedUrlQuiz() {
    const sharedData = decodeQuizFromUrl();
    if (sharedData && sharedData.questions && sharedData.questions.length > 0) {
      this.activeQuestions = sharedData.questions;
      this.isCustomQuiz = true;
      this.customFileName = sharedData.title || 'Quiz Compartilhado';

      const title = sharedData.title || 'Quiz Personalizado';
      const author = sharedData.author || 'Autor';

      this.dom.quizSourceLabel.innerHTML = `🔗 <strong class="text-indigo-400">${title}</strong> por ${author} (${sharedData.questions.length} perguntas)`;
      this.dom.resetDefaultQuizBtn.classList.remove('hidden');
      if (this.dom.shareCSVQuizBtn) {
        this.dom.shareCSVQuizBtn.classList.remove('hidden');
      }
      if (this.dom.startBtnText) {
        this.dom.startBtnText.textContent = `Iniciar ${title} (${sharedData.questions.length})`;
      }

      this.showUploadFeedback(`🎉 <strong>Quiz Compartilhado Carregado!</strong><br>"${title}" por ${author} (${sharedData.questions.length} perguntas). Bom jogo!`, 'success');
      this.triggerMiniConfetti();
    }
  }

  bindEvents() {
    this.dom.startBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.startQuiz();
    });

    this.dom.nextBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.goToNextQuestion();
    });

    this.dom.restartBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.resetQuiz(this.activeQuestions);
      this.startQuiz();
    });

    if (this.dom.reviewOnlyWrongBtn) {
      this.dom.reviewOnlyWrongBtn.addEventListener('click', () => {
        soundFx.playClick();
        const wrongQuestions = this.questions.filter((q, idx) => {
          return this.userAnswers[idx] && !this.userAnswers[idx].isCorrect;
        });
        if (wrongQuestions.length > 0) {
          this.resetQuiz(wrongQuestions);
          this.startQuiz();
        } else {
          alert('Parabéns! Você não errou nenhuma pergunta.');
        }
      });
    }

    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        this.updateAudioState();
      });
    }

    if (this.dom.timerToggleCheckbox) {
      this.dom.timerToggleCheckbox.addEventListener('change', (e) => {
        this.timerEnabled = e.target.checked;
      });
    }

    // Atalhos de teclado (A, B, C, D ou 1, 2, 3, 4, Enter)
    window.addEventListener('keydown', (e) => {
      const activeScreen = this.getActiveScreen();
      if (activeScreen === 'quiz') {
        const key = e.key.toUpperCase();
        const keyMap = { 'A': 0, '1': 0, 'B': 1, '2': 1, 'C': 2, '3': 2, 'D': 3, '4': 3 };
        
        if (key in keyMap) {
          const optionButtons = this.dom.optionsContainer.querySelectorAll('button');
          const targetBtn = optionButtons[keyMap[key]];
          if (targetBtn && !targetBtn.disabled) {
            targetBtn.click();
          }
        } else if (e.key === 'Enter' && !this.dom.nextBtn.classList.contains('hidden')) {
          this.dom.nextBtn.click();
        }
      } else if (activeScreen === 'welcome' && e.key === 'Enter') {
        this.dom.startBtn.click();
      }
    });
  }

  bindMobileDrawerEvents() {
    // Abrir Drawer
    if (this.dom.mobileMenuToggleBtn) {
      this.dom.mobileMenuToggleBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openMobileDrawer();
      });
    }

    // Fechar Drawer (botão X ou backdrop)
    if (this.dom.closeMobileDrawerBtn) {
      this.dom.closeMobileDrawerBtn.addEventListener('click', () => this.closeMobileDrawer());
    }
    if (this.dom.mobileDrawerBackdrop) {
      this.dom.mobileDrawerBackdrop.addEventListener('click', () => this.closeMobileDrawer());
    }

    // Botão Criar Rápido no topo mobile
    if (this.dom.mobileQuickCreateBtn) {
      this.dom.mobileQuickCreateBtn.addEventListener('click', () => {
        soundFx.playClick();
        if (this.quizBuilder) this.quizBuilder.openBuilder();
      });
    }

    // Itens de Ação do Drawer
    if (this.dom.drawerAiBtn) {
      this.dom.drawerAiBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeMobileDrawer();
        if (this.quizBuilder && this.quizBuilder.aiModal) {
          this.quizBuilder.aiModal.openModal();
        }
      });
    }

    if (this.dom.drawerBuilderBtn) {
      this.dom.drawerBuilderBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeMobileDrawer();
        if (this.quizBuilder) {
          this.quizBuilder.openBuilder();
        }
      });
    }

    if (this.dom.drawerMyQuizzesBtn) {
      this.dom.drawerMyQuizzesBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeMobileDrawer();
        if (this.quizBuilder) {
          this.quizBuilder.openMyQuizzes();
        }
      });
    }

    if (this.dom.drawerRoomsBtn) {
      this.dom.drawerRoomsBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeMobileDrawer();
        if (this.roomManager) {
          this.roomManager.openMyRooms();
        }
      });
    }

    if (this.dom.drawerShareBtn) {
      this.dom.drawerShareBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeMobileDrawer();
        if (this.quizBuilder) {
          this.quizBuilder.shareCurrentActiveQuiz();
        }
      });
    }

    if (this.dom.drawerAuthBtn) {
      this.dom.drawerAuthBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeMobileDrawer();
        if (this.authManager) {
          this.authManager.openAuthModal();
        }
      });
    }

    if (this.dom.drawerSoundBtn) {
      this.dom.drawerSoundBtn.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        this.updateAudioState();
      });
    }
  }

  openMobileDrawer() {
    if (this.dom.mobileDrawerContainer) this.dom.mobileDrawerContainer.classList.remove('pointer-events-none');
    if (this.dom.mobileDrawerBackdrop) this.dom.mobileDrawerBackdrop.classList.add('active');
    if (this.dom.mobileDrawerPanel) this.dom.mobileDrawerPanel.classList.add('active');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeMobileDrawer() {
    if (this.dom.mobileDrawerBackdrop) this.dom.mobileDrawerBackdrop.classList.remove('active');
    if (this.dom.mobileDrawerPanel) this.dom.mobileDrawerPanel.classList.remove('active');
    if (this.dom.mobileDrawerContainer) this.dom.mobileDrawerContainer.classList.add('pointer-events-none');
    document.body.classList.remove('overflow-hidden');
  }

  bindCSVUploadEvents() {
    // Clique na dropzone para abrir seletor
    if (this.dom.dropZone && this.dom.csvFileInput) {
      this.dom.dropZone.addEventListener('click', () => {
        this.dom.csvFileInput.click();
      });

      this.dom.csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.processCSVFile(file);
        }
      });

      // Eventos Drag and Drop
      ['dragenter', 'dragover'].forEach(eventName => {
        this.dom.dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dom.dropZone.classList.add('border-indigo-400', 'bg-indigo-950/40');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        this.dom.dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dom.dropZone.classList.remove('border-indigo-400', 'bg-indigo-950/40');
        });
      });

      this.dom.dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files && dt.files[0];
        if (file) {
          this.processCSVFile(file);
        }
      });
    }

    // Download do Modelo CSV
    if (this.dom.downloadTemplateBtn) {
      this.dom.downloadTemplateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        soundFx.playClick();
        this.downloadCSVTemplate();
      });
    }

    // Restaurar perguntas padrão
    if (this.dom.resetDefaultQuizBtn) {
      this.dom.resetDefaultQuizBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.restoreDefaultQuestions();
      });
    }
  }

  processCSVFile(file) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showUploadFeedback('Por favor, selecione um arquivo com extensão .CSV.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const result = parseCSV(content);

        if (!result.questions || result.questions.length === 0) {
          throw new Error('Nenhuma pergunta válida foi encontrada no arquivo.');
        }

        this.activeQuestions = result.questions;
        this.isCustomQuiz = true;
        this.customFileName = file.name;

        // Atualiza UI
        this.dom.quizSourceLabel.innerHTML = `<strong class="text-indigo-400">${file.name}</strong> (${result.questions.length} perguntas carregadas)`;
        this.dom.resetDefaultQuizBtn.classList.remove('hidden');
        if (this.dom.shareCSVQuizBtn) {
          this.dom.shareCSVQuizBtn.classList.remove('hidden');
        }
        if (this.dom.startBtnText) {
          this.dom.startBtnText.textContent = `Iniciar Quiz Personalizado (${result.questions.length})`;
        }

        let feedbackMsg = `✅ Sucesso! ${result.questions.length} perguntas importadas e prontas para jogar.`;
        if (result.warnings && result.warnings.length > 0) {
          feedbackMsg += `<br><span class="text-amber-300">Avisos (${result.warnings.length}): ${result.warnings[0]}</span>`;
        }

        this.showUploadFeedback(feedbackMsg, 'success');
        soundFx.playVictory();
        this.triggerMiniConfetti();

      } catch (err) {
        console.error('Erro ao processar CSV:', err);
        this.showUploadFeedback(`❌ ${err.message}`, 'error');
        soundFx.playWrong();
      }
    };

    reader.onerror = () => {
      this.showUploadFeedback('Erro ao ler o arquivo selecionado.', 'error');
      soundFx.playWrong();
    };

    reader.readAsText(file, 'UTF-8');
  }

  restoreDefaultQuestions() {
    this.activeQuestions = [...this.defaultQuestions];
    this.isCustomQuiz = false;
    this.customFileName = '';

    this.dom.quizSourceLabel.textContent = `Perguntas Padrão do QuizMaster (${this.defaultQuestions.length} questões)`;
    this.dom.resetDefaultQuizBtn.classList.add('hidden');
    if (this.dom.startBtnText) {
      this.dom.startBtnText.textContent = 'Iniciar Desafio';
    }
    if (this.dom.csvFileInput) {
      this.dom.csvFileInput.value = '';
    }

    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }

    this.showUploadFeedback('Perguntas padrão de Conhecimentos Gerais restauradas.', 'info');
  }

  showUploadFeedback(message, type) {
    if (!this.dom.uploadFeedback) return;

    this.dom.uploadFeedback.innerHTML = message;
    this.dom.uploadFeedback.classList.remove('hidden', 'bg-rose-950/60', 'text-rose-300', 'border-rose-700/50', 'bg-emerald-950/60', 'text-emerald-300', 'border-emerald-700/50', 'bg-blue-950/60', 'text-blue-300', 'border-blue-700/50');
    
    if (type === 'error') {
      this.dom.uploadFeedback.classList.add('bg-rose-950/60', 'text-rose-300', 'border', 'border-rose-700/50');
    } else if (type === 'success') {
      this.dom.uploadFeedback.classList.add('bg-emerald-950/60', 'text-emerald-300', 'border', 'border-emerald-700/50');
    } else {
      this.dom.uploadFeedback.classList.add('bg-blue-950/60', 'text-blue-300', 'border', 'border-blue-700/50');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  downloadCSVTemplate() {
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
  }

  updateAudioState() {
    soundFx.muted = !this.soundEnabled;
    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.innerHTML = this.soundEnabled
        ? `<i data-lucide="volume-2" class="w-5 h-5 text-indigo-400"></i>`
        : `<i data-lucide="volume-x" class="w-5 h-5 text-gray-500"></i>`;
    }
    if (this.dom.drawerSoundBtn) {
      this.dom.drawerSoundBtn.textContent = this.soundEnabled ? 'Ligado' : 'Mudo';
      this.dom.drawerSoundBtn.className = this.soundEnabled
        ? 'px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors'
        : 'px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 text-xs font-bold hover:bg-gray-700 transition-colors';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  showScreen(name) {
    Object.keys(this.screens).forEach(key => {
      this.screens[key].classList.add('hidden');
    });
    this.screens[name].classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  getActiveScreen() {
    for (const key in this.screens) {
      if (!this.screens[key].classList.contains('hidden')) {
        return key;
      }
    }
    return null;
  }

  resetQuiz(questionList = this.activeQuestions) {
    this.questions = [...questionList];
    this.currentIndex = 0;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.userAnswers = [];
    clearInterval(this.timerInterval);
  }

  startQuiz() {
    this.resetQuiz(this.activeQuestions);
    this.showScreen('quiz');
    this.renderQuestion();
  }

  renderQuestion() {
    clearInterval(this.timerInterval);
    const q = this.questions[this.currentIndex];
    
    // Atualiza progresso
    const total = this.questions.length;
    const currentNum = this.currentIndex + 1;
    const progressPercent = ((currentNum - 1) / total) * 100;
    
    this.dom.progressBar.style.width = `${progressPercent}%`;
    this.dom.progressText.textContent = `Pergunta ${currentNum} de ${total}`;
    this.dom.scoreBadge.textContent = `${this.score} pts`;

    // Atualiza Streak Badge
    if (this.streak >= 2) {
      this.dom.streakBadge.classList.remove('hidden');
      this.dom.streakCount.textContent = `${this.streak}x Combo`;
    } else {
      this.dom.streakBadge.classList.add('hidden');
    }

    // Configura Badges de Categoria e Dificuldade
    this.dom.categoryBadge.textContent = q.category || 'Geral';
    this.dom.difficultyBadge.textContent = q.difficulty || 'Médio';

    // Cores das dificuldades
    this.dom.difficultyBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ';
    if (q.difficulty === 'Fácil') {
      this.dom.difficultyBadge.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border', 'border-emerald-500/30');
    } else if (q.difficulty === 'Médio') {
      this.dom.difficultyBadge.classList.add('bg-amber-500/20', 'text-amber-400', 'border', 'border-amber-500/30');
    } else {
      this.dom.difficultyBadge.classList.add('bg-rose-500/20', 'text-rose-400', 'border', 'border-rose-500/30');
    }

    // Categoria Badge styling
    this.dom.categoryBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';

    // Texto da pergunta
    this.dom.questionText.textContent = q.question;

    // Renderiza Alternativas
    this.dom.optionsContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option w-full p-4 rounded-xl text-left font-medium text-gray-200 border border-gray-700/70 bg-gray-800/60 hover:bg-gray-700/60 flex items-center justify-between group shadow-sm';
      btn.innerHTML = `
        <div class="flex items-center gap-3.5">
          <span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-gray-700/80 text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            ${letters[idx] || (idx + 1)}
          </span>
          <span class="text-base font-medium">${opt}</span>
        </div>
        <div class="status-icon opacity-0"></div>
      `;
      btn.addEventListener('click', () => this.handleAnswer(idx));
      this.dom.optionsContainer.appendChild(btn);
    });

    // Oculta caixa de curiosidade e botão de próxima
    this.dom.curiosityBox.classList.add('hidden');
    this.dom.nextBtn.classList.add('hidden');

    // Inicia Timer se ativado
    if (this.timerEnabled) {
      this.dom.timerContainer.classList.remove('hidden');
      this.startTimer();
    } else {
      this.dom.timerContainer.classList.add('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  startTimer() {
    this.timerRemaining = this.timerSeconds;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerRemaining--;
      this.updateTimerDisplay();

      if (this.timerRemaining <= 5 && this.timerRemaining > 0) {
        soundFx.playTick();
      }

      if (this.timerRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.handleAnswer(-1); // Tempo esgotado
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.dom.timerDisplay.textContent = `${this.timerRemaining}s`;
    if (this.timerRemaining <= 5) {
      this.dom.timerDisplay.classList.add('text-rose-400', 'animate-pulse');
      this.dom.timerDisplay.classList.remove('text-indigo-300');
    } else {
      this.dom.timerDisplay.classList.remove('text-rose-400', 'animate-pulse');
      this.dom.timerDisplay.classList.add('text-indigo-300');
    }
  }

  handleAnswer(selectedIndex) {
    clearInterval(this.timerInterval);
    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIndex === q.correctAnswer;
    const optionButtons = this.dom.optionsContainer.querySelectorAll('button');

    // Desativa todos os botões
    optionButtons.forEach((btn, idx) => {
      btn.disabled = true;
      const statusIcon = btn.querySelector('.status-icon');
      
      if (idx === q.correctAnswer) {
        btn.classList.add('correct');
        if (statusIcon) {
          statusIcon.innerHTML = `<i data-lucide="check-circle" class="w-6 h-6 text-emerald-400"></i>`;
          statusIcon.classList.remove('opacity-0');
        }
      } else if (idx === selectedIndex) {
        btn.classList.add('incorrect');
        if (statusIcon) {
          statusIcon.innerHTML = `<i data-lucide="x-circle" class="w-6 h-6 text-rose-400"></i>`;
          statusIcon.classList.remove('opacity-0');
        }
      } else {
        btn.classList.add('dimmed');
      }
    });

    // Pontuação e Gamificação
    if (isCorrect) {
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      // Cálculo de pontos: Base (100) + Dificuldade + Combo + Bônus de tempo
      let difficultyMultiplier = q.difficulty === 'Fácil' ? 1 : q.difficulty === 'Médio' ? 1.5 : 2;
      let timeBonus = this.timerEnabled ? Math.max(0, this.timerRemaining * 5) : 0;
      let streakBonus = (this.streak - 1) * 20;
      let pointsAwarded = Math.round((100 * difficultyMultiplier) + streakBonus + timeBonus);

      this.score += pointsAwarded;
      this.dom.scoreBadge.textContent = `${this.score} pts`;

      if (this.streak >= 3) {
        soundFx.playStreak();
        this.triggerMiniConfetti();
      } else {
        soundFx.playCorrect();
      }
    } else {
      this.streak = 0;
      soundFx.playWrong();
    }

    // Salva histórico da resposta
    this.userAnswers.push({
      questionId: q.id,
      question: q.question,
      category: q.category || 'Geral',
      difficulty: q.difficulty || 'Médio',
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedIndex: selectedIndex,
      isCorrect: isCorrect,
      curiosity: q.curiosity || 'Sem curiosidade adicional informada.'
    });

    // Exibe Pílula de Curiosidade
    this.dom.curiosityText.textContent = q.curiosity || 'Resposta correta registrada!';
    this.dom.curiosityBox.classList.remove('hidden');
    this.dom.curiosityBox.classList.add('animate-slide-up');

    // Exibe Botão Próxima
    this.dom.nextBtn.classList.remove('hidden');
    this.dom.nextBtn.classList.add('animate-slide-up');

    if (window.lucide) window.lucide.createIcons();
  }

  goToNextQuestion() {
    this.currentIndex++;
    if (this.currentIndex < this.questions.length) {
      this.renderQuestion();
    } else {
      this.showResults();
    }
  }

  triggerMiniConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  triggerGrandConfetti() {
    if (window.confetti) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        window.confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        window.confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }

  showResults() {
    clearInterval(this.timerInterval);
    this.dom.progressBar.style.width = '100%';
    this.showScreen('results');
    soundFx.playVictory();

    const totalQuestions = this.questions.length;
    const correctCount = this.userAnswers.filter(a => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    this.dom.finalScore.textContent = this.score;
    this.dom.finalAccuracy.textContent = `${accuracy}% (${correctCount}/${totalQuestions})`;
    this.dom.finalStreak.textContent = `${this.maxStreak} seguidos`;

    // Badge de Desempenho
    let badgeText = '';
    let badgeClass = '';
    if (accuracy >= 90) {
      badgeText = '🏆 Mestre Enciclopédico!';
      badgeClass = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      this.triggerGrandConfetti();
    } else if (accuracy >= 70) {
      badgeText = '🌟 Conhecimento Brilhante!';
      badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      this.triggerGrandConfetti();
    } else if (accuracy >= 50) {
      badgeText = '👍 Bom Desempenho!';
      badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    } else {
      badgeText = '📚 Continue Aprendendo!';
      badgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }

    this.dom.performanceBadge.textContent = badgeText;
    this.dom.performanceBadge.className = `inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${badgeClass}`;

    if (this.dom.reviewHeadingText) {
      this.dom.reviewHeadingText.textContent = `Revisão e Curiosidades (${totalQuestions} ${totalQuestions === 1 ? 'Pergunta' : 'Perguntas'})`;
    }

    // Estatísticas por Categoria (Extraídas dinamicamente)
    this.renderCategoryStats();

    // Gabarito e Revisão de Curiosidades
    this.renderReviewList();

    // Se estiver participando de uma sala de desafio (PIN), grava no ranking
    if (this.leaderboardManager && this.leaderboardManager.activeRoomForPlayer) {
      this.leaderboardManager.recordPlayerScore(this.score, accuracy, this.maxStreak);
    }
  }

  renderCategoryStats() {
    // Extrai todas as categorias presentes nas respostas
    const categoriesMap = {};

    this.userAnswers.forEach(ans => {
      const cat = ans.category || 'Geral';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { total: 0, correct: 0 };
      }
      categoriesMap[cat].total++;
      if (ans.isCorrect) categoriesMap[cat].correct++;
    });

    const categoryNames = Object.keys(categoriesMap);

    this.dom.categoryStatsContainer.innerHTML = '';
    categoryNames.forEach(cat => {
      const stat = categoriesMap[cat];
      const percent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl bg-gray-800/40 border border-gray-700/50 flex flex-col justify-between';
      card.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <span class="text-xs font-semibold text-gray-400">${cat}</span>
          <span class="text-xs font-bold text-indigo-400">${stat.correct}/${stat.total}</span>
        </div>
        <div>
          <div class="w-full bg-gray-700/50 h-2 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
          </div>
          <div class="text-right text-[11px] text-gray-400 mt-1">${percent}%</div>
        </div>
      `;
      this.dom.categoryStatsContainer.appendChild(card);
    });
  }

  renderReviewList() {
    this.dom.reviewListContainer.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    this.userAnswers.forEach((ans, idx) => {
      const item = document.createElement('div');
      item.className = `p-4 rounded-xl border ${ans.isCorrect ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10'} mb-3`;
      
      const selectedText = ans.selectedIndex >= 0 ? `${letters[ans.selectedIndex] || (ans.selectedIndex + 1)}) ${ans.options[ans.selectedIndex]}` : 'Tempo Esgotado';
      const correctText = `${letters[ans.correctAnswer] || (ans.correctAnswer + 1)}) ${ans.options[ans.correctAnswer]}`;

      item.innerHTML = `
        <div class="flex items-start justify-between gap-3 mb-2">
          <span class="font-bold text-sm text-gray-200">#${idx + 1}. ${ans.question}</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${ans.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'} whitespace-nowrap">
            ${ans.isCorrect ? 'Acertou' : 'Errou'}
          </span>
        </div>
        <div class="text-xs text-gray-400 space-y-1 mb-3">
          <p><span class="font-medium text-gray-300">Sua resposta:</span> <span class="${ans.isCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400'}">${selectedText}</span></p>
          ${!ans.isCorrect ? `<p><span class="font-medium text-gray-300">Gabarito oficial:</span> <span class="text-emerald-400 font-semibold">${correctText}</span></p>` : ''}
        </div>
        <div class="text-xs p-3 rounded-lg bg-gray-900/60 border border-gray-800 text-indigo-200/90 flex gap-2 items-start">
          <span class="text-base">💡</span>
          <span><strong>Curiosidade:</strong> ${ans.curiosity}</span>
        </div>
      `;
      this.dom.reviewListContainer.appendChild(item);
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

// Inicialização segura do app e ícones
function bootstrap() {
  new QuizApp();
  if (window.lucide) window.lucide.createIcons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

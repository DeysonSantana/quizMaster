/**
 * Gerenciador de Salas de Desafio com Tempo de Validade (Estilo Kahoot)
 * Funciona no Frontend com suporte a Firebase Firestore e Banco Local
 */
import { serverlessDB } from './firebaseConfig.js';
import { encodeQuizToUrl, renderQRCode, copyToClipboard, shortenUrl } from './shareManager.js';
import { soundFx } from './audio.js';

export class RoomManager {
  constructor(app) {
    this.app = app;
    this.currentRoom = null;

    this.dom = {
      // Create Room Modal
      createRoomModal: document.getElementById('create-room-modal'),
      closeCreateRoomBtn: document.getElementById('close-create-room-btn'),
      cancelCreateRoomBtn: document.getElementById('cancel-create-room-btn'),
      createRoomForm: document.getElementById('create-room-form'),
      roomQuizTitleDisplay: document.getElementById('room-quiz-title-display'),
      roomDurationSelect: document.getElementById('room-duration-select'),
      roomTitleInput: document.getElementById('room-title-input'),
      confirmCreateRoomBtn: document.getElementById('confirm-create-room-btn'),

      // Room Created / Info Modal
      roomInfoModal: document.getElementById('room-info-modal'),
      closeRoomInfoBtn: document.getElementById('close-room-info-btn'),
      roomPinDisplay: document.getElementById('room-pin-display'),
      roomDirectUrlInput: document.getElementById('room-direct-url-input'),
      copyRoomUrlBtn: document.getElementById('copy-room-url-btn'),
      copyRoomFeedback: document.getElementById('copy-room-feedback'),
      roomQrContainer: document.getElementById('room-qrcode-container'),
      roomExpiresText: document.getElementById('room-expires-text'),
      viewRoomLeaderboardBtn: document.getElementById('view-room-leaderboard-btn'),
      startRoomPlayBtn: document.getElementById('start-room-play-btn'),
      shortenRoomUrlBtn: document.getElementById('shorten-room-url-btn'),
      shortenRoomBtnText: document.getElementById('shorten-room-btn-text'),

      // Minhas Salas & Rankings Modal
      openRoomsListBtn: document.getElementById('open-rooms-list-btn'),
      myRoomsModal: document.getElementById('my-rooms-modal'),
      closeMyRoomsBtn: document.getElementById('close-my-rooms-btn'),
      myRoomsListContainer: document.getElementById('my-rooms-list-container'),
      createNewRoomFromListBtn: document.getElementById('create-new-room-from-list-btn'),

      // PIN Join Box on Welcome Screen
      pinInput: document.getElementById('join-pin-input'),
      joinPinBtn: document.getElementById('join-pin-btn')
    };

    this.pendingRoomQuizData = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkUrlForRoomPin();
  }

  bindEvents() {
    // Fechar modais
    if (this.dom.closeCreateRoomBtn) {
      this.dom.closeCreateRoomBtn.addEventListener('click', () => this.closeCreateRoomModal());
    }
    if (this.dom.cancelCreateRoomBtn) {
      this.dom.cancelCreateRoomBtn.addEventListener('click', () => this.closeCreateRoomModal());
    }
    if (this.dom.closeRoomInfoBtn) {
      this.dom.closeRoomInfoBtn.addEventListener('click', () => this.closeRoomInfoModal());
    }
    if (this.dom.closeMyRoomsBtn) {
      this.dom.closeMyRoomsBtn.addEventListener('click', () => this.closeModal(this.dom.myRoomsModal));
    }

    // Abrir Modal de Minhas Salas & Rankings
    if (this.dom.openRoomsListBtn) {
      this.dom.openRoomsListBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openMyRooms();
      });
    }

    // Botão Nova Sala a partir da lista
    if (this.dom.createNewRoomFromListBtn) {
      this.dom.createNewRoomFromListBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeModal(this.dom.myRoomsModal);
        const activeQs = this.app.activeQuestions || this.app.defaultQuestions;
        const currentTitle = this.app.customFileName || 'Quiz de Conhecimentos Gerais';
        this.openCreateRoomModal({
          title: currentTitle,
          author: 'Criador',
          questions: activeQs
        });
      });
    }

    // Submissão do formulário de criação de sala
    if (this.dom.createRoomForm) {
      this.dom.createRoomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleCreateRoomSubmit();
      });
    }

    // Copiar Link da Sala
    if (this.dom.copyRoomUrlBtn) {
      this.dom.copyRoomUrlBtn.addEventListener('click', async () => {
        soundFx.playClick();
        const url = this.dom.roomDirectUrlInput.value;
        if (url) {
          const ok = await copyToClipboard(url);
          if (ok) {
            this.showCopyFeedback('Link da sala copiado! 🎉');
          }
        }
      });
    }

    // Encurtar Link da Sala
    if (this.dom.shortenRoomUrlBtn) {
      this.dom.shortenRoomUrlBtn.addEventListener('click', async () => {
        soundFx.playClick();
        const originalUrl = this.dom.roomDirectUrlInput.value;
        if (!originalUrl) return;

        if (this.dom.shortenRoomBtnText) this.dom.shortenRoomBtnText.textContent = 'Encurtando...';
        const shortUrl = await shortenUrl(originalUrl);
        this.dom.roomDirectUrlInput.value = shortUrl;
        if (this.dom.shortenRoomBtnText) this.dom.shortenRoomBtnText.textContent = 'Link Encurtado!';
        this.showCopyFeedback('Link encurtado gerado! ✂️');
      });
    }

    // Botão de entrar via PIN na tela inicial
    if (this.dom.joinPinBtn) {
      this.dom.joinPinBtn.addEventListener('click', () => {
        soundFx.playClick();
        const pin = (this.dom.pinInput.value || '').trim();
        if (pin) {
          this.joinRoomByPin(pin);
        } else {
          alert('Por favor, digite o PIN de 6 dígitos da sala.');
        }
      });
    }
  }

  showCopyFeedback(text) {
    if (this.dom.copyRoomFeedback) {
      this.dom.copyRoomFeedback.textContent = text;
      this.dom.copyRoomFeedback.classList.remove('hidden');
      setTimeout(() => {
        this.dom.copyRoomFeedback.classList.add('hidden');
      }, 3500);
    }
  }

  openCreateRoomModal(quizData) {
    this.pendingRoomQuizData = quizData;
    if (this.dom.roomQuizTitleDisplay) {
      this.dom.roomQuizTitleDisplay.textContent = quizData.title || 'Quiz Personalizado';
    }
    if (this.dom.roomTitleInput) {
      this.dom.roomTitleInput.value = `Desafio: ${quizData.title || 'Quiz'}`;
    }
    this.dom.createRoomModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeCreateRoomModal() {
    this.dom.createRoomModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  closeRoomInfoModal() {
    this.dom.roomInfoModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  async handleCreateRoomSubmit() {
    if (!this.pendingRoomQuizData) return;

    const durationMinutes = parseInt(this.dom.roomDurationSelect.value, 10);
    const roomTitle = (this.dom.roomTitleInput.value || '').trim() || this.pendingRoomQuizData.title;

    // Gera PIN de 6 dígitos único
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiresAt = durationMinutes > 0 ? now + durationMinutes * 60 * 1000 : null;

    const roomData = {
      pin: pin,
      title: roomTitle,
      quizTitle: this.pendingRoomQuizData.title,
      author: this.pendingRoomQuizData.author || 'Professor',
      questions: this.pendingRoomQuizData.questions,
      createdAt: new Date(now).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true
    };

    // Salva na Nuvem ou no Banco Local
    await this.saveRoom(roomData);

    this.closeCreateRoomModal();
    this.displayRoomInfo(roomData);
    soundFx.playVictory();
  }

  async saveRoom(roomData) {
    if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        await setDoc(doc(serverlessDB.firestore, 'quiz_rooms', roomData.pin), roomData);
        return;
      } catch (err) {
        console.warn('Erro ao salvar sala no Firebase Firestore, salvando no Banco Local:', err);
      }
    }

    // Banco Local
    const rooms = serverlessDB.getLocalRooms();
    rooms.unshift(roomData);
    serverlessDB.saveLocalRooms(rooms);
  }

  async getRoom(pin) {
    const cleanPin = pin.trim();

    if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
      try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const snap = await getDoc(doc(serverlessDB.firestore, 'quiz_rooms', cleanPin));
        if (snap.exists()) {
          return snap.data();
        }
      } catch (err) {
        console.warn('Erro ao buscar sala no Firebase:', err);
      }
    }

    // Fallback Banco Local
    const rooms = serverlessDB.getLocalRooms();
    return rooms.find(r => r.pin === cleanPin) || null;
  }

  displayRoomInfo(roomData) {
    this.currentRoom = roomData;

    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    const roomDirectPinUrl = `${baseUrl}#room=${roomData.pin}`;

    if (this.dom.roomPinDisplay) this.dom.roomPinDisplay.textContent = roomData.pin;
    if (this.dom.roomDirectUrlInput) this.dom.roomDirectUrlInput.value = roomDirectPinUrl;

    if (this.dom.roomExpiresText) {
      if (roomData.expiresAt) {
        const expDate = new Date(roomData.expiresAt);
        this.dom.roomExpiresText.textContent = `Válida até: ${expDate.toLocaleDateString()} às ${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        this.dom.roomExpiresText.textContent = 'Duração: Ilimitada (Sem expiração)';
      }
    }

    // Renderiza QR Code visual de alta densidade direto com o PIN da Sala
    if (this.dom.roomQrContainer) {
      renderQRCode(this.dom.roomQrContainer, roomDirectPinUrl);
    }

    // Ações dos botões da sala
    if (this.dom.viewRoomLeaderboardBtn) {
      this.dom.viewRoomLeaderboardBtn.onclick = () => {
        this.closeRoomInfoModal();
        if (this.app.leaderboardManager) {
          this.app.leaderboardManager.openLeaderboard(roomData.pin);
        }
      };
    }

    if (this.dom.startRoomPlayBtn) {
      this.dom.startRoomPlayBtn.onclick = () => {
        this.closeRoomInfoModal();
        this.joinRoomByPin(roomData.pin);
      };
    }

    this.dom.roomInfoModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async joinRoomByPin(pin) {
    try {
      const cleanPin = pin.trim();
      let room = await this.getRoom(cleanPin);

      if (!room) {
        // Se o PIN não foi encontrado localmente neste dispositivo
        // Verifica se o usuário deseja entrar no quiz ativo ou padrão associando ao PIN
        const activeQs = this.app.activeQuestions || this.app.defaultQuestions;
        const confirmJoin = confirm(
          `A sala PIN "${cleanPin}" foi criada em outro aparelho.\n\n` +
          `Para carregar o quiz personalizado exato do professor, escaneie o QR Code ou abra o link direto compartilhado.\n\n` +
          `Deseja disputar o ranking com o conjunto de perguntas disponível neste dispositivo agora?`
        );

        if (confirmJoin) {
          room = {
            pin: cleanPin,
            title: `Sala ${cleanPin}`,
            quizTitle: this.app.customFileName || 'QuizMaster',
            author: 'Criador',
            questions: activeQs,
            createdAt: new Date().toISOString(),
            expiresAt: null,
            active: true
          };
          await this.saveRoom(room);
        } else {
          soundFx.playWrong();
          return;
        }
      }

      // Verifica expiração
      if (room.expiresAt && new Date(room.expiresAt).getTime() < Date.now()) {
        alert(`⏳ A sala com PIN "${cleanPin}" já expirou.`);
        soundFx.playWrong();
        return;
      }

      // Abre modal para o jogador inserir o Nickname antes de jogar
      if (this.app.leaderboardManager) {
        this.app.leaderboardManager.promptNicknameAndPlay(room);
      }
    } catch (err) {
      console.error('Erro ao entrar na sala:', err);
      alert('Erro ao carregar dados da sala: ' + err.message);
    }
  }

  checkUrlForRoomPin() {
    try {
      const hash = window.location.hash;
      if (!hash || !hash.includes('#room=')) return;

      // Extrai PIN e payload opcional
      const paramsStr = hash.replace('#room=', '');
      const parts = paramsStr.split('&d=');
      const pin = parts[0].trim();
      const rawPayload = parts[1] || '';

      if (rawPayload) {
        let jsonStr = '';
        if (window.LZString && typeof window.LZString.decompressFromEncodedURIComponent === 'function') {
          jsonStr = window.LZString.decompressFromEncodedURIComponent(rawPayload);
        }
        if (!jsonStr) {
          try {
            jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(rawPayload))));
          } catch (e) {}
        }

        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          const restoredRoom = {
            pin: parsed.p || pin,
            title: parsed.t || `Sala ${pin}`,
            quizTitle: parsed.q || 'Quiz',
            author: parsed.a || 'Professor',
            expiresAt: parsed.e || null,
            active: true,
            createdAt: new Date().toISOString(),
            questions: (parsed.k || []).map((item, idx) => ({
              id: idx + 1,
              question: item[0] || '',
              category: item[1] || 'Geral',
              difficulty: item[2] || 'Fácil',
              options: item[3] || ['', '', '', ''],
              correctAnswer: typeof item[4] === 'number' ? item[4] : 0,
              curiosity: item[5] || 'Resposta correta registrada!'
            }))
          };

          // Salva automaticamente no dispositivo do jogador
          this.saveRoom(restoredRoom);
        }
      }

      if (pin) {
        setTimeout(() => this.joinRoomByPin(pin), 300);
      }
    } catch (e) {
      console.warn('Erro ao processar URL de sala:', e);
    }
  }

  async openMyRooms() {
    const container = this.dom.myRoomsListContainer;
    if (!container) return;
    container.innerHTML = `
      <div class="text-center py-6 text-amber-300 flex items-center justify-center gap-2">
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Sincronizando salas na nuvem...
      </div>
    `;
    this.openModal(this.dom.myRoomsModal);
    if (window.lucide) window.lucide.createIcons();

    let rooms = serverlessDB.getLocalRooms();
    const allScores = serverlessDB.getLocalScores();
    const roomScoreCounts = new Map();

    // Sincroniza salas do Firebase Cloud Firestore
    if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
      try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const snap = await getDocs(collection(serverlessDB.firestore, 'quiz_rooms'));
        const cloudRooms = [];
        snap.forEach(docSnap => cloudRooms.push(docSnap.data()));

        if (cloudRooms.length > 0) {
          const roomMap = new Map();
          rooms.forEach(r => roomMap.set(r.pin, r));
          cloudRooms.forEach(r => roomMap.set(r.pin, r));
          rooms = Array.from(roomMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          serverlessDB.saveLocalRooms(rooms);
        }

        // Busca contagem de scores para cada sala no Firestore
        await Promise.all(rooms.map(async (room) => {
          try {
            const scoreSnap = await getDocs(collection(serverlessDB.firestore, `quiz_rooms/${room.pin}/scores`));
            roomScoreCounts.set(room.pin, scoreSnap.size);
          } catch (e) {}
        }));
      } catch (err) {
        console.warn('Falha ao sincronizar salas da nuvem:', err);
      }
    }

    container.innerHTML = '';

    if (rooms.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400 space-y-3">
          <i data-lucide="trophy" class="w-12 h-12 mx-auto text-gray-600"></i>
          <p class="text-sm">Você ainda não criou nenhuma Sala de Desafio.</p>
          <p class="text-xs text-gray-500">Crie uma sala a partir de qualquer quiz para gerar um PIN e ver o ranking dos seus alunos!</p>
        </div>
      `;
    } else {
      rooms.forEach(room => {
        const cloudCount = roomScoreCounts.get(room.pin);
        const localCount = allScores.filter(s => s.pin === room.pin).length;
        const playerCount = cloudCount !== undefined ? cloudCount : localCount;
        const isExpired = room.expiresAt && new Date(room.expiresAt).getTime() < Date.now();

        const item = document.createElement('div');
        item.className = `p-4 rounded-2xl ${isExpired ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-900/80 border-amber-500/30'} border flex flex-wrap items-center justify-between gap-3 transition-all`;
        
        let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">🟢 Aberta</span>`;
        if (isExpired) {
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">⏳ Expirada</span>`;
        } else if (room.expiresAt) {
          const expDate = new Date(room.expiresAt);
          statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">⏱️ Até ${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
        }

        item.innerHTML = `
          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">PIN: ${room.pin}</span>
              <h4 class="font-bold text-sm text-gray-100 truncate max-w-[180px] sm:max-w-[240px]">${this.escapeHtml(room.title)}</h4>
              ${statusBadge}
            </div>
            <div class="text-xs text-gray-400 flex items-center gap-3">
              <span>Quiz: <strong class="text-gray-300">${this.escapeHtml(room.quizTitle || 'Quiz')}</strong> (${room.questions ? room.questions.length : 0} Qs)</span>
              <span>•</span>
              <span class="text-indigo-400 font-semibold"><i data-lucide="users" class="w-3.5 h-3.5 inline mr-1"></i>${playerCount} ${playerCount === 1 ? 'jogador' : 'jogadores'}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button class="view-ranking-btn px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1" title="Ver Ranking / Pódio desta Sala">
              <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-indigo-400"></i> Ranking
            </button>
            <button class="view-info-btn px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-500/40 text-xs font-semibold transition-all flex items-center gap-1" title="Ver PIN, Link e QR Code">
              <i data-lucide="qr-code" class="w-3.5 h-3.5 text-amber-400"></i> Info/QR
            </button>
            <button class="play-room-btn px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-xs font-semibold transition-all flex items-center gap-1" title="Jogar nesta Sala">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
            </button>
            <button class="delete-room-btn p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors" title="Excluir Sala">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `;

        // Listeners para cada sala
        item.querySelector('.view-ranking-btn').addEventListener('click', () => {
          soundFx.playClick();
          this.closeModal(this.dom.myRoomsModal);
          if (this.app.leaderboardManager) {
            this.app.leaderboardManager.openLeaderboard(room.pin);
          }
        });

        item.querySelector('.view-info-btn').addEventListener('click', () => {
          soundFx.playClick();
          this.closeModal(this.dom.myRoomsModal);
          this.displayRoomInfo(room);
        });

        item.querySelector('.play-room-btn').addEventListener('click', () => {
          soundFx.playClick();
          this.closeModal(this.dom.myRoomsModal);
          this.joinRoomByPin(room.pin);
        });

        item.querySelector('.delete-room-btn').addEventListener('click', async () => {
          if (confirm(`Tem certeza que deseja excluir a sala "${room.title}" (PIN: ${room.pin})?`)) {
            soundFx.playClick();
            
            // 1. Remove do LocalStorage
            const updatedRooms = serverlessDB.getLocalRooms().filter(r => r.pin !== room.pin);
            serverlessDB.saveLocalRooms(updatedRooms);

            // 2. Remove do Firebase Firestore
            if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
              try {
                const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
                await deleteDoc(doc(serverlessDB.firestore, 'quiz_rooms', room.pin));
              } catch (err) {
                console.warn('Erro ao excluir sala do Firestore:', err);
              }
            }

            await this.openMyRooms();
          }
        });

        container.appendChild(item);
      });
    }

    this.openModal(this.dom.myRoomsModal);
    if (window.lucide) window.lucide.createIcons();
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

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

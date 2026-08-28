/**
 * Gerenciador de Salas de Desafio com Tempo de Validade (Estilo Kahoot)
 * Funciona no Frontend com suporte a Firebase Firestore e Banco Local
 */
import { serverlessDB } from './firebaseConfig.js';
import { encodeQuizToUrl, renderQRCode, copyToClipboard } from './shareManager.js';
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
    
    // Codifica payload portátil da sala para funcionar em qualquer dispositivo/celular
    let roomUrl = `${baseUrl}#room=${roomData.pin}`;
    try {
      const minifiedRoom = {
        p: roomData.pin,
        t: roomData.title,
        q: roomData.quizTitle,
        a: roomData.author,
        e: roomData.expiresAt,
        k: (roomData.questions || []).map(item => [
          item.question,
          item.category || 'Geral',
          item.difficulty || 'Fácil',
          item.options,
          item.correctAnswer,
          item.curiosity || ''
        ])
      };
      const jsonStr = JSON.stringify(minifiedRoom);
      let payload = '';
      if (window.LZString && typeof window.LZString.compressToEncodedURIComponent === 'function') {
        payload = window.LZString.compressToEncodedURIComponent(jsonStr);
      } else {
        payload = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
      }
      roomUrl = `${baseUrl}#room=${roomData.pin}&d=${payload}`;
    } catch (e) {
      console.warn('Erro ao codificar payload da sala:', e);
    }

    if (this.dom.roomPinDisplay) this.dom.roomPinDisplay.textContent = roomData.pin;
    if (this.dom.roomDirectUrlInput) this.dom.roomDirectUrlInput.value = roomUrl;

    if (this.dom.roomExpiresText) {
      if (roomData.expiresAt) {
        const expDate = new Date(roomData.expiresAt);
        this.dom.roomExpiresText.textContent = `Válida até: ${expDate.toLocaleDateString()} às ${expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        this.dom.roomExpiresText.textContent = 'Duração: Ilimitada (Sem expiração)';
      }
    }

    // Renderiza QR Code da Sala
    if (this.dom.roomQrContainer) {
      renderQRCode(this.dom.roomQrContainer, roomUrl);
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
}

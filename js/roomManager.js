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
    const roomUrl = `${baseUrl}#room=${roomData.pin}`;

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
      const room = await this.getRoom(pin);
      if (!room) {
        alert(`❌ Sala com PIN "${pin}" não foi encontrada.`);
        soundFx.playWrong();
        return;
      }

      // Verifica expiração
      if (room.expiresAt && new Date(room.expiresAt).getTime() < Date.now()) {
        alert(`⏳ A sala com PIN "${pin}" já expirou.`);
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
    const hash = window.location.hash;
    if (hash && hash.startsWith('#room=')) {
      const pin = hash.replace('#room=', '').trim();
      if (pin) {
        setTimeout(() => this.joinRoomByPin(pin), 300);
      }
    }
  }
}

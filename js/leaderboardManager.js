/**
 * Gerenciador de Ranking em Tempo Real e Pódio Estilo Kahoot
 * Funciona 100% no Frontend com suporte a Firebase Firestore e Banco Local
 */
import { serverlessDB } from './firebaseConfig.js';
import { soundFx } from './audio.js';

const AVATARS = ['🎓', '🚀', '🧠', '🦁', '🦊', '🤖', '🧙‍♂️', '👑', '⚡', '🌟', '🐱', '🐶', '👾', '🎯', '🏆', '🔥'];

export class LeaderboardManager {
  constructor(app) {
    this.app = app;
    this.activeRoomForPlayer = null;
    this.playerNickname = '';
    this.selectedPlayerAvatar = '🚀';
    this.firestoreUnsubscribe = null;

    this.dom = {
      // Nickname Prompt Modal
      nicknameModal: document.getElementById('player-nickname-modal'),
      closeNicknameModalBtn: document.getElementById('close-nickname-modal-btn'),
      nicknameForm: document.getElementById('player-nickname-form'),
      nicknameInput: document.getElementById('player-nickname-input'),
      nicknameRoomTitle: document.getElementById('nickname-room-title'),
      nicknameRoomPin: document.getElementById('nickname-room-pin'),
      playerAvatarPreview: document.getElementById('player-avatar-preview'),
      playerEmojiGrid: document.getElementById('player-emoji-grid'),
      confirmNicknameBtn: document.getElementById('confirm-nickname-btn'),

      // Leaderboard / Podium Modal
      leaderboardModal: document.getElementById('room-leaderboard-modal'),
      closeLeaderboardModalBtn: document.getElementById('close-leaderboard-modal-btn'),
      leaderboardRoomTitle: document.getElementById('leaderboard-room-title'),
      leaderboardPinText: document.getElementById('leaderboard-pin-text'),
      leaderboardPlayerCount: document.getElementById('leaderboard-player-count'),
      refreshLeaderboardBtn: document.getElementById('refresh-leaderboard-btn'),

      // Podium 🥇🥈🥉
      podiumContainer: document.getElementById('podium-container'),
      podium1Name: document.getElementById('podium-1-name'),
      podium1Score: document.getElementById('podium-1-score'),
      podium2Name: document.getElementById('podium-2-name'),
      podium2Score: document.getElementById('podium-2-score'),
      podium3Name: document.getElementById('podium-3-name'),
      podium3Score: document.getElementById('podium-3-score'),

      // Leaderboard Table
      leaderboardTableBody: document.getElementById('leaderboard-table-body'),
      leaderboardEmptyState: document.getElementById('leaderboard-empty-state')
    };

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Fechar modais
    if (this.dom.closeNicknameModalBtn) {
      this.dom.closeNicknameModalBtn.addEventListener('click', () => this.closeNicknameModal());
    }
    if (this.dom.closeLeaderboardModalBtn) {
      this.dom.closeLeaderboardModalBtn.addEventListener('click', () => this.closeLeaderboardModal());
    }

    // Submissão do Nickname
    if (this.dom.nicknameForm) {
      this.dom.nicknameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleNicknameSubmit();
      });
    }

    // Atualizar ranking
    if (this.dom.refreshLeaderboardBtn) {
      this.dom.refreshLeaderboardBtn.addEventListener('click', () => {
        soundFx.playClick();
        if (this.currentLeaderboardPin) {
          this.loadLeaderboardScores(this.currentLeaderboardPin);
        }
      });
    }
  }

  promptNicknameAndPlay(room) {
    this.activeRoomForPlayer = room;
    if (this.dom.nicknameRoomTitle) this.dom.nicknameRoomTitle.textContent = room.title;
    if (this.dom.nicknameRoomPin) this.dom.nicknameRoomPin.textContent = `PIN: ${room.pin}`;
    
    // Define avatar padrão (do usuário logado ou foguete 🚀)
    if (this.app.authManager && this.app.authManager.currentUser && this.app.authManager.currentUser.avatarEmoji) {
      this.selectedPlayerAvatar = this.app.authManager.currentUser.avatarEmoji;
    } else {
      this.selectedPlayerAvatar = '🚀';
    }

    if (this.dom.playerAvatarPreview) {
      this.dom.playerAvatarPreview.textContent = this.selectedPlayerAvatar;
    }

    // Renderiza botões de emoji no modal de nickname
    if (this.dom.playerEmojiGrid) {
      this.dom.playerEmojiGrid.innerHTML = '';
      AVATARS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `emoji-avatar-btn p-1 rounded-lg border flex items-center justify-center text-lg transition-all ${
          emoji === this.selectedPlayerAvatar 
            ? 'selected bg-indigo-600/40 border-indigo-500' 
            : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-700'
        }`;
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
          soundFx.playClick();
          this.selectedPlayerAvatar = emoji;
          if (this.dom.playerAvatarPreview) {
            this.dom.playerAvatarPreview.textContent = emoji;
          }
          this.promptNicknameAndPlay(this.activeRoomForPlayer);
        });
        this.dom.playerEmojiGrid.appendChild(btn);
      });
    }

    if (this.dom.nicknameInput) {
      this.dom.nicknameInput.value = (this.app.authManager && this.app.authManager.currentUser) ? this.app.authManager.currentUser.name : '';
      setTimeout(() => this.dom.nicknameInput.focus(), 150);
    }
    this.dom.nicknameModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeNicknameModal() {
    this.dom.nicknameModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  handleNicknameSubmit() {
    const nick = (this.dom.nicknameInput.value || '').trim();
    if (!nick) {
      alert('Por favor, informe seu nome ou apelido para o ranking.');
      return;
    }

    this.playerNickname = nick;
    this.closeNicknameModal();

    // Carrega perguntas da sala no motor de jogo
    this.app.activeQuestions = this.activeRoomForPlayer.questions;
    this.app.isCustomQuiz = true;
    this.app.customFileName = `${this.activeRoomForPlayer.title} (PIN: ${this.activeRoomForPlayer.pin})`;
    this.app.dom.quizSourceLabel.innerHTML = `🎮 <strong class="text-indigo-400">${this.activeRoomForPlayer.title}</strong> • Jogador: <strong class="text-pink-400">${this.selectedPlayerAvatar} ${this.playerNickname}</strong>`;
    this.app.dom.resetDefaultQuizBtn.classList.remove('hidden');

    soundFx.playClick();
    this.app.startQuiz();
  }

  /**
   * Chamado quando o jogador conclui o quiz dentro de uma sala
   */
  async recordPlayerScore(score, accuracy, maxStreak) {
    if (!this.activeRoomForPlayer || !this.playerNickname) return;

    const scoreData = {
      pin: this.activeRoomForPlayer.pin,
      nickname: this.playerNickname,
      avatarEmoji: this.selectedPlayerAvatar || '🚀',
      score: score,
      accuracy: accuracy,
      maxStreak: maxStreak,
      completedAt: new Date().toISOString()
    };

    await this.saveScoreToRoom(scoreData);

    // Abre o Leaderboard da sala com confetes
    setTimeout(() => {
      this.openLeaderboard(this.activeRoomForPlayer.pin);
    }, 1200);
  }

  async saveScoreToRoom(scoreData) {
    if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
      try {
        const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        await addDoc(collection(serverlessDB.firestore, `quiz_rooms/${scoreData.pin}/scores`), scoreData);
        return;
      } catch (err) {
        console.warn('Erro ao salvar pontuação no Firebase Firestore:', err);
      }
    }

    // Banco Local
    const allScores = serverlessDB.getLocalScores();
    allScores.push(scoreData);
    serverlessDB.saveLocalScores(allScores);
  }

  async openLeaderboard(pin) {
    this.currentLeaderboardPin = pin;
    if (this.dom.leaderboardPinText) this.dom.leaderboardPinText.textContent = `PIN: ${pin}`;

    // Busca detalhes da sala
    if (this.app.roomManager) {
      const room = await this.app.roomManager.getRoom(pin);
      if (room && this.dom.leaderboardRoomTitle) {
        this.dom.leaderboardRoomTitle.textContent = room.title || 'Ranking da Sala';
      }
    }

    this.dom.leaderboardModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();

    // Inicia escuta em tempo real ou carregamento local
    this.setupRealtimeScores(pin);
  }

  closeLeaderboardModal() {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }
    this.dom.leaderboardModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  async setupRealtimeScores(pin) {
    // 1. Se Firebase Firestore estiver ativo, usa escuta em tempo real (onSnapshot)
    if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
      try {
        const { collection, query, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        const q = query(collection(serverlessDB.firestore, `quiz_rooms/${pin}/scores`), orderBy('score', 'desc'));
        
        if (this.firestoreUnsubscribe) this.firestoreUnsubscribe();

        this.firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
          const scores = [];
          snapshot.forEach(doc => scores.push(doc.data()));
          this.renderLeaderboardUI(scores);
        });
        return;
      } catch (err) {
        console.warn('Erro ao configurar listener em tempo real no Firebase:', err);
      }
    }

    // 2. Banco Local
    this.loadLeaderboardScores(pin);
  }

  loadLeaderboardScores(pin) {
    const allScores = serverlessDB.getLocalScores();
    const roomScores = allScores
      .filter(s => s.pin === pin)
      .sort((a, b) => b.score - a.score);

    this.renderLeaderboardUI(roomScores);
  }

  renderLeaderboardUI(scores) {
    if (this.dom.leaderboardPlayerCount) {
      this.dom.leaderboardPlayerCount.textContent = `${scores.length} ${scores.length === 1 ? 'jogador' : 'jogadores'}`;
    }

    // Atualiza Pódio (Top 3) com Avatar
    const top1 = scores[0];
    const top2 = scores[1];
    const top3 = scores[2];

    if (this.dom.podium1Name) {
      this.dom.podium1Name.innerHTML = top1 ? `<span class="mr-1">${top1.avatarEmoji || '👑'}</span>${this.escapeHtml(top1.nickname)}` : '-';
    }
    if (this.dom.podium1Score) this.dom.podium1Score.textContent = top1 ? `${top1.score} pts` : '0 pts';

    if (this.dom.podium2Name) {
      this.dom.podium2Name.innerHTML = top2 ? `<span class="mr-1">${top2.avatarEmoji || '🥈'}</span>${this.escapeHtml(top2.nickname)}` : '-';
    }
    if (this.dom.podium2Score) this.dom.podium2Score.textContent = top2 ? `${top2.score} pts` : '0 pts';

    if (this.dom.podium3Name) {
      this.dom.podium3Name.innerHTML = top3 ? `<span class="mr-1">${top3.avatarEmoji || '🥉'}</span>${this.escapeHtml(top3.nickname)}` : '-';
    }
    if (this.dom.podium3Score) this.dom.podium3Score.textContent = top3 ? `${top3.score} pts` : '0 pts';

    // Tabela completa
    if (this.dom.leaderboardTableBody) {
      this.dom.leaderboardTableBody.innerHTML = '';

      if (scores.length === 0) {
        if (this.dom.leaderboardEmptyState) this.dom.leaderboardEmptyState.classList.remove('hidden');
      } else {
        if (this.dom.leaderboardEmptyState) this.dom.leaderboardEmptyState.classList.add('hidden');

        scores.forEach((player, index) => {
          const rank = index + 1;
          let rankBadge = `<span class="font-bold text-gray-400">#${rank}</span>`;
          if (rank === 1) rankBadge = `<span class="text-xl">🥇</span>`;
          else if (rank === 2) rankBadge = `<span class="text-xl">🥈</span>`;
          else if (rank === 3) rankBadge = `<span class="text-xl">🥉</span>`;

          const avatar = player.avatarEmoji || '👤';

          const row = document.createElement('tr');
          row.className = `border-b border-gray-800/60 ${rank <= 3 ? 'bg-indigo-950/20' : 'hover:bg-gray-800/40'} transition-colors`;
          row.innerHTML = `
            <td class="py-3 px-4 text-center">${rankBadge}</td>
            <td class="py-3 px-4 font-bold text-white flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600/40 to-pink-600/40 border border-white/10 flex items-center justify-center text-base shrink-0 select-none shadow-sm">
                ${avatar}
              </div>
              <span class="truncate max-w-[130px] sm:max-w-[200px]">${this.escapeHtml(player.nickname)}</span>
            </td>
            <td class="py-3 px-4 text-right font-display font-extrabold text-indigo-400">${player.score} pts</td>
            <td class="py-3 px-4 text-right font-semibold text-emerald-400 hidden sm:table-cell">${player.accuracy}%</td>
            <td class="py-3 px-4 text-right font-semibold text-amber-400 hidden md:table-cell">${player.maxStreak || 0}x</td>
          `;
          this.dom.leaderboardTableBody.appendChild(row);
        });
      }
    }

    if (scores.length > 0) {
      soundFx.playVictory();
      this.app.triggerGrandConfetti();
    }
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

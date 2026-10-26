/**
 * Gerenciador de Autenticação e Contas de Usuário (Email e Senha)
 * Funciona 100% no Frontend com suporte a Firebase Auth e Banco Local
 */
import { serverlessDB } from './firebaseConfig.js';
import { soundFx } from './audio.js';
import { aiService } from './aiService.js';

const STORAGE_SESSION_USER = 'QUIZMASTER_SESSION_USER';
const STORAGE_LOCAL_AVATAR = 'QUIZMASTER_LOCAL_AVATAR';
const STORAGE_LOCAL_NICKNAME = 'QUIZMASTER_LOCAL_NICKNAME';
const STORAGE_GUEST_ID = 'QUIZMASTER_GUEST_ID';

export const AVATAR_EMOJIS = [
  '🎓', '🧠', '📚', '🔬', '🧪', '💡', '🎨', '🏛️',
  '🚀', '🛸', '🪐', '🌟', '⚡', '🤖', '👾', '🔮',
  '🦁', '🦊', '🐯', '🐼', '🦉', '🦖', '🐙', '🐬', '🦄', '🦅',
  '👑', '🧙‍♂️', '🥷', '🦸', '🎮', '💎', '🛡️', '⚔️', '🎯', '🏆', '🔥', '🎪',
  '🐱', '🐶'
];

export class AuthManager {
  constructor(app) {
    this.app = app;
    this.currentUser = this.loadSessionUser();
    this.authListeners = [];
    this.selectedGuestEmoji = this.getLocalAvatar();

    this.dom = {
      // Header Auth Elements
      authBtn: document.getElementById('header-auth-btn'),
      userProfileBtn: document.getElementById('header-user-profile-btn'),
      userAvatarText: document.getElementById('header-user-avatar-text'),
      userDisplayName: document.getElementById('header-user-name'),
      mobileUserProfileBtn: document.getElementById('mobile-user-profile-btn'),
      mobileUserAvatarText: document.getElementById('mobile-user-avatar-text'),

      // Welcome Screen Player Badge
      welcomePlayerBadgeBtn: document.getElementById('welcome-player-badge-btn'),
      welcomePlayerAvatarText: document.getElementById('welcome-player-avatar-text'),
      welcomePlayerNameText: document.getElementById('welcome-player-name-text'),

      // Auth Modal
      authModal: document.getElementById('auth-modal'),
      closeAuthModalBtn: document.getElementById('close-auth-modal-btn'),
      authForm: document.getElementById('auth-form'),
      authTitle: document.getElementById('auth-modal-title'),
      authSubtitle: document.getElementById('auth-modal-subtitle'),
      authSubmitBtn: document.getElementById('auth-submit-btn'),
      authNameGroup: document.getElementById('auth-name-group'),
      authNameInput: document.getElementById('auth-name-input'),
      authEmailInput: document.getElementById('auth-email-input'),
      authPasswordInput: document.getElementById('auth-password-input'),
      authToggleModeBtn: document.getElementById('auth-toggle-mode-btn'),
      authToggleModeText: document.getElementById('auth-toggle-mode-text'),
      googleAuthBtn: document.getElementById('google-auth-btn'),
      guestAuthBtn: document.getElementById('guest-auth-btn'),
      authErrorMsg: document.getElementById('auth-error-msg'),

      // Guest Setup Modal
      guestSetupModal: document.getElementById('guest-setup-modal'),
      closeGuestSetupBtn: document.getElementById('close-guest-setup-btn'),
      guestAvatarPreview: document.getElementById('guest-avatar-preview'),
      guestEmojiGrid: document.getElementById('guest-emoji-grid'),
      guestNicknameInput: document.getElementById('guest-nickname-input'),
      guestSetupForm: document.getElementById('guest-setup-form'),
      confirmGuestBtn: document.getElementById('confirm-guest-btn'),

      // User Profile / Settings Modal
      profileModal: document.getElementById('user-profile-modal'),
      closeProfileModalBtn: document.getElementById('close-profile-modal-btn'),
      profileEmailText: document.getElementById('profile-email-text'),
      profileNameText: document.getElementById('profile-name-text'),
      profileNicknameInput: document.getElementById('profile-nickname-input'),
      profileLoginPromptBtn: document.getElementById('profile-login-prompt-btn'),
      profileAvatarDisplay: document.getElementById('profile-avatar-display'),
      profileEmojiGrid: document.getElementById('profile-emoji-grid'),
      profileApiKeyInput: document.getElementById('profile-api-key-input'),
      profileApiKeyBadge: document.getElementById('profile-api-key-badge'),
      profileToggleKeyVisibilityBtn: document.getElementById('profile-toggle-key-visibility-btn'),
      profileSaveApiKeyBtn: document.getElementById('profile-save-api-key-btn'),
      profileClearApiKeyBtn: document.getElementById('profile-clear-api-key-btn'),
      profileApiKeyFeedback: document.getElementById('profile-api-key-feedback'),
      profileThemeBtn: document.getElementById('profile-theme-btn'),
      logoutBtn: document.getElementById('profile-logout-btn'),
      deleteAccountBtn: document.getElementById('profile-delete-account-btn'),
      openCloudConfigBtn: document.getElementById('open-cloud-config-btn'),
      drawerUserAvatarText: document.getElementById('drawer-user-avatar-text'),

      // Cloud Config Modal
      cloudModal: document.getElementById('cloud-config-modal'),
      closeCloudModalBtn: document.getElementById('close-cloud-modal-btn'),
      cloudConfigJsonInput: document.getElementById('cloud-config-json-input'),
      saveCloudConfigBtn: document.getElementById('save-cloud-config-btn'),
      resetCloudConfigBtn: document.getElementById('reset-cloud-config-btn'),
      cloudStatusBadge: document.getElementById('cloud-status-badge')
    };

    this.isRegisterMode = false;
    this.init();
  }

  getLocalAvatar() {
    try {
      return localStorage.getItem(STORAGE_LOCAL_AVATAR) || '🎓';
    } catch (e) {
      return '🎓';
    }
  }

  setLocalAvatar(emoji) {
    try {
      localStorage.setItem(STORAGE_LOCAL_AVATAR, emoji);
    } catch (e) {}
  }

  getLocalNickname() {
    try {
      return localStorage.getItem(STORAGE_LOCAL_NICKNAME) || 'Jogador';
    } catch (e) {
      return 'Jogador';
    }
  }

  setLocalNickname(name) {
    try {
      localStorage.setItem(STORAGE_LOCAL_NICKNAME, name);
    } catch (e) {}
  }

  getDefaultGuestUser() {
    let guestId = null;
    try {
      guestId = localStorage.getItem(STORAGE_GUEST_ID);
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem(STORAGE_GUEST_ID, guestId);
      }
    } catch (e) {
      guestId = 'guest_local';
    }

    return {
      uid: guestId,
      name: this.getLocalNickname(),
      email: 'Convidado',
      isGuest: true,
      avatarEmoji: this.getLocalAvatar(),
      provider: 'guest'
    };
  }

  getAccountApiKey() {
    if (this.currentUser && !this.currentUser.isGuest) {
      if (this.currentUser.geminiApiKey) return this.currentUser.geminiApiKey;
      const cached = localStorage.getItem(`QUIZMASTER_USER_AI_KEY_${this.currentUser.uid}`);
      if (cached) return cached;
    }
    return localStorage.getItem('QUIZMASTER_AI_API_KEY') || '';
  }

  async saveAccountApiKey(key) {
    const cleanKey = (key || '').trim();
    const isGuest = !this.currentUser || !!this.currentUser.isGuest;
    const currentUid = this.currentUser?.uid;

    if (!isGuest && currentUid) {
      this.currentUser.geminiApiKey = cleanKey;
      if (cleanKey) {
        localStorage.setItem(`QUIZMASTER_USER_AI_KEY_${currentUid}`, cleanKey);
      } else {
        localStorage.removeItem(`QUIZMASTER_USER_AI_KEY_${currentUid}`);
      }
      this.saveSessionUser(this.currentUser);

      // Sincroniza com Firebase Cloud Firestore se autenticado com conta
      if (serverlessDB.isCloudEnabled && serverlessDB.firestore) {
        try {
          const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
          await setDoc(doc(serverlessDB.firestore, 'user_profiles', currentUid), {
            geminiApiKey: cleanKey,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.warn('Erro ao salvar chave de API no Firestore:', err);
        }
      }
    } else {
      if (cleanKey) {
        localStorage.setItem('QUIZMASTER_AI_API_KEY', cleanKey);
      } else {
        localStorage.removeItem('QUIZMASTER_AI_API_KEY');
      }
    }

    aiService.setApiKey(cleanKey);
    this.updateProfileApiKeyUI();
    this.notifyListeners();
  }

  async removeAccountApiKey() {
    await this.saveAccountApiKey('');
  }

  updateProfileApiKeyUI() {
    const key = this.getAccountApiKey();
    if (this.dom.profileApiKeyInput) {
      this.dom.profileApiKeyInput.value = key;
    }
    if (this.dom.profileApiKeyBadge) {
      const isGuest = !this.currentUser || !!this.currentUser.isGuest;
      if (key) {
        this.dom.profileApiKeyBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        this.dom.profileApiKeyBadge.innerHTML = isGuest 
          ? '🟢 Salva neste aparelho' 
          : '🟢 Guardada na sua Conta (Nuvem)';
      } else {
        this.dom.profileApiKeyBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-bold bg-gray-800 text-gray-400 border border-gray-700';
        this.dom.profileApiKeyBadge.textContent = 'Não configurada';
      }
    }
  }

  async init() {
    await serverlessDB.init();
    this.bindEvents();
    this.updateUI();

    // Se Firebase estiver ativo, escuta mudanças de auth
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      onAuthStateChanged(serverlessDB.auth, async (user) => {
        if (user) {
          let userEmoji = this.getLocalAvatar();
          let userName = user.displayName || user.email.split('@')[0];
          let userApiKey = localStorage.getItem(`QUIZMASTER_USER_AI_KEY_${user.uid}`) || '';

          if (serverlessDB.firestore) {
            try {
              const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
              const profileSnap = await getDoc(doc(serverlessDB.firestore, 'user_profiles', user.uid));
              if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                if (profileData.avatarEmoji) userEmoji = profileData.avatarEmoji;
                if (profileData.name) userName = profileData.name;
                if (profileData.geminiApiKey) userApiKey = profileData.geminiApiKey;
              }
            } catch (err) {
              console.warn('Erro ao carregar perfil do Firestore:', err);
            }
          }

          this.currentUser = {
            uid: user.uid,
            email: user.email,
            name: userName,
            avatarEmoji: userEmoji,
            geminiApiKey: userApiKey,
            isGuest: false,
            provider: 'firebase'
          };
          this.setLocalAvatar(userEmoji);
          if (userApiKey) {
            localStorage.setItem(`QUIZMASTER_USER_AI_KEY_${user.uid}`, userApiKey);
            aiService.setApiKey(userApiKey);
          }
          this.saveSessionUser(this.currentUser);
        } else {
          if (this.currentUser && this.currentUser.provider === 'firebase') {
            this.currentUser = this.getDefaultGuestUser();
            this.saveSessionUser(this.currentUser);
            const fallbackKey = localStorage.getItem('QUIZMASTER_AI_API_KEY') || '';
            aiService.setApiKey(fallbackKey);
          }
        }
        this.updateUI();
        this.notifyListeners();
      });
    }
  }

  loadSessionUser() {
    try {
      const data = localStorage.getItem(STORAGE_SESSION_USER);
      if (data) {
        const user = JSON.parse(data);
        if (user) {
          if (!user.avatarEmoji) {
            user.avatarEmoji = this.getLocalAvatar();
          }
          if (user.geminiApiKey) {
            aiService.setApiKey(user.geminiApiKey);
          } else if (user.uid && !user.isGuest) {
            const cachedKey = localStorage.getItem(`QUIZMASTER_USER_AI_KEY_${user.uid}`);
            if (cachedKey) {
              user.geminiApiKey = cachedKey;
              aiService.setApiKey(cachedKey);
            }
          }
          return user;
        }
      }
    } catch (e) {}
    return this.getDefaultGuestUser();
  }

  saveSessionUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_SESSION_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION_USER);
    }
  }

  onAuthChange(callback) {
    this.authListeners.push(callback);
  }

  notifyListeners() {
    this.authListeners.forEach(cb => cb(this.currentUser));
  }

  bindEvents() {
    // Abrir Modal de Login
    if (this.dom.authBtn) {
      this.dom.authBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openAuthModal(false);
      });
    }

    // Abrir Perfil / Logout
    if (this.dom.userProfileBtn) {
      this.dom.userProfileBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openProfileModal();
      });
    }

    // Botão de Avatar Mobile
    if (this.dom.mobileUserProfileBtn) {
      this.dom.mobileUserProfileBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openProfileModal();
      });
    }

    // Badge do Jogador na Tela Inicial (Welcome)
    if (this.dom.welcomePlayerBadgeBtn) {
      this.dom.welcomePlayerBadgeBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openProfileModal();
      });
    }

    // Edição do Nickname no Modal de Perfil
    if (this.dom.profileNicknameInput) {
      const handleNameChange = (e) => {
        const val = (e.target.value || '').trim();
        if (val) {
          if (!this.currentUser) this.currentUser = this.getDefaultGuestUser();
          this.currentUser.name = val;
          this.setLocalNickname(val);
          this.saveSessionUser(this.currentUser);
          this.updateUI();
          this.notifyListeners();
        }
      };
      this.dom.profileNicknameInput.addEventListener('change', handleNameChange);
      this.dom.profileNicknameInput.addEventListener('blur', handleNameChange);
      this.dom.profileNicknameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          handleNameChange(e);
          this.dom.profileNicknameInput.blur();
        }
      });
    }

    // Botão Criar Conta / Login a partir do perfil de Convidado
    if (this.dom.profileLoginPromptBtn) {
      this.dom.profileLoginPromptBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeProfileModal();
        this.openAuthModal(false);
      });
    }

    // Salvar Chave de API Google Gemini no Perfil
    if (this.dom.profileSaveApiKeyBtn) {
      this.dom.profileSaveApiKeyBtn.addEventListener('click', async () => {
        soundFx.playClick();
        const val = (this.dom.profileApiKeyInput?.value || '').trim();
        if (!val) {
          if (this.dom.profileApiKeyFeedback) {
            this.dom.profileApiKeyFeedback.textContent = '⚠️ Insira uma chave de API antes de salvar.';
            this.dom.profileApiKeyFeedback.className = 'text-[10px] font-semibold text-center text-amber-400 pt-0.5';
            this.dom.profileApiKeyFeedback.classList.remove('hidden');
          }
          return;
        }
        await this.saveAccountApiKey(val);
        soundFx.playSuccess();
        if (this.dom.profileApiKeyFeedback) {
          const isGuest = !this.currentUser || !!this.currentUser.isGuest;
          this.dom.profileApiKeyFeedback.textContent = isGuest 
            ? '✅ Chave salva neste dispositivo!' 
            : '✅ Chave de API guardada na sua conta!';
          this.dom.profileApiKeyFeedback.className = 'text-[10px] font-semibold text-center text-emerald-400 pt-0.5';
          this.dom.profileApiKeyFeedback.classList.remove('hidden');
          setTimeout(() => {
            this.dom.profileApiKeyFeedback?.classList.add('hidden');
          }, 3500);
        }
      });
    }

    // Remover Chave de API Google Gemini do Perfil
    if (this.dom.profileClearApiKeyBtn) {
      this.dom.profileClearApiKeyBtn.addEventListener('click', async () => {
        soundFx.playClick();
        await this.removeAccountApiKey();
        if (this.dom.profileApiKeyFeedback) {
          this.dom.profileApiKeyFeedback.textContent = 'Chave de API removida.';
          this.dom.profileApiKeyFeedback.className = 'text-[10px] font-semibold text-center text-gray-400 pt-0.5';
          this.dom.profileApiKeyFeedback.classList.remove('hidden');
          setTimeout(() => {
            this.dom.profileApiKeyFeedback?.classList.add('hidden');
          }, 2500);
        }
      });
    }

    // Alternar visibilidade da chave de API no Perfil
    if (this.dom.profileToggleKeyVisibilityBtn) {
      this.dom.profileToggleKeyVisibilityBtn.addEventListener('click', () => {
        if (!this.dom.profileApiKeyInput) return;
        const type = this.dom.profileApiKeyInput.type === 'password' ? 'text' : 'password';
        this.dom.profileApiKeyInput.type = type;
        this.dom.profileToggleKeyVisibilityBtn.innerHTML = type === 'password'
          ? `<i data-lucide="eye" class="w-4 h-4"></i>`
          : `<i data-lucide="eye-off" class="w-4 h-4 text-purple-400"></i>`;
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Clique no Avatar do Drawer Lateral para abrir personalização
    const drawerAvatarCard = document.getElementById('drawer-user-avatar-container');
    if (drawerAvatarCard) {
      drawerAvatarCard.classList.add('cursor-pointer', 'hover:scale-105', 'transition-transform');
      drawerAvatarCard.title = 'Personalizar Emoji de Avatar';
      drawerAvatarCard.addEventListener('click', () => {
        soundFx.playClick();
        if (this.app) this.app.closeMobileDrawer();
        this.openProfileModal();
      });
    }

    const drawerAuthCard = document.getElementById('drawer-auth-card');
    if (drawerAuthCard) {
      const drawerInfo = drawerAuthCard.querySelector('.min-w-0');
      if (drawerInfo) {
        drawerInfo.classList.add('cursor-pointer');
        drawerInfo.title = 'Personalizar Apelido e Emoji';
        drawerInfo.addEventListener('click', () => {
          soundFx.playClick();
          if (this.app) this.app.closeMobileDrawer();
          this.openProfileModal();
        });
      }
    }

    // Fechar Modais
    if (this.dom.closeAuthModalBtn) {
      this.dom.closeAuthModalBtn.addEventListener('click', () => this.closeAuthModal());
    }
    if (this.dom.closeProfileModalBtn) {
      this.dom.closeProfileModalBtn.addEventListener('click', () => this.closeProfileModal());
    }
    if (this.dom.closeCloudModalBtn) {
      this.dom.closeCloudModalBtn.addEventListener('click', () => this.closeCloudModal());
    }

    // Alternar entre Login e Cadastro
    if (this.dom.authToggleModeBtn) {
      this.dom.authToggleModeBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.toggleAuthMode();
      });
    }

    // Submissão do Formulário de Auth (Email e Senha)
    if (this.dom.authForm) {
      this.dom.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleAuthSubmit();
      });
    }

    // Login com o Google
    if (this.dom.googleAuthBtn) {
      this.dom.googleAuthBtn.addEventListener('click', async () => {
        soundFx.playClick();
        await this.handleGoogleAuth();
      });
    }

    // Botão Continuar como Convidado
    if (this.dom.guestAuthBtn) {
      this.dom.guestAuthBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeAuthModal();
        this.openGuestModal();
      });
    }

    // Fechar Modal de Convidado
    if (this.dom.closeGuestSetupBtn) {
      this.dom.closeGuestSetupBtn.addEventListener('click', () => this.closeGuestModal());
    }

    // Submissão do Formulário de Convidado
    if (this.dom.guestSetupForm) {
      this.dom.guestSetupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickname = (this.dom.guestNicknameInput.value || '').trim();
        if (!nickname) {
          alert('Por favor, informe seu apelido.');
          return;
        }
        this.loginAsGuest(nickname, this.selectedGuestEmoji || '🎓');
      });
    }

    // Logout
    if (this.dom.logoutBtn) {
      this.dom.logoutBtn.addEventListener('click', async () => {
        soundFx.playClick();
        await this.logout();
      });
    }

    // Excluir Conta Permanentemente
    if (this.dom.deleteAccountBtn) {
      this.dom.deleteAccountBtn.addEventListener('click', async () => {
        await this.handleDeleteAccount();
      });
    }

    // Mudar Tema pelo Perfil
    if (this.dom.profileThemeBtn) {
      this.dom.profileThemeBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeProfileModal();
        if (this.app && this.app.themeManager) {
          this.app.themeManager.openThemeModal();
        }
      });
    }

    // Abrir Configurações de Nuvem
    if (this.dom.openCloudConfigBtn) {
      this.dom.openCloudConfigBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.closeProfileModal();
        this.openCloudModal();
      });
    }

    // Salvar Configuração de Nuvem (Firebase)
    if (this.dom.saveCloudConfigBtn) {
      this.dom.saveCloudConfigBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.handleSaveCloudConfig();
      });
    }

    // Resetar Configuração de Nuvem
    if (this.dom.resetCloudConfigBtn) {
      this.dom.resetCloudConfigBtn.addEventListener('click', () => {
        soundFx.playClick();
        serverlessDB.saveConfig(null);
        alert('Configuração de nuvem restaurada para o Banco Local padrão.');
        window.location.reload();
      });
    }
  }

  toggleAuthMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.updateAuthModalUI();
  }

  openAuthModal(isRegister = false) {
    this.isRegisterMode = isRegister;
    this.updateAuthModalUI();
    this.dom.authEmailInput.value = '';
    this.dom.authPasswordInput.value = '';
    if (this.dom.authNameInput) this.dom.authNameInput.value = '';
    this.showAuthError('');
    this.dom.authModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeAuthModal() {
    this.dom.authModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  openGuestModal() {
    this.selectedGuestEmoji = (this.currentUser && this.currentUser.avatarEmoji) || '🎓';
    if (this.dom.guestAvatarPreview) {
      this.dom.guestAvatarPreview.textContent = this.selectedGuestEmoji;
    }
    if (this.dom.guestNicknameInput) {
      this.dom.guestNicknameInput.value = (this.currentUser && this.currentUser.isGuest) ? this.currentUser.name : '';
    }

    // Renderiza a grade com todos os 40 emojis
    if (this.dom.guestEmojiGrid) {
      this.dom.guestEmojiGrid.innerHTML = '';
      AVATAR_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `guest-emoji-btn p-1.5 rounded-xl border flex items-center justify-center text-lg sm:text-xl transition-all ${
          emoji === this.selectedGuestEmoji 
            ? 'selected bg-indigo-600/40 border-indigo-400 ring-2 ring-indigo-500 shadow-md' 
            : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-700'
        }`;
        btn.textContent = emoji;
        btn.addEventListener('click', () => {
          soundFx.playClick();
          this.selectedGuestEmoji = emoji;
          if (this.dom.guestAvatarPreview) {
            this.dom.guestAvatarPreview.textContent = emoji;
          }
          this.dom.guestEmojiGrid.querySelectorAll('.guest-emoji-btn').forEach(b => {
            b.className = 'guest-emoji-btn p-1.5 rounded-xl border flex items-center justify-center text-lg sm:text-xl transition-all bg-gray-800/60 border-gray-700/60 hover:bg-gray-700';
          });
          btn.className = 'guest-emoji-btn p-1.5 rounded-xl border flex items-center justify-center text-lg sm:text-xl transition-all selected bg-indigo-600/40 border-indigo-400 ring-2 ring-indigo-500 shadow-md';
        });
        this.dom.guestEmojiGrid.appendChild(btn);
      });
    }

    if (this.dom.guestSetupModal) {
      this.dom.guestSetupModal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }
    if (window.lucide) window.lucide.createIcons();
  }

  closeGuestModal() {
    if (this.dom.guestSetupModal) {
      this.dom.guestSetupModal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }

  loginAsGuest(nickname, avatarEmoji = '🎓') {
    const guestId = (this.currentUser && this.currentUser.uid && this.currentUser.isGuest)
      ? this.currentUser.uid
      : ('guest_' + Math.random().toString(36).substring(2, 9));
    this.currentUser = {
      uid: guestId,
      name: nickname,
      email: 'Convidado',
      isGuest: true,
      avatarEmoji: avatarEmoji,
      provider: 'guest'
    };
    this.setLocalAvatar(avatarEmoji);
    this.setLocalNickname(nickname);
    this.saveSessionUser(this.currentUser);
    this.closeGuestModal();
    soundFx.playVictory();
    this.updateUI();
    this.notifyListeners();
  }

  updateAuthModalUI() {
    if (this.isRegisterMode) {
      this.dom.authTitle.textContent = 'Criar Conta no QuizMaster';
      this.dom.authSubtitle.textContent = 'Guarde seus quizzes na nuvem e acompanhe rankings de alunos';
      this.dom.authSubmitBtn.textContent = 'Cadastrar e Entrar';
      this.dom.authNameGroup.classList.remove('hidden');
      this.dom.authToggleModeText.innerHTML = 'Já possui uma conta? <strong class="text-indigo-400 underline">Fazer Login</strong>';
    } else {
      this.dom.authTitle.textContent = 'Entrar na sua Conta';
      this.dom.authSubtitle.textContent = 'Acesse seus quizzes salvos e salas de jogo ativas';
      this.dom.authSubmitBtn.textContent = 'Entrar';
      this.dom.authNameGroup.classList.add('hidden');
      this.dom.authToggleModeText.innerHTML = 'Não tem conta? <strong class="text-indigo-400 underline">Cadastre-se grátis</strong>';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  showAuthError(msg) {
    if (this.dom.authErrorMsg) {
      if (msg) {
        this.dom.authErrorMsg.innerHTML = msg;
        this.dom.authErrorMsg.classList.remove('hidden');
      } else {
        this.dom.authErrorMsg.classList.add('hidden');
      }
    }
  }

  async handleAuthSubmit() {
    const email = (this.dom.authEmailInput.value || '').trim();
    const password = (this.dom.authPasswordInput.value || '').trim();
    const name = this.dom.authNameInput ? (this.dom.authNameInput.value || '').trim() : '';

    if (!email || !password) {
      this.showAuthError('Por favor, informe seu email e senha.');
      soundFx.playWrong();
      return;
    }

    if (password.length < 6) {
      this.showAuthError('A senha deve ter pelo menos 6 caracteres.');
      soundFx.playWrong();
      return;
    }

    this.showAuthError('');
    this.dom.authSubmitBtn.disabled = true;
    this.dom.authSubmitBtn.classList.add('opacity-60');

    try {
      if (this.isRegisterMode) {
        await this.register(email, password, name || email.split('@')[0]);
      } else {
        await this.login(email, password);
      }

      this.closeAuthModal();
      soundFx.playVictory();
      this.updateUI();
      this.notifyListeners();
    } catch (err) {
      console.error('Erro na autenticação:', err);
      this.showAuthError(`❌ ${err.message}`);
      soundFx.playWrong();
    } finally {
      this.dom.authSubmitBtn.disabled = false;
      this.dom.authSubmitBtn.classList.remove('opacity-60');
    }
  }

  async handleGoogleAuth() {
    this.showAuthError('');
    try {
      await this.loginWithGoogle();
      this.closeAuthModal();
      soundFx.playVictory();
      this.updateUI();
      this.notifyListeners();
    } catch (err) {
      console.error('Erro no login com Google:', err);
      let errorMsg = err.message;
      if (err.code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        errorMsg = `O domínio "${currentHost}" precisa ser autorizado no Console do Firebase (Authentication ➔ Configurações ➔ Domínios Autorizados).`;
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'A janela de login com o Google foi fechada antes de concluir.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMsg = 'O pop-up de login foi bloqueado pelo seu navegador. Permita pop-ups para este site.';
      }
      this.showAuthError(`❌ ${errorMsg}`);
      soundFx.playWrong();
    }
  }

  async loginWithGoogle() {
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(serverlessDB.auth, provider);
      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || cred.user.email.split('@')[0],
        provider: 'google'
      };
      this.saveSessionUser(this.currentUser);
      return this.currentUser;
    } else {
      throw new Error('O Login com o Google requer a nuvem Firebase configurada.');
    }
  }

  async register(email, password, name) {
    // 1. Se Firebase Cloud estiver ativo
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const cred = await createUserWithEmailAndPassword(serverlessDB.auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: name || cred.user.email.split('@')[0],
        provider: 'firebase'
      };
      this.saveSessionUser(this.currentUser);
      return this.currentUser;
    }

    // 2. Modo Banco Local (Offline/Fallback)
    const users = serverlessDB.getLocalUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Este email já está cadastrado. Tente fazer login.');
    }

    const newUser = {
      uid: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      email: email,
      passwordHash: btoa(password), // Codificação local para demonstração segura no browser
      name: name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      provider: 'local'
    };

    users.push(newUser);
    serverlessDB.saveLocalUsers(users);

    this.currentUser = {
      uid: newUser.uid,
      email: newUser.email,
      name: newUser.name,
      provider: 'local'
    };
    this.saveSessionUser(this.currentUser);
    return this.currentUser;
  }

  async login(email, password) {
    // 1. Se Firebase Cloud estiver ativo
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      const cred = await signInWithEmailAndPassword(serverlessDB.auth, email, password);
      this.currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || cred.user.email.split('@')[0],
        provider: 'firebase'
      };
      this.saveSessionUser(this.currentUser);
      return this.currentUser;
    }

    // 2. Modo Banco Local
    const users = serverlessDB.getLocalUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error(
        'Conta não encontrada neste dispositivo.\n' +
        'No modo padrão do GitHub Pages (sem servidor próprio), os dados locais ficam salvos apenas no aparelho onde foram criados.\n' +
        '👉 Para acessar a mesma conta em qualquer celular ou PC, configure o Firebase gratuito nas "Configurações de Nuvem" ou crie a conta neste celular.'
      );
    }

    if (user.passwordHash !== btoa(password)) {
      throw new Error('Senha incorreta para este email.');
    }

    const localApiKey = user.geminiApiKey || localStorage.getItem(`QUIZMASTER_USER_AI_KEY_${user.uid}`) || '';
    this.currentUser = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      avatarEmoji: user.avatarEmoji || this.getLocalAvatar(),
      geminiApiKey: localApiKey,
      isGuest: false,
      provider: 'local'
    };
    if (localApiKey) {
      aiService.setApiKey(localApiKey);
    }
    this.saveSessionUser(this.currentUser);
    return this.currentUser;
  }

  async logout() {
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      await signOut(serverlessDB.auth);
    }
    this.currentUser = this.getDefaultGuestUser();
    this.saveSessionUser(this.currentUser);
    const fallbackKey = localStorage.getItem('QUIZMASTER_AI_API_KEY') || '';
    aiService.setApiKey(fallbackKey);
    this.closeProfileModal();
    this.updateUI();
    this.notifyListeners();
  }

  async handleDeleteAccount() {
    if (!this.currentUser) return;

    const userEmail = this.currentUser.email || 'sua conta';
    const confirmed = confirm(
      `⚠️ ATENÇÃO: Tem certeza que deseja excluir permanentemente sua conta (${userEmail})?\n\nEsta ação é irreversível e todos os seus dados de perfil serão removidos.`
    );
    if (!confirmed) return;

    soundFx.playClick();

    try {
      const uid = this.currentUser.uid;
      const isFirebase = this.currentUser.provider === 'firebase' || this.currentUser.provider === 'google';

      // 1. Exclusão no Firebase (Auth + Firestore)
      if (isFirebase && serverlessDB.isCloudEnabled && serverlessDB.auth) {
        const firebaseUser = serverlessDB.auth.currentUser;
        if (firebaseUser) {
          // Remove documento de perfil e quizzes do Firestore
          if (serverlessDB.firestore) {
            try {
              const { doc, deleteDoc, collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
              await deleteDoc(doc(serverlessDB.firestore, 'user_profiles', uid));

              // Remove quizzes criados por este usuário na nuvem
              const q = query(collection(serverlessDB.firestore, 'user_quizzes'), where('userId', '==', uid));
              const snap = await getDocs(q);
              const delList = [];
              snap.forEach(d => delList.push(deleteDoc(doc(serverlessDB.firestore, 'user_quizzes', d.id))));
              await Promise.all(delList);
            } catch (e) {
              console.warn('Erro ao remover documento de perfil ou quizzes do Firestore:', e);
            }
          }

          // Exclui a conta do Firebase Auth
          try {
            await firebaseUser.delete();
          } catch (authErr) {
            if (authErr.code === 'auth/requires-recent-login') {
              alert('⚠️ Por medidas de segurança, faça login novamente na sua conta antes de solicitar a exclusão.');
              await this.logout();
              this.openAuthModal();
              return;
            }
            throw authErr;
          }
        }
      } else {
        // 2. Exclusão no Banco Local (LocalStorage)
        const localUsers = serverlessDB.getLocalUsers().filter(u => u.uid !== uid && u.email.toLowerCase() !== this.currentUser.email.toLowerCase());
        serverlessDB.saveLocalUsers(localUsers);
      }

      // 3. Limpa storage particionado do usuário, restaura perfil convidado e atualiza interface
      try {
        localStorage.removeItem(`QUIZMASTER_USER_QUIZZES_${uid}`);
      } catch (e) {}

      this.currentUser = this.getDefaultGuestUser();
      this.saveSessionUser(this.currentUser);
      this.closeProfileModal();
      this.updateUI();
      this.notifyListeners();
      soundFx.playSuccess();
      alert('✅ Sua conta foi excluída permanentemente com sucesso.');
    } catch (err) {
      soundFx.playWrong();
      alert(`❌ Erro ao excluir conta: ${err.message}`);
    }
  }

  openProfileModal() {
    if (!this.currentUser) {
      this.currentUser = this.getDefaultGuestUser();
    }
    const isGuest = !!this.currentUser.isGuest;

    if (this.dom.profileEmailText) {
      this.dom.profileEmailText.textContent = isGuest 
        ? '🎮 Modo Convidado / Offline (Sem conta permanente)' 
        : this.currentUser.email;
    }
    if (this.dom.profileNameText) {
      this.dom.profileNameText.textContent = this.currentUser.name || 'Jogador';
    }
    if (this.dom.profileNicknameInput) {
      this.dom.profileNicknameInput.value = this.currentUser.name || 'Jogador';
    }

    const currentEmoji = this.currentUser.avatarEmoji || this.getLocalAvatar();
    if (this.dom.profileAvatarDisplay) {
      this.dom.profileAvatarDisplay.textContent = currentEmoji;
    }

    // Alterna botões exclusivos para convidados vs contas registradas
    if (this.dom.profileLoginPromptBtn) {
      this.dom.profileLoginPromptBtn.classList.toggle('hidden', !isGuest);
    }
    if (this.dom.logoutBtn) {
      this.dom.logoutBtn.classList.toggle('hidden', isGuest);
    }
    if (this.dom.deleteAccountBtn) {
      this.dom.deleteAccountBtn.classList.toggle('hidden', isGuest);
    }

    // Atualiza campo e badge de status da Chave de API Google Gemini
    this.updateProfileApiKeyUI();
    if (this.dom.profileApiKeyFeedback) {
      this.dom.profileApiKeyFeedback.classList.add('hidden');
    }

    // Renderiza a grade com todos os 40 emojis de avatar
    if (this.dom.profileEmojiGrid) {
      this.dom.profileEmojiGrid.className = 'grid grid-cols-8 gap-1 text-lg max-h-[140px] overflow-y-auto pr-1';
      this.dom.profileEmojiGrid.innerHTML = '';
      AVATAR_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `emoji-avatar-btn p-1.5 rounded-xl border flex items-center justify-center text-xl transition-all ${
          emoji === currentEmoji 
            ? 'selected bg-indigo-600/40 border-indigo-400 ring-2 ring-indigo-500 shadow-md' 
            : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-700'
        }`;
        btn.textContent = emoji;
        btn.title = `Escolher avatar ${emoji}`;

        btn.addEventListener('click', async () => {
          soundFx.playClick();
          this.currentUser.avatarEmoji = emoji;
          this.setLocalAvatar(emoji);
          this.saveSessionUser(this.currentUser);

          if (this.dom.profileAvatarDisplay) {
            this.dom.profileAvatarDisplay.textContent = emoji;
          }
          this.openProfileModal();
          this.updateUI();
          this.notifyListeners();

          // Sincroniza com Firebase se logado com conta permanente
          if (!isGuest && serverlessDB.isCloudEnabled && serverlessDB.firestore) {
            try {
              const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
              await setDoc(doc(serverlessDB.firestore, 'user_profiles', this.currentUser.uid), {
                avatarEmoji: emoji,
                name: this.currentUser.name,
                email: this.currentUser.email,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            } catch (err) {
              console.warn('Erro ao salvar avatar no Firestore:', err);
            }
          }
        });

        this.dom.profileEmojiGrid.appendChild(btn);
      });
    }

    this.dom.profileModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeProfileModal() {
    this.dom.profileModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  openCloudModal() {
    const config = serverlessDB.customConfig;
    if (this.dom.cloudConfigJsonInput) {
      this.dom.cloudConfigJsonInput.value = config ? JSON.stringify(config, null, 2) : '';
    }
    this.updateCloudStatusBadge();
    this.dom.cloudModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeCloudModal() {
    this.dom.cloudModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  updateCloudStatusBadge() {
    if (this.dom.cloudStatusBadge) {
      if (serverlessDB.isCloudEnabled) {
        this.dom.cloudStatusBadge.innerHTML = `🟢 <span class="text-emerald-400 font-bold">Firebase Conectado</span>`;
      } else {
        this.dom.cloudStatusBadge.innerHTML = `🟡 <span class="text-amber-300 font-medium">Banco Local Ativo (Offline/GitHub Pages)</span>`;
      }
    }
  }

  handleSaveCloudConfig() {
    const val = (this.dom.cloudConfigJsonInput.value || '').trim();
    if (!val) {
      alert('Cole o objeto de configuração JSON do seu projeto Firebase.');
      return;
    }

    try {
      const parsed = JSON.parse(val);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('A configuração deve conter pelo menos "apiKey" e "projectId".');
      }
      serverlessDB.saveConfig(parsed);
      alert('Configuração salva com sucesso! A página será atualizada.');
      window.location.reload();
    } catch (e) {
      alert(`Erro no formato JSON: ${e.message}`);
    }
  }

  updateUI() {
    const drawerUserName = document.getElementById('drawer-user-name');
    const drawerUserStatus = document.getElementById('drawer-user-status');
    const drawerAuthBtn = document.getElementById('drawer-auth-btn');
    const drawerUserAvatarText = document.getElementById('drawer-user-avatar-text');

    const isGuest = !this.currentUser || !!this.currentUser.isGuest;
    const userEmoji = (this.currentUser && this.currentUser.avatarEmoji) ? this.currentUser.avatarEmoji : this.getLocalAvatar();
    const userName = (this.currentUser && this.currentUser.name) ? this.currentUser.name : this.getLocalNickname();

    // 1. Atualiza elementos de texto e avatar no Header e Telas
    if (this.dom.userAvatarText) {
      this.dom.userAvatarText.textContent = userEmoji;
    }
    if (this.dom.userDisplayName) {
      this.dom.userDisplayName.textContent = userName;
    }
    if (this.dom.mobileUserAvatarText) {
      this.dom.mobileUserAvatarText.textContent = userEmoji;
    }
    if (this.dom.welcomePlayerAvatarText) {
      this.dom.welcomePlayerAvatarText.textContent = userEmoji;
    }
    if (this.dom.welcomePlayerNameText) {
      this.dom.welcomePlayerNameText.textContent = userName;
    }
    if (drawerUserAvatarText) {
      drawerUserAvatarText.textContent = userEmoji;
    }
    if (drawerUserName) {
      drawerUserName.textContent = userName;
    }

    // 2. Botão de perfil (sempre visível para permitir personalizar avatar mesmo sem conta)
    if (this.dom.userProfileBtn) {
      this.dom.userProfileBtn.classList.remove('hidden');
      this.dom.userProfileBtn.title = isGuest ? 'Meu Perfil (Convidado - Personalizar Emoji e Nome)' : 'Meu Perfil';
    }
    if (this.dom.mobileUserProfileBtn) {
      this.dom.mobileUserProfileBtn.classList.remove('hidden');
      this.dom.mobileUserProfileBtn.title = isGuest ? 'Personalizar Emoji de Avatar' : 'Meu Perfil';
    }

    // 3. Botão "Entrar" no Header Desktop: visível se convidado/sem conta permanente
    if (this.dom.authBtn) {
      if (isGuest) {
        this.dom.authBtn.classList.remove('hidden');
        this.dom.authBtn.title = 'Entrar ou Criar Conta Permanente na Nuvem';
      } else {
        this.dom.authBtn.classList.add('hidden');
      }
    }

    // 4. Drawer lateral
    if (drawerUserStatus) {
      drawerUserStatus.textContent = isGuest ? '🎮 Jogador Convidado (Sem conta)' : (this.currentUser.email || 'Conectado');
    }
    if (drawerAuthBtn) {
      if (isGuest) {
        drawerAuthBtn.textContent = 'Entrar';
        drawerAuthBtn.title = 'Fazer Login ou Criar Conta';
        drawerAuthBtn.onclick = () => {
          if (this.app) this.app.closeMobileDrawer();
          this.openAuthModal();
        };
      } else {
        drawerAuthBtn.textContent = 'Perfil';
        drawerAuthBtn.title = 'Gerenciar Perfil';
        drawerAuthBtn.onclick = () => {
          if (this.app) this.app.closeMobileDrawer();
          this.openProfileModal();
        };
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }
}

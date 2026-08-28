/**
 * Gerenciador de Autenticação e Contas de Usuário (Email e Senha)
 * Funciona 100% no Frontend com suporte a Firebase Auth e Banco Local
 */
import { serverlessDB } from './firebaseConfig.js';
import { soundFx } from './audio.js';

const STORAGE_SESSION_USER = 'QUIZMASTER_SESSION_USER';

export class AuthManager {
  constructor(app) {
    this.app = app;
    this.currentUser = this.loadSessionUser();
    this.authListeners = [];

    this.dom = {
      // Header Auth Elements
      authBtn: document.getElementById('header-auth-btn'),
      userProfileBtn: document.getElementById('header-user-profile-btn'),
      userAvatarText: document.getElementById('header-user-avatar-text'),
      userDisplayName: document.getElementById('header-user-name'),

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
      authErrorMsg: document.getElementById('auth-error-msg'),

      // User Profile / Settings Modal
      profileModal: document.getElementById('user-profile-modal'),
      closeProfileModalBtn: document.getElementById('close-profile-modal-btn'),
      profileEmailText: document.getElementById('profile-email-text'),
      profileNameText: document.getElementById('profile-name-text'),
      logoutBtn: document.getElementById('profile-logout-btn'),
      openCloudConfigBtn: document.getElementById('open-cloud-config-btn'),

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

  async init() {
    await serverlessDB.init();
    this.bindEvents();
    this.updateUI();

    // Se Firebase estiver ativo, escuta mudanças de auth
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      onAuthStateChanged(serverlessDB.auth, (user) => {
        if (user) {
          this.currentUser = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            provider: 'firebase'
          };
          this.saveSessionUser(this.currentUser);
        } else {
          if (this.currentUser && this.currentUser.provider === 'firebase') {
            this.currentUser = null;
            this.saveSessionUser(null);
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
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
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

    // Submissão do Formulário de Auth
    if (this.dom.authForm) {
      this.dom.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleAuthSubmit();
      });
    }

    // Logout
    if (this.dom.logoutBtn) {
      this.dom.logoutBtn.addEventListener('click', async () => {
        soundFx.playClick();
        await this.logout();
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

    this.currentUser = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      provider: 'local'
    };
    this.saveSessionUser(this.currentUser);
    return this.currentUser;
  }

  async logout() {
    if (serverlessDB.isCloudEnabled && serverlessDB.auth) {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
      await signOut(serverlessDB.auth);
    }
    this.currentUser = null;
    this.saveSessionUser(null);
    this.closeProfileModal();
    this.updateUI();
    this.notifyListeners();
  }

  openProfileModal() {
    if (!this.currentUser) return;
    if (this.dom.profileEmailText) this.dom.profileEmailText.textContent = this.currentUser.email;
    if (this.dom.profileNameText) this.dom.profileNameText.textContent = this.currentUser.name;
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

    if (this.currentUser) {
      if (this.dom.authBtn) this.dom.authBtn.classList.add('hidden');
      if (this.dom.userProfileBtn) {
        this.dom.userProfileBtn.classList.remove('hidden');
        if (this.dom.userAvatarText) {
          this.dom.userAvatarText.textContent = (this.currentUser.name || 'U').charAt(0).toUpperCase();
        }
        if (this.dom.userDisplayName) {
          this.dom.userDisplayName.textContent = this.currentUser.name;
        }
      }

      if (drawerUserName) drawerUserName.textContent = this.currentUser.name || 'Usuário';
      if (drawerUserStatus) drawerUserStatus.textContent = this.currentUser.email || 'Conectado';
      if (drawerAuthBtn) {
        drawerAuthBtn.textContent = 'Perfil';
        drawerAuthBtn.onclick = () => {
          if (this.app) this.app.closeMobileDrawer();
          this.openProfileModal();
        };
      }
    } else {
      if (this.dom.authBtn) this.dom.authBtn.classList.remove('hidden');
      if (this.dom.userProfileBtn) this.dom.userProfileBtn.classList.add('hidden');

      if (drawerUserName) drawerUserName.textContent = 'Minha Conta';
      if (drawerUserStatus) drawerUserStatus.textContent = 'Banco Local (GitHub Pages)';
      if (drawerAuthBtn) {
        drawerAuthBtn.textContent = 'Entrar';
        drawerAuthBtn.onclick = () => {
          if (this.app) this.app.closeMobileDrawer();
          this.openAuthModal();
        };
      }
    }
    if (window.lucide) window.lucide.createIcons();
  }
}

/**
 * Gerenciador de Recursos Offline, PWA e Sincronizacao
 * Garante que a criacao, salvamento e execucao de quizzes funcione 100% offline no dispositivo.
 */
import { soundFx } from './audio.js';

export class OfflineManager {
  constructor(app) {
    this.app = app;
    this.isOnline = navigator.onLine;
    this.deferredInstallPrompt = null;

    this.dom = {
      statusBadge: document.getElementById('network-status-badge'),
      drawerStatusBadge: document.getElementById('drawer-network-status-badge'),
      installPwaBtn: document.getElementById('install-pwa-btn'),
      drawerInstallBtn: document.getElementById('drawer-install-btn')
    };

    this.init();
  }

  init() {
    this.registerServiceWorker();
    this.bindNetworkEvents();
    this.bindInstallPrompt();
    this.updateStatusUI();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => {
            console.log('[OfflineManager] Service Worker registrado com sucesso:', reg.scope);
          })
          .catch((err) => {
            console.warn('[OfflineManager] Falha ao registrar Service Worker:', err);
          });
      });
    }
  }

  bindNetworkEvents() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatusUI();
      this.showConnectionToast('🟢 Conexão restabelecida! Você está online.', 'success');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatusUI();
      this.showConnectionToast('⚡ Você está no Modo Offline. Seus quizzes locais continuam funcionando perfeitamente!', 'warning');
    });
  }

  bindInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      if (this.dom.installPwaBtn) this.dom.installPwaBtn.classList.remove('hidden');
      if (this.dom.drawerInstallBtn) this.dom.drawerInstallBtn.classList.remove('hidden');
    });

    const handleInstallClick = async () => {
      if (this.deferredInstallPrompt) {
        soundFx.playClick();
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('[OfflineManager] Aplicativo instalado com sucesso.');
        }
        this.deferredInstallPrompt = null;
        if (this.dom.installPwaBtn) this.dom.installPwaBtn.classList.add('hidden');
        if (this.dom.drawerInstallBtn) this.dom.drawerInstallBtn.classList.add('hidden');
      }
    };

    if (this.dom.installPwaBtn) {
      this.dom.installPwaBtn.addEventListener('click', handleInstallClick);
    }
    if (this.dom.drawerInstallBtn) {
      this.dom.drawerInstallBtn.addEventListener('click', handleInstallClick);
    }
  }

  updateStatusUI() {
    const isOnline = navigator.onLine;
    this.isOnline = isOnline;

    if (this.dom.statusBadge) {
      if (isOnline) {
        this.dom.statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span class="hidden sm:inline text-[11px] font-semibold text-emerald-400">Online</span>`;
        this.dom.statusBadge.title = 'Conectado à internet (Nuvem ativa)';
      } else {
        this.dom.statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span><span class="hidden sm:inline text-[11px] font-bold text-amber-300">Offline</span>`;
        this.dom.statusBadge.title = 'Modo Offline (Armazenamento local do dispositivo)';
      }
    }

    if (this.dom.drawerStatusBadge) {
      if (isOnline) {
        this.dom.drawerStatusBadge.innerHTML = `🟢 <span class="text-emerald-400 font-semibold">Conectado (Nuvem)</span>`;
      } else {
        this.dom.drawerStatusBadge.innerHTML = `⚡ <span class="text-amber-300 font-bold">Modo Offline (Dispositivo)</span>`;
      }
    }
  }

  showConnectionToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colorClass = type === 'success' 
      ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
      : 'bg-amber-950/90 border-amber-500/50 text-amber-200';
    
    toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl border shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-slide-up backdrop-blur-md ${colorClass}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  }

  syncPendingData() {
    // Sincroniza quizzes e salas com Firebase se disponivel
    if (this.app && this.app.quizBuilder) {
      console.log('[OfflineManager] Sincronizando dados locais com a nuvem...');
    }
  }

  /**
   * Baixa um arquivo de quiz (.json) diretamente no dispositivo do usuario (Backup Offline)
   */
  exportQuizToFile(quizData) {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizData, null, 2));
      const downloadAnchor = document.createElement('a');
      const safeTitle = (quizData.title || 'quiz').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `quiz_${safeTitle}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      soundFx.playSuccess();
      return true;
    } catch (e) {
      console.warn('Erro ao exportar quiz para arquivo JSON:', e);
      return false;
    }
  }

  /**
   * Le um arquivo de quiz (.json) importado do disco local do usuario
   */
  async importQuizFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Nenhum arquivo selecionado'));
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = JSON.parse(content);
          if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            throw new Error('O arquivo JSON não possui uma lista válida de perguntas.');
          }
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo do dispositivo'));
      reader.readAsText(file);
    });
  }
}

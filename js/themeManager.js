/**
 * Gerenciador de Temas (Dark Mode, Light Mode, Emerald, Sunset, AMOLED)
 * Suporta persistência no LocalStorage e aplicação instantânea de classes e variáveis CSS
 */
import { soundFx } from './audio.js';

const STORAGE_THEME = 'QUIZMASTER_THEME';

export const THEMES = [
  { id: 'cyberpunk', name: 'Dark Neon', icon: '🌌', desc: 'Tema escuro padrão com brilho Índigo & Pink', dark: true },
  { id: 'light', name: 'Light Modern', icon: '☀️', desc: 'Modo claro com alto contraste e tons limpos', dark: false },
  { id: 'emerald', name: 'Nature Emerald', icon: '🌲', desc: 'Verde esmeralda e menta com visual focado', dark: true },
  { id: 'sunset', name: 'Sunset Warm', icon: '🌅', desc: 'Tons quentes de âmbar, laranja e pôr do sol', dark: true },
  { id: 'midnight', name: 'Midnight AMOLED', icon: '👾', desc: 'Preto puro (#000000) de alto contraste', dark: true }
];

export class ThemeManager {
  constructor(app) {
    this.app = app;
    this.currentTheme = this.loadSavedTheme() || 'cyberpunk';
    
    this.dom = {
      themeToggleBtn: document.getElementById('theme-toggle-btn'),
      drawerThemeBtn: document.getElementById('drawer-theme-btn'),
      themeModal: document.getElementById('theme-selector-modal'),
      closeThemeModalBtn: document.getElementById('close-theme-modal-btn'),
      themeOptionsContainer: document.getElementById('theme-options-container')
    };

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme, false);
    this.bindEvents();
    this.renderThemeOptions();
  }

  loadSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_THEME);
    } catch (e) {
      return null;
    }
  }

  saveTheme(themeId) {
    try {
      localStorage.setItem(STORAGE_THEME, themeId);
    } catch (e) {
      console.warn('Não foi possível salvar tema no LocalStorage:', e);
    }
  }

  applyTheme(themeId, save = true) {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    this.currentTheme = theme.id;
    
    document.documentElement.setAttribute('data-theme', theme.id);
    if (!theme.dark) {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }

    if (save) {
      this.saveTheme(theme.id);
    }

    this.updateUI();
  }

  toggleQuickDarkLight() {
    if (this.currentTheme === 'light') {
      this.applyTheme('cyberpunk');
    } else {
      this.applyTheme('light');
    }
    soundFx.playClick();
  }

  openThemeModal() {
    if (!this.dom.themeModal) return;
    this.renderThemeOptions();
    this.dom.themeModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeThemeModal() {
    if (!this.dom.themeModal) return;
    this.dom.themeModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  renderThemeOptions() {
    if (!this.dom.themeOptionsContainer) return;
    this.dom.themeOptionsContainer.innerHTML = '';

    THEMES.forEach(t => {
      const isSelected = this.currentTheme === t.id;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `w-full p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
        isSelected 
          ? 'bg-indigo-600/25 border-indigo-500 shadow-lg shadow-indigo-600/20' 
          : 'bg-gray-900/60 border-gray-800 hover:bg-gray-800/60 hover:border-gray-700'
      }`;

      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700 flex items-center justify-center text-xl shrink-0">
            ${t.icon}
          </div>
          <div class="truncate">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-sm text-gray-100">${t.name}</h4>
              ${isSelected ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">Ativo</span>' : ''}
            </div>
            <p class="text-xs text-gray-400 truncate">${t.desc}</p>
          </div>
        </div>
        <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-600'}">
          ${isSelected ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        soundFx.playClick();
        this.applyTheme(t.id);
        this.renderThemeOptions();
      });

      this.dom.themeOptionsContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  updateUI() {
    const current = THEMES.find(t => t.id === this.currentTheme) || THEMES[0];
    
    // Atualiza botão do Drawer se existir
    if (this.dom.drawerThemeBtn) {
      this.dom.drawerThemeBtn.innerHTML = `
        <span class="flex items-center gap-2">
          <span>${current.icon}</span>
          <span class="text-xs font-semibold text-gray-200">Tema: ${current.name}</span>
        </span>
        <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500"></i>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  bindEvents() {
    // Abrir Modal de Temas via botão no Header
    if (this.dom.themeToggleBtn) {
      this.dom.themeToggleBtn.addEventListener('click', () => {
        soundFx.playClick();
        this.openThemeModal();
      });
    }

    // Abrir Modal de Temas via botão no Drawer
    if (this.dom.drawerThemeBtn) {
      this.dom.drawerThemeBtn.addEventListener('click', () => {
        soundFx.playClick();
        if (this.app) this.app.closeMobileDrawer();
        this.openThemeModal();
      });
    }

    // Fechar Modal
    if (this.dom.closeThemeModalBtn) {
      this.dom.closeThemeModalBtn.addEventListener('click', () => {
        this.closeThemeModal();
      });
    }
  }
}

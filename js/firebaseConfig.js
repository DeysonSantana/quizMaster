/**
 * Conector Serverless para Banco de Dados e Autenticação
 * Compatível 100% com GitHub Pages (Client-side)
 * Suporta Firebase (Auth + Firestore) com Fallback Nativo LocalStorage/IndexedDB
 */

const STORAGE_FIREBASE_CONFIG = 'QUIZMASTER_FIREBASE_CONFIG';
const STORAGE_LOCAL_USERS = 'QUIZMASTER_LOCAL_USERS';
const STORAGE_LOCAL_ROOMS = 'QUIZMASTER_LOCAL_ROOMS';
const STORAGE_LOCAL_SCORES = 'QUIZMASTER_LOCAL_SCORES';

class ServerlessDB {
  constructor() {
    this.firebaseApp = null;
    this.auth = null;
    this.firestore = null;
    this.isCloudEnabled = false;
    this.customConfig = this.loadConfig();
  }

  loadConfig() {
    try {
      const data = localStorage.getItem(STORAGE_FIREBASE_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveConfig(config) {
    if (config) {
      localStorage.setItem(STORAGE_FIREBASE_CONFIG, JSON.stringify(config));
      this.customConfig = config;
    } else {
      localStorage.removeItem(STORAGE_FIREBASE_CONFIG);
      this.customConfig = null;
    }
  }

  async init() {
    if (this.customConfig && this.customConfig.apiKey && this.customConfig.projectId) {
      try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');

        this.firebaseApp = initializeApp(this.customConfig);
        this.auth = getAuth(this.firebaseApp);
        this.firestore = getFirestore(this.firebaseApp);
        this.isCloudEnabled = true;
        console.log('✅ Firebase Cloud DB & Auth inicializados com sucesso.');
        return;
      } catch (err) {
        console.warn('Falha ao inicializar Firebase com a configuração informada, usando Modo Local:', err);
        this.isCloudEnabled = false;
      }
    }
    console.log('ℹ️ Operando no Modo de Banco de Dados Local (100% Offline e GitHub Pages ready).');
  }

  // --- MÉTODOS DO BANCO LOCAL (FALLBACK UNIVERSAL) ---

  getLocalUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LOCAL_USERS)) || [];
    } catch (e) {
      return [];
    }
  }

  saveLocalUsers(users) {
    localStorage.setItem(STORAGE_LOCAL_USERS, JSON.stringify(users));
  }

  getLocalRooms() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LOCAL_ROOMS)) || [];
    } catch (e) {
      return [];
    }
  }

  saveLocalRooms(rooms) {
    localStorage.setItem(STORAGE_LOCAL_ROOMS, JSON.stringify(rooms));
  }

  getLocalScores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LOCAL_SCORES)) || [];
    } catch (e) {
      return [];
    }
  }

  saveLocalScores(scores) {
    localStorage.setItem(STORAGE_LOCAL_SCORES, JSON.stringify(scores));
  }
}

export const serverlessDB = new ServerlessDB();

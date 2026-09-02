/**
 * Service Worker do QuizMaster (PWA Offline-First)
 * Permite que a aplicacao funcione 100% offline sem conexao com a internet.
 */

const CACHE_NAME = 'quizmaster-v1.0.0';

// Arquivos principais da aplicacao para pre-cache imediato
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './favicon.svg',
  './manifest.json',
  './js/app.js',
  './js/audio.js',
  './js/themeManager.js',
  './js/questions.js',
  './js/csvParser.js',
  './js/shareManager.js',
  './js/qrcodeEngine.js',
  './js/quizBuilder.js',
  './js/authManager.js',
  './js/roomManager.js',
  './js/leaderboardManager.js',
  './js/firebaseConfig.js',
  './js/aiQuizModal.js',
  './js/aiService.js',
  './quiz_modelo_exemplo.csv'
];

// 1. Instalacao do Service Worker: Pre-cache de todos os arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching arquivos do QuizMaster para modo Offline...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Ativacao: Limpa caches antigos quando houver nova versao
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interceptacao de Requisicoes (Fetch): Estrategia Cache-First com Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Nao intercepta chamadas POST ou schemes nao HTTP/HTTPS
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Nao faz cache de chamadas para APIs de IA externas (Gemini) ou Firestore direto em tempo real
  if (event.request.url.includes('generativelanguage.googleapis.com') || event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Se esta em cache, retorna imediatamente e busca versao mais recente em background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignora falhas de rede se estiver offline
        });
        return cachedResponse;
      }

      // Se nao esta no cache, busca na rede e salva no cache
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback para pagina principal se requisicao de navegacao falhar
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

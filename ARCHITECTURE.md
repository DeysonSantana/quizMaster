# 🏗️ QuizMaster - Documentação Técnica e Arquitetura do Sistema

Este documento fornece um guia técnico detalhado para desenvolvedores e **Agentes de Inteligência Artificial** (Gemini, Claude, GPT, etc.) para que qualquer modelo possa compreender instantaneamente a arquitetura, fluxo de dados, contratos de API e continuar o desenvolvimento sem atritos.

---

## 🎯 1. Visão Geral e Princípios de Design

- **100% Offline-First & PWA**: A aplicação funciona completamente sem internet através de um **Service Worker (`sw.js`)** com estratégias *Cache-First* e manifesto PWA (`manifest.json`), podendo ser instalada como app nativo no celular e desktop.
- **Dual-Mode Database (Offline Local Storage + Cloud Firestore Sync)**:
  - **Modo Offline**: Quizzes criados são gravados no `LocalStorage` e podem ser baixados em `.json` ou `.csv` para backup físico e transferidos sem internet.
  - **Modo Nuvem**: Sincronização automática em tempo real com **Google Firebase** (Auth + Firestore).
- **Recursos Nativos sem Dependência de Internet**:
  - **Áudio**: Sintetizado via Web Audio API local.
  - **QR Code**: Gerado em Canvas local de alta densidade (`qrcodeEngine.js`).
  - **CSV & JSON**: Lidos diretamente via `FileReader` no dispositivo.
- **Roteamento Baseado em Hash (Hash-based Routing)**: Permite compartilhamento universal de links sem necessidade de reescrita de URL no servidor (`#room=PIN`, `#quiz=PAYLOAD`).

---

## 🗺️ 2. Mapa de Módulos (`js/` e `sw.js`)

| Arquivo | Responsabilidade | Dependências |
| :--- | :--- | :--- |
| `sw.js` | **Service Worker PWA**: Pre-cache dos assets estáticos e cache dinâmico em tempo de execução para funcionamento 100% offline. | Cache Storage API |
| `manifest.json` | **Manifesto PWA**: Metadados para instalação na tela inicial (*standalone display*). | Navegador |
| `js/app.js` | **Controlador Central (SPA)**: Gerencia telas (Welcome, Quiz, Results), teclado, ciclo de vida do jogo, timers e eventos globais. | Todos os gerenciadores |
| `js/offlineManager.js` | **Gerenciador Offline & PWA**: Registro do Service Worker, status de rede (`🟢 Online` / `⚡ Offline`), prompt de instalação e exportação/importação de arquivos `.json`. | `audio.js` |
| `js/themeManager.js` | **Gerenciador de Temas Visuais**: Aplica e persiste os 5 temas (Dark Neon, Light Modern, Emerald, Sunset, Midnight AMOLED) via variáveis CSS e `LocalStorage`. | `audio.js` |
| `js/firebaseConfig.js` | **Camada de Dados Serverless**: Inicializa Firebase SDK via CDN ES Modules e provê fallback para `LocalStorage`. | Firebase App, Auth, Firestore |
| `js/authManager.js` | **Gerenciador de Contas**: Login/Cadastro com Email/Senha, **Google Sign-In** (`GoogleAuthProvider`), perfil, avatar com emoji e estado da sessão. | `firebaseConfig.js`, `audio.js` |
| `js/quizBuilder.js` | **Criador Visual & Biblioteca de Quizzes**: CRUD de quizzes locais, exportação/importação JSON/CSV offline, e persistência no Firestore (`user_quizzes`). | `shareManager.js`, `csvParser.js`, `aiQuizModal.js`, `firebaseConfig.js` |
| `js/roomManager.js` | **Salas de Desafio (Kahoot)**: Criação de salas, PINs de 6 dígitos, expiração de tempo, listagem e exclusão no Firestore (`quiz_rooms`). | `firebaseConfig.js`, `shareManager.js`, `audio.js` |
| `js/leaderboardManager.js` | **Ranking e Pódio em Tempo Real**: Entrada por Nickname e Avatar Emoji, escuta ao vivo (`onSnapshot`) em `quiz_rooms/{pin}/scores`, pódio 🥇🥈🥉 e tabela de colocações. | `firebaseConfig.js`, `audio.js` |
| `js/aiService.js` | **Serviço de I.A**: Conexão com a API do Google Gemini para formulação de perguntas com quantidade aberta (1 a 50+). | Fetch REST API |
| `js/aiQuizModal.js` | **Interface do Gerador I.A**: Modal interativo com tags de temas, input numérico flexível e chave de API. | `aiService.js`, `audio.js` |
| `js/shareManager.js` | **Compartilhamento & Encurtador**: Compressão LZ-String, decodificação de URLs, geração de links curtos e renderização de QR Code. | `qrcodeEngine.js` |
| `js/qrcodeEngine.js` | **Motor Gráfico de QR Code**: Gerador Canvas nativo autônomo (suporta Types 1 a 40) sem dependências externas. | Canvas API |
| `js/csvParser.js` | **Processamento CSV**: Leitura e validação de arquivos CSV com detecção inteligente de delimitador (`,` ou `;`) e exportação de templates. | FileReader API |
| `js/audio.js` | **Efeitos Sonoros Sintetizados**: Sintetizador sonoro via Web Audio API (sem arquivos MP3 externos), com cliques, vitória, combo, erro e ticks. | AudioContext |
| `js/questions.js` | **Banco Padrão de Perguntas**: 25 questões balanceadas de conhecimentos gerais utilizadas como banco inicial. | Array estático |

---

## 📊 3. Modelos de Dados (Data Schemas)

### 3.1. Quiz (`QuizData`)
Coleção Firestore: `user_quizzes` | Chave LocalStorage: `QUIZMASTER_USER_QUIZZES`
```typescript
interface QuizData {
  id: string;               // Ex: 'quiz_1740000000000'
  title: string;            // Nome do quiz
  author: string;           // Nome do criador/professor
  timerSeconds: number;     // Tempo por pergunta (5, 10, 15, 20, 25, 30 ou 0 = sem tempo)
  userId: string | null;    // UID do criador no Firebase Auth (se autenticado)
  updatedAt: string;        // ISO 8601 Timestamp
  questions: Question[];
}
```

---

## 📶 4. Como Funciona a Operação Offline

1. **Primeiro Acesso**: O `sw.js` faz o download e armazena em cache todos os recursos estáticos e dependências CDN.
2. **Acessos Seguintes sem Internet**: A página abre instantaneamente do cache local do dispositivo.
3. **Criação de Quiz Offline**:
   - O professor pode criar quizzes, adicionar perguntas e salvar no dispositivo.
   - O quiz é gravado no `LocalStorage` e pode ser jogado imediatamente.
   - O professor pode clicar em **"Baixar Arquivo (.json)"** para ter uma cópia física de backup.
4. **Importação Offline**:
   - No modal "Meus Quizzes", o botão **"Importar Arquivo"** permite carregar qualquer quiz `.json` ou `.csv` salvo no dispositivo sem conexão.

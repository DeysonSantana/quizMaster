# 🏗️ QuizMaster - Documentação Técnica e Arquitetura do Sistema

Este documento fornece um guia técnico detalhado para desenvolvedores e **Agentes de Inteligência Artificial** (Gemini, Claude, GPT, etc.) para que qualquer modelo possa compreender instantaneamente a arquitetura, fluxo de dados, contratos de API e continuar o desenvolvimento sem atritos.

---

## 🎯 1. Visão Geral e Princípios de Design

- **100% Frontend / Serverless**: Não existe backend em Node.js/Python/PHP no servidor da aplicação. A aplicação é hospedada estaticamente no **GitHub Pages**.
- **Dual-Mode Database (Offline First + Cloud Sync)**:
  - **Modo Nuvem**: Utiliza **Google Firebase** (Authentication + Cloud Firestore) para sincronização em tempo real multi-dispositivos (PC, celular, tablet).
  - **Modo Local (Fallback)**: Caso a nuvem não esteja configurada ou o usuário esteja sem internet, opera transparentemente com `LocalStorage` e sintetizadores locais.
- **Sistema Dinâmico de Temas & Emojis**: Suporta 5 temas visuais (Dark Neon, Light Modern, Emerald, Sunset e Midnight AMOLED) e avatares expressivos com emojis.
- **Arquitetura Modular ES6**: Todo o código é dividido em módulos com responsabilidade única (`import`/`export`), sem bundlers obrigatórios, permitindo deploy imediato.
- **Roteamento Baseado em Hash (Hash-based Routing)**: Permite compartilhamento universal de links sem necessidade de reescrita de URL no servidor (`#room=PIN`, `#quiz=PAYLOAD`).

---

## 🗺️ 2. Mapa de Módulos (`js/`)

| Arquivo | Responsabilidade | Dependências |
| :--- | :--- | :--- |
| `js/app.js` | **Controlador Central (SPA)**: Gerencia telas (Welcome, Quiz, Results), teclado, ciclo de vida do jogo, timers e eventos globais. | Todos os gerenciadores |
| `js/themeManager.js` | **Gerenciador de Temas Visuais**: Aplica e persiste os 5 temas (Dark Neon, Light Modern, Emerald, Sunset, Midnight AMOLED) via variáveis CSS e `LocalStorage`. | `audio.js` |
| `js/firebaseConfig.js` | **Camada de Dados Serverless**: Inicializa Firebase SDK via CDN ES Modules e provê fallback para `LocalStorage`. | Firebase App, Auth, Firestore |
| `js/authManager.js` | **Gerenciador de Contas**: Login/Cadastro com Email/Senha, **Google Sign-In** (`GoogleAuthProvider`), perfil, avatar com emoji e estado da sessão. | `firebaseConfig.js`, `audio.js` |
| `js/quizBuilder.js` | **Criador Visual & Biblioteca de Quizzes**: CRUD de quizzes, temporizador por pergunta, importação CSV/IA e persistência no Firestore (`user_quizzes`). | `shareManager.js`, `csvParser.js`, `aiQuizModal.js`, `firebaseConfig.js` |
| `js/roomManager.js` | **Salas de Desafio (Kahoot)**: Criação de salas, PINs de 6 dígitos, expiração de tempo, listagem e exclusão no Firestore (`quiz_rooms`). | `firebaseConfig.js`, `shareManager.js`, `audio.js` |
| `js/leaderboardManager.js` | **Ranking e Pódio em Tempo Real**: Entrada por Nickname e Avatar Emoji, escuta ao vivo (`onSnapshot`) em `quiz_rooms/{pin}/scores`, pódio 🥇🥈🥉 e tabela de colocações. | `firebaseConfig.js`, `audio.js` |
| `js/aiService.js` | **Serviço de I.A**: Conexão com a API do Google Gemini (`gemini-2.5-flash`, `gemini-1.5-flash`) para formulação automática de perguntas em JSON estrito com quantidade aberta (1 a 50+). | Fetch REST API |
| `js/aiQuizModal.js` | **Interface do Gerador I.A**: Modal interativo com tags de temas, input aberto de quantidade com atalhos rápidos (5, 10, 15, 20, 30, 50) e chave de API. | `aiService.js`, `audio.js` |
| `js/shareManager.js` | **Compartilhamento & Encurtador**: Compressão LZ-String, decodificação de URLs, geração de links curtos e renderização de QR Code. | `qrcodeEngine.js` |
| `js/qrcodeEngine.js` | **Motor Gráfico de QR Code**: Gerador Canvas nativo autônomo (suporta Types 1 a 40) sem dependências externas. | Canvas API |
| `js/csvParser.js` | **Processamento CSV**: Leitura e validação de arquivos CSV com detecção inteligente de delimitador (`,` ou `;`) e exportação de templates. | FileReader API |
| `js/audio.js` | **Efeitos Sonoros Sintetizados**: Sintetizador sonoro via Web Audio API (sem arquivos MP3 externos), com cliques, vitória, combo, erro e ticks. | AudioContext |
| `js/questions.js` | **Banco Padrão de Perguntas**: 25 questões balanceadas de conhecimentos gerais utilizadas como banco inicial. | Array estático |

---

## 📊 3. Modelos de Dados (Data Schemas)

### 3.1. Perfil de Usuário (`UserProfile`)
Coleção Firestore: `user_profiles` | Chave LocalStorage: `QUIZMASTER_SESSION_USER`
```typescript
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarEmoji: string;      // Ex: '🎓', '🚀', '🧠', '🦁', '🦊', '🤖', etc.
  provider: 'google' | 'password' | 'local';
}
```

### 3.2. Questão (`Question`)
```typescript
interface Question {
  id: number | string;
  question: string;         // Enunciado da questão
  category: string;         // Ex: 'História', 'Ciência', 'Geral'
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  options: string[];        // Array com exatamente 4 alternativas [A, B, C, D]
  correctAnswer: number;    // Índice da alternativa correta (0 a 3)
  curiosity?: string;       // Explicação didática opcional exibida após a resposta
}
```

### 3.3. Quiz (`QuizData`)
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

### 3.4. Sala de Desafio (`RoomData`)
Coleção Firestore: `quiz_rooms` | Chave LocalStorage: `QUIZMASTER_LOCAL_ROOMS`
```typescript
interface RoomData {
  pin: string;              // Código numérico de 6 dígitos único (ex: '779967')
  title: string;            // Título do desafio
  quizTitle: string;        // Título do quiz vinculado
  author: string;           // Nome do anfitrião
  createdAt: string;        // ISO 8601 Timestamp
  durationMinutes: number;  // Duração (ex: 30, 60, ou null para sem limite)
  expiresAt: string | null; // ISO 8601 Timestamp de expiração
  active: boolean;          // Status ativo/inativo
  questions: Question[];    // Lista de perguntas do desafio
}
```

### 3.5. Pontuação do Jogador (`ScoreData`)
Subcoleção Firestore: `quiz_rooms/{pin}/scores` | Chave LocalStorage: `QUIZMASTER_LOCAL_SCORES`
```typescript
interface ScoreData {
  pin: string;              // PIN da sala
  nickname: string;         // Nome do aluno/jogador
  avatarEmoji: string;      // Emoji escolhido pelo jogador (ex: '🚀', '🦊')
  score: number;            // Pontuação total acumulada
  accuracy: number;         // Porcentagem de acertos (0 a 100)
  maxStreak: number;        // Maior sequência de acertos consecutivos
  submittedAt: string;      // ISO 8601 Timestamp
}
```

---

## 🎨 4. Sistema de Temas e Personalização

Os temas são controlados pelo atributo `data-theme` na tag `<html>` e classes CSS:
1. `cyberpunk` (Dark Neon padrão: tons de azul-noite `#0b0f19`, glow índigo e rosa).
2. `light` (Modo Claro Moderno: fundo `#f8fafc`, cards brancos e tipografia de alto contraste).
3. `emerald` (Natureza / Esmeralda: fundo `#041610`, tons de menta e esmeralda).
4. `sunset` (Pôr do Sol Quente: fundo `#140a08`, tons de âmbar, laranja e rosa).
5. `midnight` (AMOLED Black: fundo `#000000` preto puro e bordas contrastantes).

---

## 🤖 5. Guia para Agentes de I.A (Como Continuar o Desenvolvimento)

Ao receber solicitações de novas funcionalidades ou correções:

1. **Manter compatibilidade com GitHub Pages**:
   - Nunca adicione código que exija um servidor Node.js/Express em tempo de execução.
   - Use ES Modules com URLs CDN (`https://www.gstatic.com/firebasejs/...` ou `https://cdn.jsdelivr.net/...`).
2. **Sincronização Nuvem + Local**:
   - Ao criar novos recursos persistentes, implemente a escrita e leitura simultânea no Firestore e no `LocalStorage`.
3. **Validação de Sintaxe**:
   - Sempre execute a verificação de integridade antes de concluir a tarefa:
     ```powershell
     Get-ChildItem js\*.js | ForEach-Object { node --check $_.FullName }
     ```

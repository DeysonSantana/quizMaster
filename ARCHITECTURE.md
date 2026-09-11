# 🏗️ QuizMaster - Arquitetura de Software e Modelo de Gamificação

Este documento serve como **documentação técnica de referência** e **blueprint arquitetural** para o desenvolvimento de aplicações web ricas, interativas e gamificadas, demonstrando como integrar **PWA Offline-First**, **Serverless Real-Time Sync**, **Gamificação Educacional (Framework MDA)** e **Inteligência Artificial**.

---

## 🧭 1. Visão Geral e Princípios Arquiteturais

O **QuizMaster** é uma Single Page Application (SPA) moderna, rápida e responsiva, projetada para engajamento em sala de aula, treinamento corporativo e autoestudo.

```
+-------------------------------------------------------------------------------+
|                            CAMADA DE APRESENTAÇÃO (UI/UX)                     |
|  [ Tela Inicial ]   [ Construtor de Quiz ]   [ Sala/Lobby ]   [ Jogo & Pódio ]|
+-------------------------------------------------------------------------------+
                                      │
                                      ▼
+-------------------------------------------------------------------------------+
|                         CONTROLADOR CENTRAL (SPA APP)                         |
|                       Ciclo de Vida do Quiz • Timers • Ativação               |
+-------------------------------------------------------------------------------+
         │                       │                      │
         ▼                       ▼                      ▼
┌───────────────────┐ ┌────────────────────┐ ┌──────────────────────────────────┐
│  MÓDULOS DE JOGO  │ │ MÓDULOS MULTIPLAYER│ │   INFRAESTRUTURA & PERSISTÊNCIA  │
│ • aiService.js    │ │ • roomManager.js   │ │ • firebaseConfig.js (Dual DB)    │
│ • audio.js        │ │ • leaderboard.js   │ │ • offlineManager.js (PWA/Cache)  │
│ • themeManager.js │ │ • shareManager.js  │ │ • authManager.js (Google/Guest)  │
│ • csvParser.js    │ │ • qrcodeEngine.js  │ │ • LocalStorage (JSON/CSV Backup) │
└───────────────────┘ └────────────────────┘ └──────────────────────────────────┘
```

### 🌟 Pilares Técnicos de Design:
1. **100% Offline-First & PWA**: 
   - Funciona sem conexão à internet através de um **Service Worker (`sw.js`)** com estratégia *Cache-First*.
   - Manifesto PWA (`manifest.json`) permite instalação direta na tela inicial (Android, iOS, Windows, macOS, Linux).
2. **Dual-Mode Persistence (Local + Cloud Firestore)**:
   - **Offline/Local**: Todos os dados (quizzes, preferências, pontuações, salas) funcionam via `LocalStorage` e exportações físicas `.json`/`.csv`.
   - **Cloud Sync**: Quando conectado, sincroniza em tempo real com **Google Firebase** (Auth + Firestore).
3. **Stateless URL State Sharing**:
   - Quizzes e salas podem ser transportados na própria URL através de compressão **LZ-String** (`#room=PIN&d=PAYLOAD`), dispensando dependência de banco de dados para compartilhamento rápido.
4. **Zero Fricção de Entrada (*Instant-Play*)**:
   - Acesso como convidado em 1 clique (com nome e avatar emoji) ou login social com Google / Email.
5. **Recursos Nativos sem Dependências Pesadas**:
   - **Áudio**: Sintetizado proceduralmente via `Web Audio API` (0 arquivos MP3 externos).
   - **QR Code**: Renderizado nativamente em `<canvas>` (`qrcodeEngine.js`).
   - **CSV/JSON**: Processados no cliente via `FileReader API`.

---

## 🎮 2. O Modelo de Gamificação (Framework MDA)

O QuizMaster adota o framework acadêmico **MDA** (*Mechanics, Dynamics & Aesthetics*):

### ⚙️ 2.1. Mecânicas (Mechanics - As Regras do Sistema)

| Mecânica | Implementação no QuizMaster | Benefício Psicológico / Pedagógico |
| :--- | :--- | :--- |
| **3 Modos de Pontuação** | 🎯 *Apenas Acertos* (`correct_only`), ⚡ *Mais Rápido* (`speed_only`), 🏆 *Rápido e Certo* (`speed_and_accuracy`). | Permite adaptar a regra ao objetivo da atividade (avaliação calma vs gincana de agilidade). |
| **Combos & Streaks** | Contador visual `🔥 2x, 3x Combo` com bônus acumulativo (`(streak - 1) * 20`). | Recompensa a consistência e estimula foco contínuo. |
| **Temporizador Dinâmico** | Contagem de 5s a 30s por pergunta ou modo livre (sem tempo). | Gera senso de urgência e cadência dinâmica. |
| **Formatos Variados** | Múltipla Escolha (4 opções) e Fato ou Fake (Binário). | Quebra monotonia e ativa raciocínio crítico rápido. |
| **Feedback Formativo Imediato** | Exibição de "Pílula de Curiosidade" após cada resposta. | Transforma acertos e erros em microaprendizados imediatos. |
| **Salas ao Vivo (Kahoot)** | Lobby síncrono com PIN de 6 dígitos, início controlado e kick de jogadores. | Coordena turmas inteiras com senso de evento ao vivo. |
| **Revisão Focada no Erro** | Botão "Refazer Apenas Erradas" na tela de resultados. | Incentiva aprendizagem adaptativa e superação do erro. |

---

### 🎲 2.2. Dinâmicas (Dynamics - O Comportamento dos Jogadores)

1. **Competição Saudável & Pódio**: O ranking ao vivo com pódio visual 🥇🥈🥉 e contagem de acertos promove engajamento coletivo sem desencorajar participantes.
2. **Identidade Visual Expressiva**: Seleção entre **40 avatares em emoji** permite representação lúdica sem burocracia cadastral.
3. **Gestão de Risco**: No modo *Rápido e Certo*, responder mais rápido rende mais pontos, mas errar zera o combo, criando um dilema estratégico entre velocidade e cautela.

---

### 🎨 2.3. Estética (Aesthetics - A Experiência Emocional)

1. **Feedback Sonoro Procedural**: Efeitos sintetizados para clique, acerto, erro, combo e fanfarra de vitória ativam reforço dopaminérgico positivo.
2. **Celebração Visual**: Partículas de confete (`canvas-confetti`) comemoram combos e conclusões de quiz.
3. **5 Temas Visuais Imersivos**: Dark Neon, Sunset Gradient, Emerald Nature, Midnight AMOLED e Light Modern adaptam-se à preferência estética e ergonomia visual.

---

## 🗺️ 3. Mapa de Módulos e Responsabilidades

| Arquivo | Responsabilidade Principal | Tecnologias Utilizadas |
| :--- | :--- | :--- |
| `sw.js` | Service Worker PWA com cache offline estratégico | Cache Storage API, Fetch API |
| `js/app.js` | Orquestrador principal da SPA, máquinas de estado de telas e game loop | Vanilla JS ES6 Modules |
| `js/audio.js` | Sintetizador de áudio procedural para gamificação | Web Audio API (`AudioContext`, `OscillatorNode`) |
| `js/themeManager.js` | Gestor dos 5 temas visuais com persistência local | CSS Custom Properties, LocalStorage |
| `js/offlineManager.js` | Monitoramento online/offline, PWA install prompt e backup físico | Navigator Network API, FileReader |
| `js/authManager.js` | Autenticação Google Sign-In, Email/Senha e Modo Convidado | Firebase Auth, LocalStorage |
| `js/roomManager.js` | Gerenciamento de Salas, PINs, regras de início, expulsão e links | Firestore REST/SDK, LocalStorage |
| `js/leaderboardManager.js` | Ranking ao vivo (`onSnapshot`), Pódio e Lobby de espera | Firestore Realtime Listener, SoundFx |
| `js/quizBuilder.js` | Criador visual de quizzes, editor de perguntas e gestão de arquivos | DOM Manipulation, JSON/CSV I/O |
| `js/aiService.js` | Integração com a API do Google Gemini (modelos Flash/Pro e fallback resiliente) | REST Fetch API, JSON Schema |
| `js/aiQuizModal.js` | Interface visual do gerador de quizzes por inteligência artificial | Lucide Icons, Vanilla JS |
| `js/shareManager.js` | Serialização/Deserialização de quizzes e salas em URLs compactadas | LZ-String, Base64 URI |
| `js/qrcodeEngine.js` | Motor gerador de QR Code autônomo sem dependências externas | HTML5 Canvas API |
| `js/csvParser.js` | Parser e gerador de templates CSV com detecção de delimitadores | Regex, Blob API |
| `js/questions.js` | Banco de perguntas padrão de conhecimentos gerais | Array de objetos |

---

## 📊 4. Esquemas de Dados (Data Schemas)

### 4.1. `Question`
```typescript
interface Question {
  id: number;
  type: 'multiple_choice' | 'fact_fake';
  question: string;
  category: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  options: string[];            // ['A', 'B', 'C', 'D'] ou ['Fato', 'Fake']
  correctAnswer: number;        // Índice da resposta correta (0..3 ou 0..1)
  curiosity: string;            // Pílula pedagógica explicativa
}
```

### 4.2. `QuizData`
```typescript
interface QuizData {
  id: string;                   // Ex: 'quiz_1740000000000'
  title: string;
  author: string;
  timerSeconds: number;         // 5, 10, 15, 20, 25, 30 ou 0 (sem limite)
  scoringMode: 'speed_and_accuracy' | 'correct_only' | 'speed_only';
  questions: Question[];
  createdAt: string;            // ISO 8601 Timestamp
  userId?: string | null;       // UID do Firebase Auth se logado
}
```

### 4.3. `RoomData`
```typescript
interface RoomData {
  pin: string;                  // PIN de 6 dígitos (ex: '849201')
  title: string;                // Título da sala / turma
  quizTitle: string;
  author: string;
  startMode: 'host_controlled' | 'open';
  scoringMode: 'speed_and_accuracy' | 'correct_only' | 'speed_only';
  status: 'waiting' | 'active' | 'finished' | 'closed';
  expiresAt: string | null;     // Data de expiração ISO ou null
  createdAt: string;
  active: boolean;
  questions: Question[];
}
```

### 4.4. `ScoreData`
```typescript
interface ScoreData {
  pin: string;
  nickname: string;
  avatarEmoji: string;          // Ex: '🎓', '🚀', '🦁'
  score: number;
  accuracy: number;             // Percentual de 0 a 100
  maxStreak: number;            // Maior combo obtido
  completedAt: string;          // ISO Timestamp
}
```

---

## 🚀 5. Blueprint: Como Reutilizar Este Modelo em Outras Aplicações

Para replicar este padrão em novos sistemas interativos:

1. **Flashcards & Aprendizagem de Idiomas**:
   - Reutilize `app.js` e `audio.js` substituindo a tela de alternativas por um card 3D com rotação ao toque e modo de pontuação `correct_only`.
2. **Treinamentos Corporativos & Compliance**:
   - Use o formato `fact_fake` para desmistificar dúvidas frequentes de normas corporativas, utilizando o gerador de salas por departamento com ranking.
3. **Desafios Matemáticos e Lógicos**:
   - Combine o `aiService.js` com prompts matemáticos e ative o modo `speed_only` para dinâmicas de raciocínio rápido.
4. **Gincanas e Caça ao Tesouro Físicas**:
   - Use o `qrcodeEngine.js` para gerar QR codes impressos em ambientes físicos, liberando etapas sequenciais com ranking em tempo real no `leaderboardManager.js`.

---

## 🛡️ 6. Boas Práticas e Recomendações de Engenharia

- **Resiliência a Falhas**: Tratamento gracioso para perda de rede, chaves de API expiradas e reconexão automática.
- **Desempenho**: Renderização leve com CSS nativo e Tailwind, sem frameworks pesados, garantindo 60fps até em celulares de entrada.
- **Acessibilidade**: Suporte a atalhos de teclado (`A, B, C, D`, `1, 2, 3, 4`, `V, F`, `Enter`), contraste adaptativo nos temas e leitura semântica.


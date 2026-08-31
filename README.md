# 🧠 QuizMaster - Plataforma Gamificada de Quizzes, I.A, Salas de Desafio & Rankings (Estilo Kahoot)

> Aplicação web moderna, interativa, gamificada e **100% estática (frontend-only)** projetada para funcionar com alta performance na **hospedagem gratuita do GitHub Pages**.

Conta com **Sistema de Temas (Dark/Light/Cores)**, **Avatar Emoji Personalizável**, **Login com Google e Email/Senha**, **Banco de Dados Serverless (Firebase Cloud + LocalStorage)**, **Gerador de Quizzes por I.A com Quantidade Aberta**, **Upload CSV**, **Compartilhamento por Link Curto/QR Code** e **Salas de Desafio com Tempo Limite e Ranking de Colocações ao Vivo (estilo Kahoot)**.

---

## 🌟 Principais Recursos

### 1. 🎨 Sistema de Temas e Modo Escuro/Claro (5 Temas)
- 🌌 **Dark Neon / Cyberpunk**: Escuro elegante com tons de índigo e pink.
- ☀️ **Light Modern / Clean**: Modo claro com alto contraste, cards brancos e nitidez visual.
- 🌲 **Nature Emerald**: Verde floresta e esmeralda.
- 🌅 **Sunset Warm**: Tons quentes de âmbar, laranja e pôr do sol.
- 👾 **Midnight AMOLED**: Preto puro (`#000000`) para economia de bateria e contraste máximo em telas OLED.
- Botão de tema no Header (🎨), no Menu Lateral Mobile (*Drawer*) e nas configurações de perfil.

### 2. 🎭 Avatar com Emojis Expressivos
- Escolha seu avatar favorito: 🎓, 🚀, 🧠, 🦁, 🦊, 🤖, 🧙‍♂️, 👑, ⚡, 🌟, 🐱, 🐶, 👾, 🎯, 🏆, 🔥.
- Exibido no Header, Menu Mobile, Perfil, Salas de Desafio e no **Pódio 🥇🥈🥉 e Tabela do Leaderboard ao vivo**!

### 3. 🔢 Quantidade Aberta de Perguntas
- Crie quizzes com qualquer quantidade de perguntas desejada (1 a 50+ perguntas).
- No gerador com I.A (Google Gemini), informe a quantidade desejada ou use atalhos rápidos (5, 10, 15, 20, 30, 50).
- Suporte ilimitado no Quiz Builder visual.

### 4. 🔐 Autenticação Universal (Google Sign-In & Email/Senha)
- **Continuar com o Google**: Login instantâneo em 1 clique.
- **Email e Senha**: Cadastro e autenticação seguros com sincronização no Firebase Auth e Firestore.

### 5. 🏆 Salas de Desafio & Pódio em Tempo Real (Estilo Kahoot)
- Crie salas com **PIN de 6 dígitos** (ex: `779967`) e **QR Code gráfico direto** para leitura instantânea por câmeras de celulares.
- Configure a duração da sala (15m, 30m, 1h, 2h, 24h, 7 dias ou Sem limite).
- **Pódio ao Vivo (Top 3)** com medalhas 🥇 1º Ouro, 🥈 2º Prata e 🥉 3º Bronze e avatares emoji dos competidores.

### 6. ⏱️ Temporizador Personalizado por Pergunta & Timeout Inteligente
- Ritmo configurável: `5s`, `10s`, `15s`, `20s (Padrão)`, `25s`, `30s` ou `Sem tempo (Livre)`.
- Ao esgotar o tempo, avança automaticamente sem revelar o gabarito.

### 7. 📱 Menu Lateral Responsivo (Aside Drawer)
- Em celulares e tablets, uma experiência limpa com menu lateral deslizante (*glassmorphism*) e navegação com 1 toque.

---

## 📂 Estrutura de Arquivos

```
quiz/
│
├── index.html                  # Interface SPA com todos os modais (Jogo, Criador, I.A, Salas, Auth, Ranking, Temas)
├── ARCHITECTURE.md             # Guia técnico detalhado para Agentes de I.A e Desenvolvedores
├── README.md                   # Documentação geral do projeto
├── favicon.svg                 # Ícone do aplicativo
├── css/
│   └── styles.css              # Estilos responsivos, temas dinâmicos (Light/Dark/Emerald/Sunset/AMOLED)
├── js/
│   ├── app.js                  # Controlador central da aplicação (Ciclo de vida, Teclado, Telas)
│   ├── themeManager.js         # Gerenciador dinâmico de temas e cores
│   ├── firebaseConfig.js       # Conector Serverless (Firebase Cloud + Fallback Local)
│   ├── authManager.js          # Gerenciador de Autenticação (Google Sign-In, Perfil e Avatar Emoji)
│   ├── roomManager.js          # Gestor de Salas de Desafio, PINs e Duração
│   ├── leaderboardManager.js   # Ranking em tempo real, Pódio 🥇🥈🥉 e Avatares dos Jogadores
│   ├── quizBuilder.js          # Criador visual de quizzes e persistência em nuvem
│   ├── aiService.js            # Integração com a API do Google Gemini com quantidade aberta
│   ├── aiQuizModal.js          # Modal interativo do assistente de I.A com input aberto
│   ├── shareManager.js         # Codificação de URL portátil, encurtador e QR Code
│   ├── qrcodeEngine.js         # Motor Canvas nativo de alta densidade de QR Code
│   ├── csvParser.js            # Parser de CSV com detecção de delimitador
│   ├── audio.js                # Sintetizador sonoro via Web Audio API
│   └── questions.js            # 25 perguntas de conhecimentos gerais padrão
└── quiz_modelo_exemplo.csv      # Arquivo de exemplo pronto para testes
```

---

## 🚀 Como Executar Localmente

No terminal, na pasta do projeto:
```powershell
python -m http.server 8000
```
Acesse no seu navegador: **`http://localhost:8000`**

---

## 🌐 Como Hospedar no GitHub Pages

1. Crie um repositório no seu GitHub (ex: `quizMaster`).
2. Envie os arquivos do projeto:
   ```powershell
   git add .
   git commit -m "Publicação do QuizMaster"
   git push -u origin main
   ```
3. No repositório no GitHub, vá em **Settings** ➔ **Pages**.
4. Em **Branch**, selecione `main` (ou `master`) e a pasta `/(root)` e clique em **Save**.
5. Em cerca de 1 minuto, seu app estará online em: `https://seu-usuario.github.io/quizMaster/`.

---

## 📚 Documentação para Agentes de Inteligência Artificial

Para entender detalhes dos contratos de dados, fluxo de eventos, modelos do Firestore e diretrizes para estender o código, consulte o arquivo:
👉 [**`ARCHITECTURE.md`**](ARCHITECTURE.md)

# 🧠 QuizMaster - Plataforma Gamificada de Quizzes, I.A, Modo Offline & Salas de Desafio (Estilo Kahoot)

> Aplicação web moderna, interativa, gamificada e **100% Offline-First (PWA)** projetada para funcionar com alta performance na **hospedagem gratuita do GitHub Pages** ou instalada como aplicativo nativo no celular e computador.

Conta com **Funcionamento 100% Offline (PWA & Service Worker)**, **Criação e Salvamento Local de Quizzes com Backup JSON/CSV**, **Sistema de 5 Temas (Dark/Light/Cores)**, **Avatar Emoji Personalizável**, **Login com Google e Email/Senha**, **Banco de Dados Serverless (Firebase Cloud + LocalStorage)**, **Gerador de Quizzes por I.A com Quantidade Aberta** e **Salas de Desafio com Tempo Limite e Ranking de Colocações ao Vivo (estilo Kahoot)**.

---

## 🌟 Principais Recursos

### 1. 📶 100% Offline & PWA (Funciona sem Internet)
- **Service Worker (`sw.js`)**: Armazena em cache todos os arquivos, módulos, estilos e bibliotecas para carregar instantaneamente mesmo em modo avião ou sem sinal.
- **Instalação Nativa (PWA)**: Botão "Instalar App" no cabeçalho e menu lateral para adicionar o QuizMaster à tela inicial do Android, iOS, Windows e Mac.
- **Indicador de Status**: Badge em tempo real (🟢 `Online` / ⚡ `Modo Offline`).

### 2. 💾 Criação e Salvamento Local de Quizzes
- **Crie quizzes no Construtor Visual** e salve-os diretamente no dispositivo (`LocalStorage`).
- **Backup Físico Offline**: Botão **"Baixar Arquivo (.json)"** para salvar arquivos de quiz no disco local.
- **Importação Offline**: Botão **"Importar Arquivo (.json / .csv)"** para carregar quizzes do celular/computador sem necessidade de rede.
- **Jogar Offline**: Jogue qualquer quiz salvo localmente com 1 clique.

### 3. 🎨 Sistema com 5 Temas Visuais (Dark / Light / Cores)
- 🌌 **Dark Neon / Cyberpunk**: Escuro com tons de índigo e pink.
- ☀️ **Light Modern / Clean**: Modo claro de alto contraste e cards brancos.
- 🌲 **Nature Emerald**: Verde floresta e esmeralda.
- 🌅 **Sunset Warm**: Tons quentes de âmbar, laranja e pôr do sol.
- 👾 **Midnight AMOLED**: Preto puro (`#000000`) para telas OLED.

### 4. 🎭 Avatar com Emojis Expressivos
- Escolha seu avatar favorito: 🎓, 🚀, 🧠, 🦁, 🦊, 🤖, 🧙‍♂️, 👑, ⚡, 🌟, 🐱, 🐶, 👾, 🎯, 🏆, 🔥.
- Exibido no Header, Menu Mobile, Perfil, Salas e no **Pódio 🥇🥈🥉 e Tabela do Leaderboard**.

### 5. 🔐 Autenticação Universal & Nuvem (Google & Email/Senha)
- Login em 1 clique com **Google Sign-In** ou cadastro tradicional por **Email e Senha**.
- Sincronização em nuvem via **Firebase Firestore** quando online, com fallback offline automático.

### 6. 🏆 Salas de Desafio & Pódio em Tempo Real (Estilo Kahoot)
- Crie salas com **PIN de 6 dígitos** e **QR Code gráfico direto**.
- **Pódio ao Vivo (Top 3)** com medalhas 🥇 1º Ouro, 🥈 2º Prata e 🥉 3º Bronze.

---

## 📂 Estrutura de Arquivos

```
quiz/
│
├── index.html                  # Interface SPA (Jogo, Criador, I.A, Salas, Auth, Ranking, Temas, PWA)
├── manifest.json               # Manifesto PWA para instalação como app nativo
├── sw.js                       # Service Worker com cache para funcionamento 100% offline
├── ARCHITECTURE.md             # Guia técnico detalhado para Agentes de I.A e Desenvolvedores
├── README.md                   # Documentação geral do projeto
├── favicon.svg                 # Ícone do aplicativo
├── css/
│   └── styles.css              # Estilos responsivos, temas dinâmicos (Light/Dark/Emerald/Sunset/AMOLED)
├── js/
│   ├── app.js                  # Controlador central da aplicação
│   ├── offlineManager.js       # Gerenciador de PWA, Service Worker, status de rede e arquivos JSON
│   ├── themeManager.js         # Gerenciador dinâmico de temas e cores
│   ├── firebaseConfig.js       # Conector Serverless (Firebase Cloud + Fallback Local)
│   ├── authManager.js          # Gerenciador de Autenticação (Google Sign-In, Perfil e Avatar)
│   ├── roomManager.js          # Gestor de Salas de Desafio, PINs e Duração
│   ├── leaderboardManager.js   # Ranking em tempo real, Pódio 🥇🥈🥉 e Avatares
│   ├── quizBuilder.js          # Criador visual de quizzes e persistência local/nuvem
│   ├── aiService.js            # Integração com a API do Google Gemini com quantidade aberta
│   ├── aiQuizModal.js          # Modal interativo do assistente de I.A
│   ├── shareManager.js         # Codificação de URL portátil, encurtador e QR Code
│   ├── qrcodeEngine.js         # Motor Canvas nativo de alta densidade de QR Code
│   ├── csvParser.js            # Parser de CSV com detecção de delimitador
│   ├── audio.js                # Sintetizador sonoro via Web Audio API local
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

1. Envie os arquivos atualizados para o seu repositório:
   ```powershell
   git add .
   git commit -m "Adiciona suporte 100% Offline, PWA, Service Worker e Backup JSON"
   git push
   ```
2. O aplicativo funcionará online e offline automaticamente para todos os usuários!

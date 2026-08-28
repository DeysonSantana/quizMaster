# 🧠 QuizMaster - Plataforma Completa de Quizzes, I.A, Contas de Usuário e Salas com Ranking (Estilo Kahoot)

Aplicação web moderna, interativa, gamificada e **100% estática (frontend-only)** projetada para funcionar perfeitamente na **hospedagem gratuita do GitHub Pages**.

Conta com **criação de contas por email/senha**, **banco de dados serverless**, **gerador de quizzes por Inteligência Artificial (Google Gemini)**, **upload CSV**, **compartilhamento portátil por Link/QR Code** e **criação de Salas de Desafio com tempo limite e Ranking de Colocações ao Vivo (estilo Kahoot)**.

---

## 🌟 Principais Recursos

### 1. 🌐 100% Compatível com GitHub Pages (Sem Servidor Próprio)
- Toda a lógica roda no navegador (Client-side SPA com módulos ES6).
- Utiliza **SDKs Serverless** (Firebase Auth + Firestore) com **Banco de Dados Local (LocalStorage/IndexedDB)** nativo como fallback inteligente.
- Pode ser publicado diretamente em qualquer repositório do GitHub com GitHub Pages ativado em segundos.

### 2. 🔐 Criação de Contas e Autenticação (Email e Senha)
- Cadastro e login de usuários com email e senha.
- Modal de perfil com exibição do usuário ativo e opção de logout.
- Painel **"Conectar Nuvem (Firebase)"** para conectar projetos Firebase gratuitos ou usar o Banco Local offline.

### 3. 🏆 Salas de Desafio com Tempo Limite e Ranking ao Vivo (Estilo Kahoot)
- O criador/professor pode abrir uma **Sala de Desafio** para qualquer quiz:
  - Definir **Duração da Sala** (15 min, 30 min, 1 hora, 2 horas, 24 horas, 7 dias ou Sem limite).
  - Gerar um **Código PIN de 6 dígitos** (ex: `849201`) e **Link Direto** (`#room=849201`).
  - QR Code exclusivo da Sala para os participantes escanearem.
- **Entrada Rápida por PIN**: Participantes entram digitando o PIN na tela inicial ou pelo link.
- **Pódio e Leaderboard em Tempo Real**:
  - Pódio dos 3 primeiros colocados (🥇 1º Ouro, 🥈 2º Prata, 🥉 3º Bronze).
  - Tabela completa de colocações com pontuação, precisão de acertos e combos.
  - Modo telão/apresentador para projetar em salas de aula ou eventos.

### 4. 🤖 Gerador de Quizzes com Inteligência Artificial (Google Gemini)
- Digite qualquer tema e a I.A formula perguntas pedagógicas balanceadas com alternativas e curiosidades.
- Suporte a **Texto Base**: Cole um resumo para extrair perguntas diretamente dele.
- Seleção de quantidade (5 a 25) e dificuldade (Fácil, Médio, Difícil ou Misto).

### 5. 📁 Importação e Exportação via CSV
- Carregue planilhas `.CSV` diretamente na tela inicial ou dentro do construtor de quizzes.
- Suporte automático a separadores `,` e `;` e botão de **"Baixar Modelo CSV"**.

### 6. 🔗 Compartilhamento Instantâneo por Link e QR Code
- Quizzes comprimidos em URL (`#quiz=...`) com `LZ-String` e motor próprio de QR Code (Tipos 1 a 40) que funciona sem internet.

---

## 📂 Estrutura do Projeto

```
quiz/
│
├── index.html                  # Interface SPA com todos os modais (Jogo, Criador, I.A, Salas, Auth, Ranking)
├── css/
│   └── styles.css              # Estilos responsivos, glassmorphism e animações touch
├── js/
│   ├── firebaseConfig.js       # Conector Serverless (Firebase Cloud + LocalDB Fallback)
│   ├── authManager.js          # Gerenciador de Contas (Email/Senha e Perfil)
│   ├── roomManager.js          # Gestor de Salas de Desafio, PINs e Duração
│   ├── leaderboardManager.js   # Ranking em tempo real, Pódio 🥇🥈🥉 e Tabela
│   ├── aiService.js            # Integração com API Google Gemini
│   ├── aiQuizModal.js          # Modal do assistente de I.A
│   ├── questions.js            # 25 perguntas de conhecimentos gerais padrão
│   ├── csvParser.js            # Parser de CSV com detecção de delimitador
│   ├── qrcodeEngine.js         # Motor nativo de alta densidade de QR Code
│   ├── shareManager.js         # Codificação de URL compactada e QR Code
│   ├── quizBuilder.js          # Criador visual de quizzes e Meus Quizzes
│   ├── audio.js                # Sintetizador de áudio Web Audio API
│   └── app.js                  # Inicializador central e motor do quiz
├── quiz_modelo_exemplo.csv      # Arquivo de exemplo pronto para testes
└── README.md                   # Documentação completa
```

---

## 🚀 Como Executar Localmente

No terminal, na pasta do projeto:
```powershell
python -m http.server 8000
```
Acesse no seu navegador: **`http://localhost:8000`**

---

## 🌐 Como Hospedar no GitHub Pages (Gratuito)

1. Crie um repositório no seu GitHub (ex: `quizmaster`).
2. Faça o upload de todos os arquivos da pasta `quiz`.
3. No repositório no GitHub, vá em **Settings** > **Pages**.
4. Em **Branch**, selecione `main` (ou `master`) e a pasta `/(root)`.
5. Clique em **Save**. Em instantes seu quiz estará online no link `https://seu-usuario.github.io/quizmaster/`.

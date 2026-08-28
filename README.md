# 🧠 QuizMaster - Plataforma Gamificada de Quizzes, I.A, Salas de Desafio & Rankings (Estilo Kahoot)

> Aplicação web moderna, interativa, gamificada e **100% estática (frontend-only)** projetada para funcionar com alta performance na **hospedagem gratuita do GitHub Pages**.

Conta com **Login com Google e Email/Senha**, **Banco de Dados Serverless (Firebase Cloud + LocalStorage)**, **Gerador de Quizzes por I.A (Google Gemini)**, **Upload CSV**, **Compartilhamento por Link Curto/QR Code** e **Salas de Desafio com Tempo Limite e Ranking de Colocações ao Vivo (estilo Kahoot)**.

---

## 🌟 Principais Recursos

### 1. 🌐 100% Compatível com GitHub Pages (Zero Backend no Servidor)
- Toda a lógica roda no navegador (Client-side Single Page Application com módulos ES6 nativos).
- Não requer Node.js, PHP ou Python no servidor de produção.
- Utiliza **Firebase Cloud SDKs** com fallback inteligente para **Banco de Dados Local (LocalStorage/IndexedDB)**.

### 2. 🔐 Autenticação Universal (Google Sign-In & Email/Senha)
- **Continuar com o Google**: Login instantâneo em 1 clique.
- **Email e Senha**: Cadastro e autenticação seguros.
- Sincronização automática de sessão em múltiplos computadores, celulares e tablets.

### 3. 🏆 Salas de Desafio & Pódio em Tempo Real (Estilo Kahoot)
- Crie salas com **PIN de 6 dígitos** (ex: `779967`) e **QR Code gráfico direto** para leitura instantânea por câmeras de celulares.
- Configure a duração da sala (15m, 30m, 1h, 2h, 24h, 7 dias ou Sem limite).
- **Pódio ao Vivo (Top 3)** com medalhas 🥇 1º Ouro, 🥈 2º Prata e 🥉 3º Bronze.
- Tabela completa de colocações com pontuação, precisão de acertos e combos.

### 4. ⏱️ Temporizador Personalizado por Pergunta & Timeout Inteligente
- Selecione o ritmo do desafio: `5s (Super Rápido)`, `10s`, `15s`, `20s (Padrão)`, `25s`, `30s` ou `Sem tempo (Livre)`.
- **Avanço Automático no Timeout**: Ao esgotar o tempo, o sistema não revela o gabarito, zera o combo e passa imediatamente para a próxima pergunta.

### 5. 🤖 Gerador de Quizzes com Inteligência Artificial (Google Gemini)
- Criação pedagógica de quizzes por tema ou a partir de um **Texto Base / Artigo** colado.
- Suporte a modelos `gemini-2.5-flash` e `gemini-1.5-flash` com geração em JSON estrito.

### 6. 📱 Menu Lateral Responsivo (Aside Drawer)
- Em celulares e tablets, uma experiência limpa com menu lateral deslizante (*glassmorphism*) e navegação com 1 toque.

### 7. 📁 Importação e Exportação via CSV
- Importe planilhas `.CSV` ou baixe modelos prontos para preenchimento.

---

## 📂 Estrutura de Arquivos

```
quiz/
│
├── index.html                  # Interface SPA com todos os modais (Jogo, Criador, I.A, Salas, Auth, Ranking)
├── ARCHITECTURE.md             # Guia técnico detalhado para Agentes de I.A e Desenvolvedores
├── README.md                   # Documentação geral do projeto
├── favicon.svg                 # Ícone do aplicativo
├── css/
│   └── styles.css              # Estilos responsivos, animações e glassmorphism
├── js/
│   ├── app.js                  # Controlador central da aplicação (Ciclo de vida, Teclado, Telas)
│   ├── firebaseConfig.js       # Conector Serverless (Firebase Cloud + Fallback Local)
│   ├── authManager.js          # Gerenciador de Autenticação (Google Sign-In e Email/Senha)
│   ├── roomManager.js          # Gestor de Salas de Desafio, PINs e Duração
│   ├── leaderboardManager.js   # Ranking em tempo real e Pódio 🥇🥈🥉
│   ├── quizBuilder.js          # Criador visual de quizzes e persistência em nuvem
│   ├── aiService.js            # Integração com a API do Google Gemini
│   ├── aiQuizModal.js          # Modal interativo do assistente de I.A
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

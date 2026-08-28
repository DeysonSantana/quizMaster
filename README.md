# 🧠 QuizMaster - Criador de Quizzes com Inteligência Artificial, CSV & Compartilhamento por Link/QR Code

Aplicação web interativa, responsiva e gamificada desenvolvida para engajar participantes, estudantes ou turmas com perguntas de conhecimentos gerais ou **quizzes 100% personalizados criados com Inteligência Artificial (Google Gemini), importados via CSV ou montados visualmente, e compartilháveis instantaneamente por link direto e QR Code**.

---

## 🌟 Principais Funcionalidades

- **🤖 Gerador Inteligente de Quiz com I.A (Google Gemini)**:
  - Digite qualquer tema (ex: *"Astronomia"*, *"Revolução Francesa"*, *"Biologia Celular"*, *"Programação Python"*) e a I.A formula instantaneamente um quiz balanceado e didático.
  - Suporte a **Texto Base / Resumo de Aula**: Cole um artigo ou trecho de livro para a I.A extrair perguntas focadas naquele conteúdo.
  - Selecione a quantidade (5, 10, 15, 20 ou 25 perguntas) e a dificuldade (Fácil, Médio, Difícil ou **Misto com Progressão Pedagógica**).
  - Cada questão gerada pela I.A inclui 4 opções sem ambiguidades e uma **Pílula de Curiosidade** contextualizada.
  - Configuração simples da chave gratuita obtida no [Google AI Studio](https://aistudio.google.com/app/apikey), salva com segurança no navegador (`localStorage`).

- **✨ Criador Visual de Quizzes Online**:
  - Crie e edite perguntas com formulário interativo definindo título, autor, categoria, dificuldade, 4 opções, resposta correta e curiosidade didática.
  - Salva automaticamente na aba **"Meus Quizzes"** (`localStorage`) para nunca perder seu conteúdo.

- **🔗 Compartilhamento Instantâneo por Link (URL Portátil + QR Code Nativo)**:
  - Todas as perguntas e respostas são compactadas e codificadas no link (`#quiz=...`) usando algoritmo de alta eficiência (`LZ-String`).
  - **Zero necessidade de backend ou banco de dados**: envie o link direto ou projete o **QR Code** gerado na tela para qualquer jogador acessar de celulares ou computadores.
  - Motor nativo de QR Code de alta densidade (Tipos 1 a 40) que funciona 100% offline.

- **📁 Importação e Compartilhamento via CSV**:
  - Faça upload de arquivos `.CSV` com qualquer quantidade de perguntas diretamente na tela inicial ou dentro do Criador Visual.
  - Suporte automático a delimitadores por **vírgula (`,`)** ou **ponto-e-vírgula (`;`)**.
  - Botão de **"Baixar Modelo CSV"** com 1 clique direto na interface.

- **25 Perguntas Originais Cuidadosamente Balanceadas**:
  - Perguntas de conhecimentos gerais cobrindo História, Geografia, Ciência e Tecnologia, Arte e Cultura Pop, e Esportes.

- **Gamificação Completa**:
  - Pontuação dinâmica com multiplicador por nível de dificuldade e tempo restante.
  - Sistema de **Combos / Streaks** com bônus de pontuação, confetes (`canvas-confetti`) e efeitos sonoros sintetizados via **Web Audio API**.
  - Painel de resultados com gráficos por categoria, gabarito comentado e botão para **"Refazer Apenas Erradas"**.

---

## 📂 Estrutura de Arquivos

```
quiz/
│
├── index.html                  # Interface principal da aplicação com modais (SPA)
├── css/
│   └── styles.css              # Estilos visuais, glassmorphism e animações
├── js/
│   ├── questions.js            # Base de dados padrão (25 perguntas de conhecimentos gerais)
│   ├── aiService.js            # Integração com API Google Gemini e geração com JSON Schema
│   ├── aiQuizModal.js          # Controlador do modal do assistente de I.A
│   ├── csvParser.js            # Parser de CSV com detecção de delimitador e gerador de modelo
│   ├── qrcodeEngine.js         # Motor nativo de alta densidade de QR Code (Tipos 1 a 40)
│   ├── shareManager.js         # Codificação de URL compactada, QR Code e cópia de link
│   ├── quizBuilder.js          # Formulário visual de criação/edição e LocalStorage
│   ├── audio.js                # Gerenciador de sintetizador de áudio (Web Audio API)
│   └── app.js                  # Motor do quiz, inicialização de URLs e fluxo de jogo
├── quiz_modelo_exemplo.csv      # Arquivo CSV de modelo pronto para teste
└── README.md                   # Documentação do projeto
```

---

## 🚀 Como Executar

Por utilizar módulos ES6 nativos (`type="module"`), recomenda-se abrir a aplicação via servidor local:

### Opção 1: Usando Python (Simples e Rápido)
No terminal, dentro da pasta `quiz`:
```bash
python -m http.server 8000
```
Em seguida, acesse no navegador: `http://localhost:8000`

### Opção 2: Usando Node.js / npx
```bash
npx serve .
```

### Opção 3: Usando a extensão Live Server (VS Code)
Basta clicar com o botão direito no arquivo `index.html` e selecionar **"Open with Live Server"**.

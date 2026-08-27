# 🧠 QuizMaster - Criador de Quizzes & Compartilhamento por Link (URL / QR Code)

Aplicação web interativa, responsiva e gamificada desenvolvida para engajar participantes, estudantes ou turmas com perguntas de conhecimentos gerais ou **quizzes 100% personalizados criados online ou importados via CSV e compartilháveis por link direto e QR Code**.

---

## 🌟 Funcionalidades e Diferenciais

- **✨ Criador Visual de Quizzes Online**:
  - Crie perguntas com formulário interativo definindo título, autor, categoria, dificuldade, 4 opções, resposta correta e pílula de curiosidade.
  - Adicione quantas perguntas quiser com 1 clique.
  - Salva automaticamente na aba **"Meus Quizzes"** (`localStorage`) para nunca perder seu conteúdo.

- **🔗 Compartilhamento Instantâneo por Link (URL Portátil + QR Code)**:
  - Todas as perguntas e respostas são compactadas e codificadas no link (`#quiz=...`) usando algoritmo de alta eficiência (`LZ-String`).
  - **Zero backend/banco de dados necessário**: basta enviar o link ou projetar o **QR Code** gerado na tela para os alunos ou amigos jogarem de qualquer celular ou computador.
  - Ao abrir o link, o quiz personalizado carrega na hora!

- **📁 Importação e Compartilhamento via CSV**:
  - Faça upload de arquivos `.CSV` com qualquer quantidade de perguntas.
  - Suporte automático a delimitadores por **vírgula (`,`)** ou **ponto-e-vírgula (`;`)**.
  - Botão de **"Baixar Modelo CSV"** com 1 clique direto na interface.
  - Botão de **"Gerar Link"** direto do arquivo CSV importado para compartilhar com sua turma.

- **25 Perguntas Originais Cuidadosamente Balanceadas**:
  - **Categorias**: História, Geografia, Ciência e Tecnologia, Arte e Cultura Pop, e Esportes.
  - **Dificuldade Progressiva**: Fácil, Médio e Difícil (Expert).

- **Gamificação Completa**:
  - Pontuação dinâmica com multiplicador por nível de dificuldade e tempo restante.
  - Sistema de **Combos / Streaks** com bônus de pontuação e efeitos sonoros especiais.
  - Efeitos visuais com confetes (`canvas-confetti`) em combos altos e no encerramento.

- **Fator Didático**:
  - **Pílula de Curiosidade** contextualizada e exibida após cada pergunta para garantir aprendizado contínuo.

- **Áudio Nativo Imersivo**:
  - Efeitos sonoros para cliques, acertos, erros, combos e vitória gerados dinamicamente via **Web Audio API** (sem arquivos externos de áudio).

- **Estatísticas e Revisão Completa**:
  - Painel de resultados detalhado com taxa de precisão, maior combo e gráficos de aproveitamento por categoria.
  - Gabarito com revisão comentada de todas as perguntas e opção de **Refazer apenas as erradas**.

- **Acessibilidade e Atalhos**:
  - Suporte a teclado: Teclas `A`, `B`, `C`, `D` ou `1`, `2`, `3`, `4` para selecionar respostas e `Enter` para avançar.

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
│   ├── csvParser.js            # Parser de CSV com detecção de delimitador e gerador de modelo
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

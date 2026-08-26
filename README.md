# 🧠 QuizMaster - Conhecimentos Gerais (Aplicação Interativa)

Aplicação web interativa, responsiva e gamificada desenvolvida para engajar participantes, estudantes ou turmas com um desafio de 25 perguntas de conhecimentos gerais.

---

## 🌟 Funcionalidades e Diferenciais

- **25 Perguntas Cuidadosamente Balanceadas**:
  - **Categorias**: História, Geografia, Ciência e Tecnologia, Arte e Cultura Pop, e Esportes (5 perguntas cada).
  - **Dificuldade Progressiva**: 10 Fáceis, 10 Médias e 5 Difíceis (Expert).
- **Gamificação Completa**:
  - Pontuação dinâmica com multiplicador por nível de dificuldade e tempo restante.
  - Sistema de **Combos / Streaks** com bônus de pontuação e efeitos sonoros especiais.
  - Efeitos visuais com confetes (`canvas-confetti`) em combos altos e no encerramento.
- **Fator Didático**:
  - **Pílula de Curiosidade** contextualizada e exibida após cada pergunta para garantir aprendizado contínuo.
- **Áudio Nativo Imersivo**:
  - Efeitos sonoros para cliques, acertos, erros, combos e vitória gerados dinamicamente via **Web Audio API** (sem arquivos externos de áudio).
- **Estatísticas e Revisão Completa**:
  - Painel de resultados detalhado com taxa de precisão, maior combo e breakdown de aproveitamento por categoria.
  - Gabarito com revisão comentada de todas as 25 perguntas e opção de **Refazer apenas as erradas**.
- **Acessibilidade e Atalhos**:
  - Suporte a teclado: Teclas `A`, `B`, `C`, `D` ou `1`, `2`, `3`, `4` para selecionar respostas e `Enter` para avançar.

---

## 📂 Estrutura de Arquivos

```
quiz/
│
├── index.html           # Interface principal da aplicação (SPA)
├── css/
│   └── styles.css       # Estilos visuais, glassmorphism e animações
├── js/
│   ├── questions.js     # Base de dados estruturada com as 25 perguntas
│   ├── audio.js         # Gerenciador de sintetizador de áudio (Web Audio API)
│   └── app.js           # Motor do quiz, gerenciamento de estado e fluxo
└── README.md            # Documentação do projeto
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

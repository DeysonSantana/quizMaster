# 🧠 QuizMaster - Plataforma Gamificada de Quizzes, I.A, Fato ou Fake & Salas de Desafio

> Aplicação web moderna, interativa, gamificada e **100% Offline-First (PWA)** projetada para funcionar com alta performance na **hospedagem gratuita do GitHub Pages** ou instalada como aplicativo nativo no celular e computador.

Conta com **Modalidade Fato ou Fake (Verdadeiro ou Falso)**, **Múltipla Escolha (4 Alternativas)**, **Quizzes Mistos**, **Funcionamento 100% Offline (PWA & Service Worker)**, **Criação e Salvamento Local de Quizzes com Backup JSON/CSV**, **Sistema com 5 Temas (Dark/Light/Cores)**, **Avatar Emoji Personalizável**, **Login com Google e Email/Senha**, **Banco de Dados Serverless (Firebase Cloud + LocalStorage)**, **Gerador de Quizzes por I.A com Quantidade Aberta** e **Salas de Desafio com Tempo Limite e Ranking de Colocações ao Vivo (estilo Kahoot)**.

---

## 🌟 Principais Recursos

### 1. ⚡ Modalidade "Fato ou Fake" (Verdadeiro ou Falso)
- **Mega Cards Visuais**: Cards grandes em destaque (🟢 `FATO / VERDADEIRO` vs 🔴 `FAKE / FALSO`) com ícones e efeitos luminosos.
- **Atalhos Rápidos de Teclado**: Pressione **`V`** ou **`1`** para Fato, e **`F`** ou **`2`** para Fake.
- **Quizzes Mistos ou Exclusivos**: Suporte a criar ou gerar com I.A quizzes 100% de Fato/Fake ou mesclados com questões de 4 alternativas.

### 2. 📶 100% Offline & PWA (Funciona sem Internet)
- **Service Worker (`sw.js`)**: Armazena em cache todos os arquivos para abrir em menos de 1s mesmo sem internet ou em modo avião.
- **Instalação PWA**: Botão "Instalar App" para adicionar à tela inicial no Android, iOS, Windows e Mac.
- **Status de Conexão**: Badge em tempo real (🟢 `Online` / ⚡ `Modo Offline`).

### 3. 💾 Criação e Salvamento Local de Quizzes
- **Construtor Visual com Seletor de Tipo**: Alterne facilmente entre *Múltipla Escolha* e *Fato ou Fake* para cada pergunta.
- **Backup Físico Offline**: Baixe arquivos de quiz em `.json` ou planilhas `.csv`.
- **Importação Offline**: Carregue arquivos do disco sem precisar de conexão.

### 4. 🤖 Gerador com Inteligência Artificial (Google Gemini)
- Escolha o formato desejado: *Múltipla Escolha*, *Fato ou Fake (Mitos e Fatos)* ou *Misto*.
- Quantidade aberta de perguntas (1 a 50+).

### 5. 🎨 Sistema com 5 Temas Visuais (Dark / Light / Cores)
- 🌌 Dark Neon / Cyberpunk | ☀️ Light Modern | 🌲 Nature Emerald | 🌅 Sunset Warm | 👾 Midnight AMOLED.

### 6. 🎭 Avatar Emoji & Perfil
- Escolha entre 16 avatares emoji expressivos exibidos no jogo, nas salas e no **Pódio 🥇🥈🥉**.
- Exclusão permanente da própria conta com 1 clique no perfil.

### 7. 🔐 Autenticação Universal (Google & Email/Senha)
- Login instantâneo com Google Sign-In ou cadastro seguro com email/senha.

---

## 🚀 Como Executar Localmente

```powershell
python -m http.server 8000
```
Acesse no seu navegador: **`http://localhost:8000`**

---

## 🌐 Como Hospedar no GitHub Pages

```powershell
git add .
git commit -m "Implementa modalidade Fato ou Fake, seletor no construtor e gerador de IA v2.2.0"
git push
```

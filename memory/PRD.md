# PRD — rotina. (Wellness & Routine PWA)

## Original Problem Statement
Aplicativo web minimalista para celular focado em rotina, bem-estar e informação.
Design limpo, moderno, tons pastéis (roxo + verde menta) em modo escuro.
Menu inferior com 3 abas: **Minha Rotina**, **Mundo Hoje**, **Diário & Foco**.

## User Personas
- Usuário mobile-first que quer começar bem o dia
- Busca uma rotina leve com to-do, autocuidado (gratidão, leitura, meditação) e informação rápida

## Architecture
- **Backend**: FastAPI + MongoDB (motor), JWT auth (bcrypt) via httpOnly cookies (SameSite=None, Secure)
- **AI**: Gemini 3 Flash via `emergentintegrations` (Emergent Universal Key)
- **Frontend**: React 19 + React Router 7 + Tailwind, fonts Outfit + Figtree, ícones lucide-react

## Core Requirements (static)
1. 3-tab bottom navigation (Rotina, Mundo, Diário) — mobile-first, dark pastel
2. Login / Register JWT
3. To-Do com mensagem motivacional por IA ao concluir
4. Diário: gratidão + leitura (livro/página) + meditação (timer + texto)
5. Botão "Salvar Dia" + histórico
6. Feed "Mundo Hoje" (política, economia, boas notícias)

## What's Been Implemented
### Phase 1 (2026-02)
- ✅ Layout mobile pastel dark (Outfit/Figtree, glows ambientes, glass bottom nav)
- ✅ Auth JWT (register, login, logout, /me) com cookie httpOnly SameSite=None Secure
- ✅ Rotas protegidas + redirecionamento automático
- ✅ Aba **Minha Rotina**: to-do CRUD + toggle + delete
- ✅ Motivational toast em português (Gemini 3 Flash + fallback list de 8 frases)
- ✅ Aba **Diário & Foco**: gratidão, leituras (livro+página), meditação (timer play/pause/reset + texto), Salvar Dia, histórico com delete
- ✅ Testing agent: 100% backend, 95% frontend

### Phase 2 (2026-02)
- ✅ **Streak diário** na aba Rotina — card com chama, contagem de dias consecutivos salvos, recorde histórico (endpoint `/api/streak`)
- ✅ **Presets do timer** (Livre / 5 / 10 / 15 min) em Diário — modo cronômetro OU countdown com chime suave de 528Hz ao finalizar + micro-animação
- ✅ Aba **Mundo Hoje** completa — feed com 3 categorias (Política, Economia, Boas Notícias) simulado por Gemini 3 Flash, cache diário em Mongo (`news_cache`), fallback com 12 notícias PT-BR realistas
- ✅ Botão de refresh manual em Mundo Hoje

## Phase 3 (2026-02)
- ✅ **Notícias REAIS** via RSS de veículos brasileiros — G1 (Política/Economia), UOL Política, CNN Brasil (Política/Economia), InfoMoney, Só Notícia Boa, Razões para Acreditar, Catraca Livre. Endpoint `/api/news` agora usa `feedparser` (roda em thread pool + `asyncio.gather`), cache global de 30 min em Mongo, cada item tem `title`, `summary`, `source`, `url`, `published_at`, `image`. UI mostra imagem, hora relativa ("há X min") e botão "Ler matéria" (target=_blank) para a fonte original.
- ✅ **Estatísticas semanais no Diário** — endpoint `/api/diary/stats` agrega últimos 7 dias (`meditation_minutes`, `gratitude_count`, `reading_count`, `entries`). Componente `WeeklyStats` com 3 cards de totais + gráfico de barras (`recharts BarChart`) e auto-refresh ao salvar novo dia.
- ✅ **Sistema de temas de cores** — 5 paletas via CSS variables (`--c1..c4`, `--bg-app`, `--bg-card`): Lavanda & Menta, Pôr do Sol, Oceano, Floresta, Rosé. `ThemeContext` com `localStorage`, `ThemeSelector` (ícone paleta) posicionado à esquerda da bottom nav para não colidir com o badge Emergent no mobile. Toda a UI (títulos, botões, glows) troca instantaneamente.
- ✅ Testing agent: 100% backend, 100% frontend (iteration_2.json)

## Backlog / Future
- P1: Password reset / "Esqueci minha senha"
- P2: PWA install manifest + service worker offline
- P2: Compartilhar streak / dia salvo (imagem para social)
- P2: Notificações push / lembretes diários
- P2: Exportar diário em PDF
- P2: Metas semanais personalizadas (ex.: "meditar 5x na semana")
- P3: Refactor `server.py` (>640 linhas) em routers separados (auth/tasks/diary/news)
- P3: Aggregation Mongo pipeline para `/api/diary/stats` se escala aumentar

## Test Credentials
- Admin: `admin@rotina.app` / `admin12345`
- Test: `teste@rotina.app` / `teste12345` (criado durante o smoke test)

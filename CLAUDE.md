# Astra — Plataforma de Mapas Astrológicos com IA

Documentação completa do projeto em `docs/astra_projeto.md`.
Briefing de design em `docs/astra_design_briefing.md`.
Layouts de tela em `docs/design/`.

## Stack

- **Desktop:** Tauri v2 + React (TypeScript)
- **Web:** Next.js (mesmo frontend do desktop)
- **API:** Node.js + Fastify
- **Cálculos:** Rust + Swiss Ephemeris (via FFI)
- **Banco:** PostgreSQL
- **LLM:** OpenRouter (multi-modelo)
- **Auth:** Google OAuth + email/senha

## Estrutura do Monorepo

```
astra/
├── apps/
│   ├── desktop/      # Tauri v2 + React
│   ├── web/          # Next.js
│   └── api/          # Node.js + Fastify
├── packages/
│   ├── calculator/   # Rust — Swiss Ephemeris (motor de cálculo)
│   ├── ui/           # Componentes compartilhados
│   └── types/        # Tipos TypeScript compartilhados
└── docs/             # astra_projeto.md, briefing, layouts
```

## Comandos

```bash
pnpm dev              # Inicia tudo em paralelo (api + web)
pnpm tauri dev        # Inicia o app desktop
pnpm build            # Build de produção
pnpm test             # Testes (Node + React)
cargo test            # Testes do motor Rust (em packages/calculator)
```

## Convenções de Código

- TypeScript strict — sem `any`
- Componentes React: funcionais, sem default exports
- Commits semânticos: `feat:`, `fix:`, `chore:`, `docs:`
- Variáveis de ambiente: nunca hardcoded, sempre via `.env`
- Erros: padrão Result (não try/catch genérico)

## Regras Críticas

- **Nunca** commitar `.env` ou segredos
- **Nunca** editar arquivos em `packages/calculator/src/generated/`
- **Nunca** alterar Swiss Ephemeris FFI bindings sem rodar `cargo test`
- Prompts de IA ficam no servidor — fora do repositório público
- Cache de interpretações usa SHA-256 com `prompt_version` no hash

## Skills Disponíveis

- `.claude/skills/swiss-ephemeris/` — Como trabalhar com os bindings Rust
- `.claude/skills/cache-llm/` — Estratégia de cache granular de interpretações
- `.claude/skills/openrouter/` — Modelos por caso de uso e estrutura de prompts

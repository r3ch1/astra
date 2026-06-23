<div align="center">

# ✦ ☽ ASTRA ✦

**Plataforma de Mapas Astrológicos com IA**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blueviolet.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Swiss%20Ephemeris-orange.svg)](https://www.rust-lang.org/)
[![Status](https://img.shields.io/badge/Status-Em%20desenvolvimento-yellow.svg)]()

*Mapa natal preciso. Leitura por IA. Metas de autoconhecimento.*

</div>

---

## O que é o Astra

Astra é uma plataforma de mapas astrológicos que combina cálculos astronômicos de precisão profissional com interpretações geradas por inteligência artificial.

O diferencial filosófico: **o mapa não é destino — é um mapa de possibilidades.** A vida real é o terreno. Astra conecta os dois, permitindo que o usuário narre sua vida e receba insights cruzados com o próprio mapa, gerando metas concretas de desenvolvimento pessoal.

> *"O mapa é o território das possibilidades. A vida é o terreno real. Astra é a bússola entre os dois."*

---

## Funcionalidades

- 🗺️ **Mapa natal completo** — cálculo via Swiss Ephemeris, precisão de arco-segundo
- 🤖 **Leitura por IA** — interpretações contextualizadas por área de vida
- 🎯 **Sistema de metas** — metas geradas pela IA alinhadas ao potencial do mapa
- 💬 **Diário astrológico** — relato da vida real cruzado com o mapa
- 🔗 **Sinastria compartilhável** — comparação entre mapas com imagem viral
- 🌐 **Web + Desktop** — mesmo frontend, disponível no navegador e via Tauri

---

## Stack

| Camada | Tecnologia |
|---|---|
| Desktop | Tauri v2 + React (TypeScript) |
| Web | Next.js |
| API | Node.js + Fastify |
| Cálculos | Rust + Swiss Ephemeris (FFI) |
| Banco | PostgreSQL |
| IA | OpenRouter (multi-modelo) |
| Auth | Google OAuth + email/senha |

---

## Estrutura do Monorepo

```
astra/
├── apps/
│   ├── desktop/      # Tauri v2 + React
│   ├── web/          # Next.js
│   └── api/          # Node.js + Fastify
├── packages/
│   ├── calculator/   # Rust — Swiss Ephemeris
│   ├── ui/           # Componentes compartilhados
│   └── types/        # Tipos TypeScript compartilhados
└── docs/             # Documentação de produto e design
```

---

## Por que open source?

Os cálculos astrológicos do Astra são **auditáveis por qualquer pessoa**. Usamos a mesma Swiss Ephemeris do Astro.com — e todo o código que a integra está aqui, disponível para revisão.

A licença AGPL garante que qualquer derivação também seja pública. O valor real do produto está na experiência, nos dados dos usuários e na evolução contínua — não em código fechado.

---

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Iniciar em desenvolvimento (web + api)
pnpm dev

# Iniciar o desktop
pnpm tauri dev

# Testes
pnpm test          # Node + React
cargo test         # Motor de cálculo Rust
```

> **Pré-requisitos:** Node.js 20+, pnpm, Rust (via rustup), Tauri CLI

---

## Documentação

- [`docs/astra_projeto.md`](docs/astra_projeto.md) — Documento completo de produto e arquitetura
- [`docs/astra_design_briefing.md`](docs/astra_design_briefing.md) — Diretrizes de design
- [`docs/design/`](docs/design/) — Layouts de tela

---

## Licença

[AGPL v3](LICENSE) — Astrodienst Swiss Ephemeris também sob AGPL v3.

---

<div align="center">

*✦ ☽ ✦*

</div>

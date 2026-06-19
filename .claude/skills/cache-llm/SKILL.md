---
name: cache-llm
description: Estratégia de cache granular para interpretações geradas por IA. Use quando implementar ou modificar o sistema de cache de leituras astrológicas.
allowed-tools: Read, Write, Grep
---

# Cache de Interpretações LLM

## Princípio Central

Cache opera em **granularidade de posição**, não de mapa completo.
`"Sol em Escorpião, Casa 8"` é cacheável e compartilhado entre todos os usuários.
Síntese final e cruzamento relato × mapa são únicos por pessoa — não cachear.

## Chave de Cache

```typescript
import { createHash } from 'crypto'

function buildCacheKey(params: {
  position: string
  signo: string
  casa: number
  orbe_bucket: string   // "exato" | "forte" | "moderado" | "fraco"
  prompt_version: string
  model_id: string
}): string {
  return createHash('sha256').update(JSON.stringify(params)).digest('hex')
}

function orbeRange(orbe: number): string {
  if (orbe <= 1) return 'exato'
  if (orbe <= 3) return 'forte'
  if (orbe <= 6) return 'moderado'
  return 'fraco'
}
```

## O Que Cachear

| Tipo | Cachear? |
|------|----------|
| Interpretação de planeta isolado | ✅ Sim |
| Interpretação de aspecto | ✅ Sim |
| Síntese narrativa do mapa | ✅ Salvar no perfil |
| Cruzamento relato × mapa | ❌ Não |
| Geração de metas | ❌ Não |

## Schema PostgreSQL

```sql
CREATE TABLE interpretacoes_cache (
  hash          TEXT PRIMARY KEY,
  conteudo      TEXT NOT NULL,
  modelo        TEXT NOT NULL,
  prompt_v      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  hit_count     INTEGER DEFAULT 0,
  invalidado_em TIMESTAMPTZ
);
```

## Invalidação

Ao evoluir um prompt, incrementar `PROMPT_VERSION` — o hash muda naturalmente.

```sql
-- Limpar entradas de versões antigas
DELETE FROM interpretacoes_cache WHERE prompt_v != 'v1.3';
```

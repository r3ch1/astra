---
name: openrouter
description: Modelos disponíveis no OpenRouter, seleção por caso de uso e estrutura de prompts para leituras astrológicas. Use ao implementar ou modificar chamadas à IA.
allowed-tools: Read, Write, Grep
---

# OpenRouter — Integração LLM

## Modelo por Caso de Uso

| Caso de Uso | Modelo |
|-------------|--------|
| Interpretação individual (cache) | `deepseek/deepseek-chat` |
| Síntese narrativa do mapa | `anthropic/claude-sonnet-4-6` |
| Cruzamento relato × mapa | `anthropic/claude-sonnet-4-6` |
| Geração de metas | `anthropic/claude-sonnet-4-6` |
| Trânsitos e previsões | `google/gemini-2.5-pro` |
| Notificações / resumos | `google/gemini-flash-2.5` |

## Versioning de Prompts

```typescript
// packages/api/src/llm/versions.ts
export const PROMPT_VERSION = 'v1.0'
export const MODEL_CACHE = 'deepseek/deepseek-chat'
export const MODEL_SYNTHESIS = 'anthropic/claude-sonnet-4-6'
export const MODEL_CROSS = 'anthropic/claude-sonnet-4-6'
```

## Chamada Base

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://astra.app',
  },
  body: JSON.stringify({
    model: modelId,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  }),
})
```

## Prompt — Interpretação Individual

```typescript
function buildPromptPosicao(posicao: Posicao): string {
  return `Você é um astrólogo experiente. Interprete esta posição de forma direta e específica.

POSIÇÃO: ${posicao.planeta} em ${posicao.signo}, Casa ${posicao.casa}
${posicao.aspecto ? `ASPECTO: ${posicao.aspecto.tipo} com ${posicao.aspecto.planeta2} (orbe ${posicao.aspecto.orbe}°)` : ''}

Escreva 2-3 parágrafos. Seja específico — cite a posição exata. Não use linguagem genérica.`
}
```

## Prompt — Cruzamento Relato × Mapa

```typescript
function buildPromptCruzamento(area: AreaVida, relato: string, interpretacoes: string[]): string {
  return `Você é um astrólogo e coach de autoconhecimento.

O MAPA INDICA:
${interpretacoes.join('\n')}

O USUÁRIO RELATA SOBRE ${area.nome.toUpperCase()}:
"${relato}"

Analise a conexão entre relato e mapa. Gere 3 metas concretas (7-30 dias):
- Âncora astrológica: [aspecto do mapa]
- Ação: [o que fazer, específico]
- Indicador: [como saber que avançou]`
}
```

## Variável de Ambiente

```bash
OPENROUTER_API_KEY=sk-or-...   # nunca commitar
```

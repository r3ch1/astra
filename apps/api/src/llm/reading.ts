/**
 * Serviço de Leitura Completa: síntese narrativa do mapa inteiro.
 *
 * Irmão do `interpret.ts`, com duas diferenças deliberadas:
 *   - NÃO passa pelo cache — a síntese é única por pessoa (mapa inteiro), ao
 *     contrário da interpretação por posição, compartilhável (ver `cache.ts`).
 *   - Usa `modelReading` + `readingMaxTokens` (texto mais longo que a posição).
 *
 * As rotas só conhecem `synthesize()` e os erros tipados, sem saber de provider.
 */

import type { NatalChart } from "@astra/types";
import { type Result, ok } from "../result.js";
import { config } from "../config.js";
import type { LlmError } from "./provider.js";
import { getProvider } from "./index.js";
import { PROMPT_VERSION } from "./versions.js";
import { readingSystem, buildReadingPrompt } from "./prompts.js";

export interface ReadingResult {
  text: string;
  model: string;
  promptVersion: string;
}

export async function synthesize(
  chart: NatalChart,
): Promise<Result<ReadingResult, LlmError>> {
  const model = config.llm.modelReading;

  const provider = getProvider();
  if (!provider.ok) return provider;

  const completion = await provider.value.complete({
    model,
    system: readingSystem(),
    user: buildReadingPrompt(chart),
    maxTokens: config.llm.readingMaxTokens,
  });
  if (!completion.ok) return completion;

  return ok({ text: completion.value, model, promptVersion: PROMPT_VERSION });
}

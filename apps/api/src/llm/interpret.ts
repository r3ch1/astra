/**
 * Serviço de interpretação por IA. Orquestra: chave de cache → consulta →
 * (miss) chama o provider → grava no cache. Padrão Result em toda a borda.
 *
 * É o análogo do `calculator.ts` para a camada de IA: as rotas só conhecem
 * `interpret()` e os erros tipados, sem saber de provider nem de cache.
 */

import type { InterpretationRequest } from "@astra/types";
import { type Result, ok } from "../result.js";
import { config } from "../config.js";
import type { LlmError } from "./provider.js";
import { getProvider } from "./index.js";
import { PROMPT_VERSION } from "./versions.js";
import { interpretationSystem, buildInterpretationPrompt } from "./prompts.js";
import { buildCacheKey, getCache } from "./cache.js";

export interface InterpretationResult {
  text: string;
  cached: boolean;
  model: string;
  promptVersion: string;
}

function cacheKeyFor(req: InterpretationRequest, model: string): string {
  return buildCacheKey({
    position: req.body,
    signo: req.sign,
    casa: req.house,
    orbe_bucket: req.aspect?.orb_bucket ?? "na",
    aspect: req.aspect ? `${req.aspect.type}:${req.aspect.with}` : "",
    prompt_version: PROMPT_VERSION,
    model_id: model,
  });
}

export async function interpret(
  req: InterpretationRequest,
): Promise<Result<InterpretationResult, LlmError>> {
  const model = config.llm.modelInterpretation;
  const key = cacheKeyFor(req, model);
  const cache = getCache();

  const hit = await cache.get(key);
  if (hit !== undefined) {
    return ok({ text: hit, cached: true, model, promptVersion: PROMPT_VERSION });
  }

  const provider = getProvider();
  if (!provider.ok) return provider;

  const completion = await provider.value.complete({
    model,
    system: interpretationSystem(),
    user: buildInterpretationPrompt(req),
    maxTokens: config.llm.maxTokens,
  });
  if (!completion.ok) return completion;

  await cache.set(key, completion.value, { model, promptVersion: PROMPT_VERSION });
  return ok({
    text: completion.value,
    cached: false,
    model,
    promptVersion: PROMPT_VERSION,
  });
}

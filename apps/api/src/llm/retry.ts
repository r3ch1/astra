/**
 * Retry com backoff para erros transitórios do provider LLM (429/503, quedas
 * de rede — frequentes no free tier do Gemini). É um decorador cross-provider:
 * a fábrica `getProvider()` embrulha o provider concreto uma única vez, então
 * Gemini, Anthropic e futuros providers herdam a mesma política sem duplicar
 * lógica. Cada provider só precisa marcar `LlmError.retryable`; quem não é
 * transitório (config, refusal, 400) não é repetido.
 */

import type { Result } from "../result.js";
import type { CompletionRequest, LlmError, LlmProvider } from "./provider.js";

export interface RetryOptions {
  /** Número máximo de tentativas, incluindo a primeira (1 = sem retry). */
  maxAttempts: number;
  /** Atraso base do backoff exponencial, em ms. */
  baseDelayMs: number;
  /** Teto do atraso entre tentativas, em ms. */
  maxDelayMs: number;
}

/** Pausa injetável: o default usa timers reais; testes passam um no-op. */
export type Sleep = (ms: number) => Promise<void>;

const realSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Atraso da tentativa `attempt` (1-based): backoff exponencial limitado a
 * maxDelayMs, com "full jitter" para não sincronizar várias chamadas que
 * falharam juntas (todas voltariam ao mesmo tempo e bateriam de novo).
 */
function backoffDelay(attempt: number, opts: RetryOptions): number {
  const exponential = opts.baseDelayMs * 2 ** (attempt - 1);
  return Math.random() * Math.min(opts.maxDelayMs, exponential);
}

export function withRetry(
  provider: LlmProvider,
  opts: RetryOptions,
  sleep: Sleep = realSleep,
): LlmProvider {
  return {
    name: provider.name,
    async complete(req: CompletionRequest): Promise<Result<string, LlmError>> {
      let res = await provider.complete(req);
      for (
        let attempt = 1;
        attempt < opts.maxAttempts && !res.ok && res.error.retryable === true;
        attempt++
      ) {
        await sleep(backoffDelay(attempt, opts));
        res = await provider.complete(req);
      }
      return res;
    },
  };
}

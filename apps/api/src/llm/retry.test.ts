/**
 * Testes do decorador de retry. Usam um provider falso e um `sleep` no-op,
 * então rodam instantâneos (sem timers reais).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { type Result, ok, err } from "../result.js";
import type { LlmError, LlmProvider } from "./provider.js";
import { withRetry, type RetryOptions } from "./retry.js";

const req = { model: "m", system: "s", user: "u", maxTokens: 10 };
const opts: RetryOptions = { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 2 };
const noSleep = async (): Promise<void> => {};

/**
 * Provider que devolve `results` em sequência; depois de esgotada, repete o
 * último. Conta as chamadas para verificar quantas tentativas houve.
 */
function fakeProvider(results: Array<Result<string, LlmError>>): {
  provider: LlmProvider;
  calls: () => number;
} {
  let calls = 0;
  return {
    calls: () => calls,
    provider: {
      name: "fake",
      async complete() {
        const r = results[Math.min(calls, results.length - 1)];
        calls++;
        if (r === undefined) throw new Error("fakeProvider sem resultados");
        return r;
      },
    },
  };
}

test("repete erro transitório e devolve o sucesso seguinte", async () => {
  const { provider, calls } = fakeProvider([
    err<LlmError>({ kind: "request", message: "503", retryable: true }),
    ok("pronto"),
  ]);
  const res = await withRetry(provider, opts, noSleep).complete(req);
  if (!res.ok) return assert.fail("esperava sucesso");
  assert.equal(res.value, "pronto");
  assert.equal(calls(), 2);
});

test("não repete erro não-transitório", async () => {
  const { provider, calls } = fakeProvider([
    err<LlmError>({ kind: "refusal", message: "bloqueado" }),
  ]);
  const res = await withRetry(provider, opts, noSleep).complete(req);
  if (res.ok) return assert.fail("esperava erro");
  assert.equal(res.error.message, "bloqueado");
  assert.equal(calls(), 1);
});

test("desiste após maxAttempts e devolve o último erro", async () => {
  const { provider, calls } = fakeProvider([
    err<LlmError>({ kind: "request", message: "503", retryable: true }),
  ]);
  const res = await withRetry(provider, opts, noSleep).complete(req);
  if (res.ok) return assert.fail("esperava erro");
  assert.equal(res.error.message, "503");
  assert.equal(calls(), 3);
});

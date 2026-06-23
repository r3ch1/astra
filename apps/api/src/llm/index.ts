/**
 * Fábrica de provider LLM. Escolhe a implementação pelo `config.llm.provider`
 * e memoiza a instância (o cliente do SDK é reaproveitável). Adicionar um novo
 * provedor = mais um `case` aqui + o arquivo que implementa `LlmProvider`.
 */

import { type Result, ok, err } from "../result.js";
import { config } from "../config.js";
import type { LlmError, LlmProvider } from "./provider.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createGeminiProvider } from "./gemini.js";
import { createMockProvider } from "./mock.js";

let cached: LlmProvider | undefined;

export function getProvider(): Result<LlmProvider, LlmError> {
  if (cached) return ok(cached);

  switch (config.llm.provider) {
    case "mock":
      cached = createMockProvider();
      return ok(cached);
    case "anthropic": {
      const key = config.llm.anthropicApiKey;
      if (!key) {
        return err({
          kind: "config",
          message: "ANTHROPIC_API_KEY ausente — configure a key do Claude no .env",
        });
      }
      cached = createAnthropicProvider(key);
      return ok(cached);
    }
    case "gemini": {
      const key = config.llm.geminiApiKey;
      if (!key) {
        return err({
          kind: "config",
          message: "GEMINI_API_KEY ausente — configure a key do Google AI no .env",
        });
      }
      cached = createGeminiProvider(key);
      return ok(cached);
    }
    default:
      return err({
        kind: "config",
        message: `provider LLM desconhecido: "${config.llm.provider}"`,
      });
  }
}

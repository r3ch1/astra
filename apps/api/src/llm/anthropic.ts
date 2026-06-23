/**
 * Provider Anthropic — fala direto com a API do Claude via SDK oficial,
 * usando a key do usuário (ANTHROPIC_API_KEY). É a implementação ativa
 * enquanto não há créditos no OpenRouter; quando houver, basta plugar um
 * `openrouter.ts` que implemente a mesma `LlmProvider`.
 */

import Anthropic from "@anthropic-ai/sdk";
import { type Result, ok, err } from "../result.js";
import type { CompletionRequest, LlmError, LlmProvider } from "./provider.js";

export function createAnthropicProvider(apiKey: string): LlmProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",
    async complete(req: CompletionRequest): Promise<Result<string, LlmError>> {
      try {
        const res = await client.messages.create({
          model: req.model,
          max_tokens: req.maxTokens,
          system: req.system,
          messages: [{ role: "user", content: req.user }],
        });

        // Classificadores de segurança podem recusar (HTTP 200 + stop_reason).
        if (res.stop_reason === "refusal") {
          return err({
            kind: "refusal",
            message: "o modelo recusou a requisição por política de segurança",
          });
        }

        const text = res.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("")
          .trim();

        if (!text) {
          return err({ kind: "request", message: "resposta vazia do modelo" });
        }
        return ok(text);
      } catch (e) {
        return err({
          kind: "request",
          message: `falha ao chamar o Claude: ${(e as Error).message}`,
        });
      }
    },
  };
}

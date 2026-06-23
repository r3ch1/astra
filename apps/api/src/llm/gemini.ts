/**
 * Provider Gemini — fala com a Google AI (Generative Language API) via REST.
 * Tem free tier, então serve para desenvolver sem custo enquanto não há
 * créditos na Anthropic. Sem SDK: usa `fetch` nativo (Node 22+).
 *
 * Ative com `LLM_PROVIDER=gemini` + `GEMINI_API_KEY` no .env.
 */

import { type Result, ok, err } from "../result.js";
import type { CompletionRequest, LlmError, LlmProvider } from "./provider.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Forma mínima da resposta do generateContent (só o que consumimos).
interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

export function createGeminiProvider(apiKey: string): LlmProvider {
  return {
    name: "gemini",
    async complete(req: CompletionRequest): Promise<Result<string, LlmError>> {
      // A key vai na query (?key=), não no header x-goog-api-key: com o header,
      // o Google atribui a chamada a um projeto default (sem a API habilitada)
      // e retorna 403; com a query, usa o projeto da própria key do AI Studio.
      const url = `${BASE}/${req.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: req.system }] },
            contents: [{ role: "user", parts: [{ text: req.user }] }],
            generationConfig: {
              maxOutputTokens: req.maxTokens,
              // Gemini 2.5 Flash tem "thinking" ligado por default e ele CONSOME
              // o maxOutputTokens — sem desligar, o budget vai p/ o raciocínio e
              // o texto visível sai cortado no meio. Interpretações são curtas e
              // não precisam de thinking. (Modelos Pro exigem budget > 0.)
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });
      } catch (e) {
        return err({
          kind: "request",
          message: `falha de rede ao chamar o Gemini: ${(e as Error).message}`,
        });
      }

      const data = (await res.json().catch(() => null)) as GeminiResponse | null;

      if (!res.ok) {
        return err({
          kind: "request",
          message: `Gemini ${res.status}: ${data?.error?.message ?? "erro desconhecido"}`,
        });
      }

      // Bloqueio por política → recusa.
      if (data?.promptFeedback?.blockReason) {
        return err({
          kind: "refusal",
          message: `requisição bloqueada pelo Gemini (${data.promptFeedback.blockReason})`,
        });
      }
      const candidate = data?.candidates?.[0];
      if (candidate?.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
        return err({
          kind: "refusal",
          message: `Gemini encerrou sem texto útil (${candidate.finishReason})`,
        });
      }

      const text = (candidate?.content?.parts ?? [])
        .map((p) => p.text ?? "")
        .join("")
        .trim();

      if (!text) {
        return err({ kind: "request", message: "resposta vazia do Gemini" });
      }
      return ok(text);
    },
  };
}

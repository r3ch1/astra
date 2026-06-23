/**
 * Provider mock — não chama IA nenhuma. Devolve um texto de exemplo, para
 * desenvolver/testar a UI, o cache e o fluxo ponta a ponta sem gastar créditos.
 *
 * Ative com `LLM_PROVIDER=mock` no .env. A resposta é determinística (e passa
 * pelo cache normalmente), então reabrir a mesma posição vem do cache.
 */

import { type Result, ok } from "../result.js";
import type { CompletionRequest, LlmError, LlmProvider } from "./provider.js";

/** Extrai a linha "POSIÇÃO: ..." do prompt, para o texto refletir o planeta. */
function posicaoDoPrompt(user: string): string {
  const match = user.match(/POSIÇÃO:\s*(.+)/);
  return match?.[1]?.trim() ?? "esta posição";
}

export function createMockProvider(): LlmProvider {
  return {
    name: "mock",
    async complete(req: CompletionRequest): Promise<Result<string, LlmError>> {
      const pos = posicaoDoPrompt(req.user);
      return ok(
        `⟨leitura de exemplo — modo mock, sem IA real⟩\n\n` +
          `Esta é uma interpretação simulada de ${pos}. Serve para validar a ` +
          `interface, o cache e o fluxo da leitura enquanto não há créditos na ` +
          `API. Os parágrafos abaixo são placeholder.\n\n` +
          `O potencial desta configuração tende a favorecer certos temas e a ` +
          `desafiar outros — o texto real, gerado pelo modelo, traria a leitura ` +
          `específica aqui. Caminho de desenvolvimento sugerido: trocar ` +
          `LLM_PROVIDER para "anthropic" (com créditos) para ver a leitura real.`,
      );
    },
  };
}

/**
 * Contrato neutro de provider LLM.
 *
 * Toda a integração com um provedor concreto (Anthropic, e no futuro
 * OpenRouter) mora atrás desta interface — mesma estratégia do
 * `calculator.ts`, que isola o motor Rust. Quem consome (`interpret.ts`,
 * rotas) só conhece `LlmProvider`; trocar de provedor = adicionar um arquivo
 * que implementa esta interface, sem tocar no resto.
 */

import type { Result } from "../result.js";

export type LlmErrorKind = "config" | "request" | "refusal";

export interface LlmError {
  kind: LlmErrorKind;
  message: string;
}

/** Requisição de completude — neutra entre provedores. */
export interface CompletionRequest {
  /** ID do modelo no provedor (ex: "claude-haiku-4-5"). */
  model: string;
  /** Instrução de sistema (papel/estilo). */
  system: string;
  /** Conteúdo do usuário (o prompt em si). */
  user: string;
  /** Teto de tokens da resposta. */
  maxTokens: number;
}

export interface LlmProvider {
  /** Nome do provedor, para logs/diagnóstico. */
  readonly name: string;
  /** Executa uma completude e devolve o texto, no padrão Result. */
  complete(req: CompletionRequest): Promise<Result<string, LlmError>>;
}

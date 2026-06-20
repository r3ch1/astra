/**
 * Padrão Result — erros explícitos no tipo de retorno, sem try/catch genérico
 * espalhado (ver "Erros: padrão Result" no CLAUDE.md).
 */

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

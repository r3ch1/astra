/** Cliente do frontend: fala com os route handlers same-origin /api/*. */

import type {
  BirthInput,
  InterpretationRequest,
  InterpretationResponse,
  NatalChart,
  ReadingResponse,
} from "@astra/types";
import { type Result, ok, err } from "./result";

/** POST genérico para um route handler same-origin, no padrão Result. */
async function postJson<T>(
  path: string,
  body: unknown,
  fallbackMsg: string,
): Promise<Result<T, string>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return err(`Falha de rede: ${(e as Error).message}`);
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    return err(detail?.message ?? `Erro ${res.status} — ${fallbackMsg}`);
  }

  return ok((await res.json()) as T);
}

export function fetchChart(
  input: BirthInput,
): Promise<Result<NatalChart, string>> {
  return postJson<NatalChart>("/api/chart", input, "ao calcular o mapa.");
}

export function fetchInterpretation(
  req: InterpretationRequest,
): Promise<Result<InterpretationResponse, string>> {
  return postJson<InterpretationResponse>(
    "/api/interpretation",
    req,
    "ao gerar a leitura.",
  );
}

/** Leitura Completa: envia o BirthInput; a API recalcula o mapa e sintetiza. */
export function fetchReading(
  input: BirthInput,
): Promise<Result<ReadingResponse, string>> {
  return postJson<ReadingResponse>(
    "/api/reading",
    input,
    "ao gerar a leitura completa.",
  );
}

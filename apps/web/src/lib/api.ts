/** Cliente do frontend: fala com o route handler same-origin /api/chart. */

import type { BirthInput, NatalChart } from "@astra/types";
import { type Result, ok, err } from "./result";

export async function fetchChart(
  input: BirthInput,
): Promise<Result<NatalChart, string>> {
  let res: Response;
  try {
    res = await fetch("/api/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (e) {
    return err(`Falha de rede: ${(e as Error).message}`);
  }

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    return err(detail?.message ?? `Erro ${res.status} ao calcular o mapa.`);
  }

  return ok((await res.json()) as NatalChart);
}

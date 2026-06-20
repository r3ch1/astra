/**
 * Configuração da API, sempre via ambiente (CLAUDE.md: nunca hardcoded).
 * Os defaults cobrem o cenário de desenvolvimento local.
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import "dotenv/config";

// Tanto em `src/` (tsx) quanto em `dist/` o arquivo fica um nível abaixo de
// apps/api, então a raiz do monorepo está três níveis acima.
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

const defaultCalcBin = resolve(
  repoRoot,
  "packages/calculator/target/release/astra-calc",
);

export interface Config {
  host: string;
  port: number;
  /** Caminho do binário do motor de cálculo (`astra-calc`). */
  calcBin: string;
  /** Diretório dos arquivos .se1 do Swiss Ephemeris (opcional). */
  ephePath: string | undefined;
  /** Timeout do subprocesso de cálculo, em ms. */
  calcTimeoutMs: number;
}

export const config: Config = {
  host: process.env.API_HOST ?? "0.0.0.0",
  port: Number(process.env.API_PORT ?? 3333),
  calcBin: process.env.ASTRA_CALC_BIN ?? defaultCalcBin,
  ephePath: process.env.ASTRA_EPHE_PATH,
  calcTimeoutMs: Number(process.env.ASTRA_CALC_TIMEOUT_MS ?? 10_000),
};

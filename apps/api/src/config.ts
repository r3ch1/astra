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

/** Configuração da camada de IA (LLM). */
export interface LlmConfig {
  /** Provider ativo: "anthropic" | "gemini" | "mock" (futuro: "openrouter"). */
  provider: string;
  /** Key do Claude (provider anthropic). */
  anthropicApiKey: string | undefined;
  /** Key do Google AI (provider gemini). */
  geminiApiKey: string | undefined;
  /** Modelo para interpretação individual de posição (cacheável). */
  modelInterpretation: string;
  /** Teto de tokens por interpretação. */
  maxTokens: number;
  /** Modelo para a leitura completa (síntese do mapa). Pode ser mais forte. */
  modelReading: string;
  /** Teto de tokens da síntese — maior que o da posição (texto mais longo). */
  readingMaxTokens: number;
  /** Política de retry para erros transitórios do provider (429/503/rede). */
  retry: {
    /** Tentativas totais, incluindo a primeira (1 = sem retry). */
    maxAttempts: number;
    /** Atraso base do backoff exponencial, em ms. */
    baseDelayMs: number;
    /** Teto do atraso entre tentativas, em ms. */
    maxDelayMs: number;
  };
}

const llmProvider = process.env.LLM_PROVIDER ?? "anthropic";

// Default de modelo por provider — evita mandar um ID de Claude para o Gemini
// (e vice-versa). Sobrescrevível por ASTRA_LLM_MODEL_INTERPRETATION.
const defaultInterpretationModel: Record<string, string> = {
  anthropic: "claude-haiku-4-5",
  gemini: "gemini-2.5-flash",
  mock: "mock",
};

export interface Config {
  host: string;
  port: number;
  /** Caminho do binário do motor de cálculo (`astra-calc`). */
  calcBin: string;
  /** Diretório dos arquivos .se1 do Swiss Ephemeris (opcional). */
  ephePath: string | undefined;
  /** Timeout do subprocesso de cálculo, em ms. */
  calcTimeoutMs: number;
  /** Diretório onde o cache de interpretações é persistido (arquivos JSON). */
  cacheDir: string;
  /** Diretório dos arquivos de prompts (fora do repo público — ver CLAUDE.md). */
  promptsDir: string;
  llm: LlmConfig;
}

export const config: Config = {
  host: process.env.API_HOST ?? "0.0.0.0",
  port: Number(process.env.API_PORT ?? 3333),
  calcBin: process.env.ASTRA_CALC_BIN ?? defaultCalcBin,
  ephePath: process.env.ASTRA_EPHE_PATH,
  calcTimeoutMs: Number(process.env.ASTRA_CALC_TIMEOUT_MS ?? 10_000),
  cacheDir:
    process.env.ASTRA_CACHE_DIR ?? resolve(repoRoot, ".cache/interpretations"),
  promptsDir:
    process.env.ASTRA_PROMPTS_DIR ?? resolve(repoRoot, "apps/api/prompts"),
  llm: {
    provider: llmProvider,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    modelInterpretation:
      process.env.ASTRA_LLM_MODEL_INTERPRETATION ??
      defaultInterpretationModel[llmProvider] ??
      "claude-haiku-4-5",
    maxTokens: Number(process.env.ASTRA_LLM_MAX_TOKENS ?? 1000),
    // Síntese reaproveita o default do provider; sobrescreva p/ um modelo mais
    // forte (ex.: gemini-2.5-pro / claude-sonnet) sem afetar o cache de posição.
    modelReading:
      process.env.ASTRA_LLM_MODEL_READING ??
      defaultInterpretationModel[llmProvider] ??
      "claude-haiku-4-5",
    readingMaxTokens: Number(process.env.ASTRA_LLM_READING_MAX_TOKENS ?? 2000),
    retry: {
      maxAttempts: Number(process.env.ASTRA_LLM_RETRY_ATTEMPTS ?? 3),
      baseDelayMs: Number(process.env.ASTRA_LLM_RETRY_BASE_MS ?? 500),
      maxDelayMs: Number(process.env.ASTRA_LLM_RETRY_MAX_MS ?? 8_000),
    },
  },
};

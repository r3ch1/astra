/**
 * Cache de interpretações.
 *
 * A interface `InterpretationCache` é o ponto de troca: hoje uma implementação
 * em arquivo (um JSON por hash em `config.cacheDir`), que persiste entre
 * reinícios e evita re-cobrar a API durante o desenvolvimento. Na Fase 2,
 * trocar por PostgreSQL = implementar a mesma interface (ver skill `cache-llm`,
 * tabela `interpretacoes_cache`), sem tocar em quem consome.
 *
 * Granularidade de posição, não de mapa: "Sol em Escorpião, Casa 8" é
 * compartilhado entre todos os usuários. Síntese e cruzamento relato × mapa
 * NÃO são cacheados (são únicos por pessoa) e não passam por aqui.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../config.js";
import { PROMPT_VERSION } from "./versions.js";

export interface InterpretationCache {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, meta: CacheMeta): Promise<void>;
}

export interface CacheMeta {
  model: string;
  promptVersion: string;
}

/** Parâmetros que compõem a chave de cache (ver skill `cache-llm`). */
export interface CacheKeyParams {
  position: string;
  signo: string;
  casa: number;
  /** "exato" | "forte" | "moderado" | "fraco" | "na" (sem aspecto). */
  orbe_bucket: string;
  /** Aspecto + outro corpo, ou "" quando não há aspecto. */
  aspect: string;
  prompt_version: string;
  model_id: string;
}

export function buildCacheKey(params: CacheKeyParams): string {
  return createHash("sha256").update(JSON.stringify(params)).digest("hex");
}

interface CacheEntry {
  conteudo: string;
  modelo: string;
  prompt_v: string;
  created_at: string;
}

/** Implementação em arquivo. Um `<hash>.json` por entrada. */
function createFileCache(dir: string): InterpretationCache {
  return {
    async get(key) {
      try {
        const raw = await readFile(join(dir, `${key}.json`), "utf8");
        return (JSON.parse(raw) as CacheEntry).conteudo;
      } catch {
        // Ausente ou ilegível → miss.
        return undefined;
      }
    },
    async set(key, value, meta) {
      await mkdir(dir, { recursive: true });
      const entry: CacheEntry = {
        conteudo: value,
        modelo: meta.model,
        prompt_v: meta.promptVersion,
        created_at: new Date().toISOString(),
      };
      await writeFile(join(dir, `${key}.json`), JSON.stringify(entry), "utf8");
    },
  };
}

let cached: InterpretationCache | undefined;

export function getCache(): InterpretationCache {
  if (!cached) cached = createFileCache(config.cacheDir);
  return cached;
}

// Reexporta para quem monta a chave (mantém PROMPT_VERSION num lugar só).
export { PROMPT_VERSION };

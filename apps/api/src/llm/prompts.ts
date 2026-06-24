/**
 * Carregamento dos prompts de interpretação.
 *
 * Os prompts NÃO ficam no código (CLAUDE.md: "prompts ficam no servidor, fora
 * do repositório público"). Eles vivem em `config.promptsDir`:
 *   - `interpretation.json`         → os prompts reais (gitignored)
 *   - `interpretation.example.json` → template público (versionado, genérico)
 * O loader usa o real se existir; senão cai no `.example` — então um clone novo
 * sempre funciona, e o "tempero" real fica fora do repo.
 *
 * A tradução PT (Sun→Sol etc.) fica aqui porque são apenas rótulos do domínio,
 * não conteúdo sensível.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { InterpretationRequest, NatalChart } from "@astra/types";
import { config } from "../config.js";

const SIGN_PT: Record<string, string> = {
  Aries: "Áries",
  Taurus: "Touro",
  Gemini: "Gêmeos",
  Cancer: "Câncer",
  Leo: "Leão",
  Virgo: "Virgem",
  Libra: "Libra",
  Scorpio: "Escorpião",
  Sagittarius: "Sagitário",
  Capricorn: "Capricórnio",
  Aquarius: "Aquário",
  Pisces: "Peixes",
};

const BODY_PT: Record<string, string> = {
  Sun: "Sol",
  Moon: "Lua",
  Mercury: "Mercúrio",
  Venus: "Vênus",
  Mars: "Marte",
  Jupiter: "Júpiter",
  Saturn: "Saturno",
  Uranus: "Urano",
  Neptune: "Netuno",
  Pluto: "Plutão",
  NorthNode: "Nodo Norte",
  Chiron: "Quíron",
  Lilith: "Lilith",
};

const ASPECT_PT: Record<string, string> = {
  Conjunction: "conjunção",
  Sextile: "sextil",
  Square: "quadratura",
  Trine: "trígono",
  Opposition: "oposição",
};

const signPt = (s: string): string => SIGN_PT[s] ?? s;
const bodyPt = (b: string): string => BODY_PT[b] ?? b;
const aspectPt = (a: string): string => ASPECT_PT[a] ?? a.toLowerCase();

interface PromptPack {
  system: string;
  interpretation_user: string;
  interpretation_aspect_line: string;
  reading_system: string;
  reading_user: string;
}

let pack: PromptPack | undefined;

function load(): PromptPack {
  if (pack) return pack;
  for (const name of ["interpretation.json", "interpretation.example.json"]) {
    try {
      const raw = readFileSync(join(config.promptsDir, name), "utf8");
      pack = JSON.parse(raw) as PromptPack;
      return pack;
    } catch {
      // tenta o próximo candidato
    }
  }
  throw new Error(
    `nenhum arquivo de prompts em ${config.promptsDir} (esperado interpretation.json ou .example.json)`,
  );
}

/** Instrução de sistema para interpretações individuais. */
export function interpretationSystem(): string {
  return load().system;
}

/** Monta o prompt de interpretação de uma posição (com aspecto opcional). */
export function buildInterpretationPrompt(req: InterpretationRequest): string {
  const p = load();

  const aspectLine = req.aspect
    ? p.interpretation_aspect_line
        .replace("{aspectType}", aspectPt(req.aspect.type))
        .replace("{aspectWith}", bodyPt(req.aspect.with))
        .replace("{orbBucket}", req.aspect.orb_bucket)
    : "";

  return p.interpretation_user
    .replace("{body}", bodyPt(req.body))
    .replace("{sign}", signPt(req.sign))
    .replace("{house}", String(req.house))
    .replace("{aspectLine}", aspectLine);
}

/** Instrução de sistema para a leitura completa (síntese do mapa). */
export function readingSystem(): string {
  return load().reading_system;
}

/**
 * Distila o mapa num resumo textual em PT (planetas, ângulos, aspectos) e o
 * injeta no template de síntese. Mandar o resumo — e não o JSON cru — mantém o
 * prompt focado e legível para o modelo.
 */
export function buildReadingPrompt(chart: NatalChart): string {
  const p = load();

  const planets = chart.planets
    .map(
      (pl) =>
        `- ${bodyPt(pl.body)} em ${signPt(pl.sign)}, Casa ${pl.house}${pl.retrograde ? " (retrógrado)" : ""}`,
    )
    .join("\n");

  const angles = [
    `- Ascendente em ${signPt(chart.angles.ascendant.sign)}`,
    `- Meio do Céu em ${signPt(chart.angles.midheaven.sign)}`,
  ].join("\n");

  const aspects = chart.aspects.length
    ? chart.aspects
        .map((a) => `- ${bodyPt(a.from)} ${aspectPt(a.aspect)} ${bodyPt(a.to)} (orbe ${a.orb_bucket})`)
        .join("\n")
    : "- (nenhum aspecto maior)";

  const summary = `PLANETAS:\n${planets}\n\nÂNGULOS:\n${angles}\n\nASPECTOS:\n${aspects}`;
  const name = chart.input.name?.trim();

  return p.reading_user.replace("{name}", name || "esta pessoa").replace("{chart}", summary);
}

/**
 * Glyphs e rótulos em português para signos, corpos e aspectos.
 * As chaves usam os nomes em inglês emitidos pelo motor de cálculo.
 */

import type { Sign } from "@astra/types";

export const SIGN_GLYPH: Record<Sign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export const SIGN_PT: Record<Sign, string> = {
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

export const BODY_GLYPH: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  NorthNode: "☊",
  Chiron: "⚷",
  Lilith: "⚸",
};

export const BODY_PT: Record<string, string> = {
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

export const ASPECT_PT: Record<string, string> = {
  Conjunction: "Conjunção",
  Sextile: "Sextil",
  Square: "Quadratura",
  Trine: "Trígono",
  Opposition: "Oposição",
};

export const ASPECT_GLYPH: Record<string, string> = {
  Conjunction: "☌",
  Sextile: "⚹",
  Square: "□",
  Trine: "△",
  Opposition: "☍",
};

/** Natureza do aspecto, para colorir as linhas no mapa. */
export type AspectNature = "neutral" | "harmonic" | "tense";

const ASPECT_NATURE: Record<string, AspectNature> = {
  Conjunction: "neutral",
  Sextile: "harmonic",
  Trine: "harmonic",
  Square: "tense",
  Opposition: "tense",
};

export const aspectNature = (aspect: string): AspectNature =>
  ASPECT_NATURE[aspect] ?? "neutral";

export const glyphFor = (body: string): string => BODY_GLYPH[body] ?? "•";
export const bodyLabel = (body: string): string => BODY_PT[body] ?? body;
export const aspectLabel = (aspect: string): string => ASPECT_PT[aspect] ?? aspect;

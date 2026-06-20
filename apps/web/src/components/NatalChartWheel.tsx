/**
 * Renderização SVG do mapa natal.
 *
 * Geometria herdada do layout de referência (docs/design): viewBox 600×600,
 * centro (300,300), Ascendente fixado à esquerda (9h). A longitude cresce no
 * sentido anti-horário a partir do Ascendente.
 */

import type { NatalChart, PlanetPosition } from "@astra/types";
import {
  SIGN_GLYPH,
  glyphFor,
  aspectNature,
  type AspectNature,
} from "../lib/astro";

const SIZE = 600;
const C = SIZE / 2;

const R = {
  outer: 288,
  zodiac: 250,
  planet: 210,
  ring: 120,
  hub: 30,
} as const;

const SIGN_ORDER = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const ASPECT_COLOR: Record<AspectNature, string> = {
  neutral: "#c9a84c",
  harmonic: "#8ba0c9",
  tense: "#b5476b",
};

const ORB_OPACITY: Record<string, number> = {
  exato: 0.85,
  forte: 0.55,
  moderado: 0.32,
  fraco: 0.16,
};

interface PlacedPlanet extends PlanetPosition {
  /** Longitude de exibição após o "declump" (evita sobreposição de glyphs). */
  disp: number;
}

/** Converte (longitude, raio) em coordenadas SVG, com o Ascendente à esquerda. */
function polar(lon: number, ascLon: number, r: number): [number, number] {
  const a = ((180 + (lon - ascLon)) * Math.PI) / 180;
  return [C + r * Math.cos(a), C - r * Math.sin(a)];
}

/** Afasta planetas muito próximos em longitude para os glyphs não colidirem. */
function declump(planets: PlanetPosition[], minSep = 8): PlacedPlanet[] {
  const arr: PlacedPlanet[] = planets
    .map((p) => ({ ...p, disp: p.longitude }))
    .sort((a, b) => a.disp - b.disp);

  for (let iter = 0; iter < 200 && arr.length > 1; iter++) {
    let moved = false;
    for (let i = 0; i < arr.length; i++) {
      const j = (i + 1) % arr.length;
      const a = arr[i]!;
      const b = arr[j]!;
      let gap = b.disp - a.disp;
      if (j === 0) gap += 360;
      if (gap < minSep) {
        const push = (minSep - gap) / 2;
        a.disp -= push;
        b.disp += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return arr;
}

export function NatalChartWheel({ chart }: { chart: NatalChart }) {
  const ascLon = chart.angles.ascendant.longitude;
  const placed = declump(chart.planets);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Mapa natal"
      style={{ width: "100%", height: "auto", maxWidth: 600 }}
    >
      {/* Anéis de base */}
      <circle cx={C} cy={C} r={R.outer} fill="none" stroke="#4b2d8a" strokeWidth={1} />
      <circle cx={C} cy={C} r={R.zodiac} fill="none" stroke="#4b2d8a" strokeWidth={1} />
      <circle cx={C} cy={C} r={R.ring} fill="none" stroke="rgba(184,192,212,0.25)" strokeWidth={1} />

      {/* Faixa do zodíaco: 12 setores de 30° + glyph */}
      {SIGN_ORDER.map((sign, i) => {
        const boundary = i * 30;
        const [bx, by] = polar(boundary, ascLon, R.zodiac);
        const [ox, oy] = polar(boundary, ascLon, R.outer);
        const [gx, gy] = polar(boundary + 15, ascLon, (R.outer + R.zodiac) / 2);
        return (
          <g key={sign}>
            <line x1={bx} y1={by} x2={ox} y2={oy} stroke="#4b2d8a" strokeWidth={1} />
            <text
              x={gx}
              y={gy}
              fontSize={20}
              fill="#c9a84c"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {SIGN_GLYPH[sign]}
            </text>
          </g>
        );
      })}

      {/* Cúspides de casa + número */}
      {chart.houses.map((cusp, i) => {
        const [x1, y1] = polar(cusp.longitude, ascLon, R.zodiac);
        const [x2, y2] = polar(cusp.longitude, ascLon, R.ring);
        const next = chart.houses[(i + 1) % chart.houses.length]!;
        let mid = (cusp.longitude + next.longitude) / 2;
        if (next.longitude < cusp.longitude) mid = (cusp.longitude + next.longitude + 360) / 2;
        const [nx, ny] = polar(mid, ascLon, R.ring + 16);
        // Ângulos (1,4,7,10) com traço mais forte.
        const isAngle = cusp.number === 1 || cusp.number === 4 || cusp.number === 7 || cusp.number === 10;
        return (
          <g key={cusp.number}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isAngle ? "#c9a84c" : "rgba(184,192,212,0.35)"}
              strokeWidth={isAngle ? 1.5 : 0.75}
            />
            <text
              x={nx}
              y={ny}
              fontSize={11}
              fill="rgba(184,192,212,0.6)"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {cusp.number}
            </text>
          </g>
        );
      })}

      {/* Aspectos (linhas no miolo) */}
      {chart.aspects.map((asp, i) => {
        const from = chart.planets.find((p) => p.body === asp.from);
        const to = chart.planets.find((p) => p.body === asp.to);
        if (!from || !to) return null;
        const [x1, y1] = polar(from.longitude, ascLon, R.ring);
        const [x2, y2] = polar(to.longitude, ascLon, R.ring);
        return (
          <line
            key={`${asp.from}-${asp.to}-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ASPECT_COLOR[aspectNature(asp.aspect)]}
            strokeWidth={1}
            opacity={ORB_OPACITY[asp.orb_bucket] ?? 0.2}
          />
        );
      })}

      {/* Planetas: marcador na posição real + linha-guia + glyph no anel */}
      {placed.map((p) => {
        const [tx, ty] = polar(p.longitude, ascLon, R.zodiac - 6);
        const [lx, ly] = polar(p.longitude, ascLon, R.zodiac - 14);
        const [gx, gy] = polar(p.disp, ascLon, R.planet);
        return (
          <g key={p.body}>
            <circle cx={tx} cy={ty} r={1.6} fill="#f0eef8" />
            <line x1={lx} y1={ly} x2={gx} y2={gy} stroke="rgba(184,192,212,0.4)" strokeWidth={0.75} />
            <text
              x={gx}
              y={gy}
              fontSize={19}
              fill={p.retrograde ? "#b8c0d4" : "#f0eef8"}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {glyphFor(p.body)}
            </text>
          </g>
        );
      })}

      <circle cx={C} cy={C} r={R.hub} fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth={1} />
    </svg>
  );
}

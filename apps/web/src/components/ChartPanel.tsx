/** Painel lateral com os dados do mapa em texto: planetas, ângulos e aspectos. */

import type { NatalChart } from "@astra/types";
import {
  SIGN_GLYPH,
  SIGN_PT,
  glyphFor,
  bodyLabel,
  aspectLabel,
  ASPECT_GLYPH,
} from "../lib/astro";

const cell: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  padding: "5px 0",
  borderBottom: "1px solid var(--border-subtle)",
  fontSize: 14,
};

const glyphStyle: React.CSSProperties = {
  color: "var(--celestial-gold)",
  fontSize: 17,
  width: 22,
  textAlign: "center",
};

const degStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  color: "var(--moon-silver)",
  marginLeft: "auto",
  fontSize: 13,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, letterSpacing: 1, color: "var(--celestial-gold)", marginBottom: 8 }}>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ChartPanel({ chart }: { chart: NatalChart }) {
  const angles = [
    { label: "Ascendente", pos: chart.angles.ascendant },
    { label: "Meio do Céu", pos: chart.angles.midheaven },
  ];

  return (
    <div>
      <Section title="PLANETAS">
        {chart.planets.map((p) => (
          <div key={p.body} style={cell}>
            <span style={glyphStyle}>{glyphFor(p.body)}</span>
            <span>{bodyLabel(p.body)}</span>
            <span style={{ color: "var(--moon-silver)" }}>
              {SIGN_GLYPH[p.sign]} {SIGN_PT[p.sign]}
            </span>
            {p.retrograde && (
              <span style={{ color: "#b5476b", fontSize: 12 }} title="Retrógrado">
                ℞
              </span>
            )}
            <span style={degStyle}>
              {p.formatted} · casa {p.house}
            </span>
          </div>
        ))}
      </Section>

      <Section title="ÂNGULOS">
        {angles.map((a) => (
          <div key={a.label} style={cell}>
            <span style={glyphStyle}>{SIGN_GLYPH[a.pos.sign]}</span>
            <span>{a.label}</span>
            <span style={{ color: "var(--moon-silver)" }}>{SIGN_PT[a.pos.sign]}</span>
            <span style={degStyle}>{a.pos.formatted}</span>
          </div>
        ))}
      </Section>

      <Section title={`ASPECTOS (${chart.aspects.length})`}>
        {chart.aspects.map((asp, i) => (
          <div key={`${asp.from}-${asp.to}-${i}`} style={cell}>
            <span style={glyphStyle}>{glyphFor(asp.from)}</span>
            <span style={{ color: "var(--moon-silver)" }}>{ASPECT_GLYPH[asp.aspect] ?? "•"}</span>
            <span style={glyphStyle}>{glyphFor(asp.to)}</span>
            <span style={{ fontSize: 13 }}>{aspectLabel(asp.aspect)}</span>
            <span style={degStyle}>orbe {asp.orb.toFixed(1)}°</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

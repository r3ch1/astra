/**
 * Painel lateral com os dados do mapa em texto: planetas, ângulos e aspectos.
 *
 * Os planetas são clicáveis: ao clicar, busca-se a leitura por IA daquela
 * posição (planeta em signo + casa) e ela é exibida inline. As leituras já
 * carregadas ficam em estado local — reabrir não refaz a chamada.
 */

"use client";

import { useState } from "react";
import type { NatalChart, PlanetPosition } from "@astra/types";
import { fetchInterpretation } from "../lib/api";
import { Markdown } from "./Markdown";
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

interface Reading {
  loading: boolean;
  text?: string;
  error?: string;
}

function PlanetRow({
  planet,
  open,
  reading,
  onToggle,
}: {
  planet: PlanetPosition;
  open: boolean;
  reading: Reading | undefined;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          ...cell,
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid var(--border-subtle)",
          color: "inherit",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={glyphStyle}>{glyphFor(planet.body)}</span>
        <span>{bodyLabel(planet.body)}</span>
        <span style={{ color: "var(--moon-silver)" }}>
          {SIGN_GLYPH[planet.sign]} {SIGN_PT[planet.sign]}
        </span>
        {planet.retrograde && (
          <span style={{ color: "#b5476b", fontSize: 12 }} title="Retrógrado">
            ℞
          </span>
        )}
        <span style={degStyle}>
          {planet.formatted} · casa {planet.house}
        </span>
        <span style={{ color: "var(--celestial-gold)", fontSize: 12, width: 14, textAlign: "center" }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "10px 4px 14px" }}>
          {reading?.loading && (
            <span style={{ color: "var(--moon-silver)", fontSize: 13.5 }}>Lendo o céu…</span>
          )}
          {reading?.error && (
            <span style={{ color: "#e89ab0", fontSize: 13.5 }}>{reading.error}</span>
          )}
          {reading?.text && (
            <Markdown
              text={reading.text}
              style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--off-white)" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function ChartPanel({ chart }: { chart: NatalChart }) {
  const [openBody, setOpenBody] = useState<string | null>(null);
  const [readings, setReadings] = useState<Record<string, Reading>>({});

  const handleToggle = async (planet: PlanetPosition) => {
    if (openBody === planet.body) {
      setOpenBody(null);
      return;
    }
    setOpenBody(planet.body);

    // Já tem leitura com texto, ou está em andamento → não refaz. Se a última
    // tentativa deu ERRO (ex.: 503 transitório), reabrir tenta de novo.
    const existing = readings[planet.body];
    if (existing?.text || existing?.loading) return;

    setReadings((prev) => ({ ...prev, [planet.body]: { loading: true } }));
    const result = await fetchInterpretation({
      body: planet.body,
      sign: planet.sign,
      house: planet.house,
    });
    setReadings((prev) => ({
      ...prev,
      [planet.body]: result.ok
        ? { loading: false, text: result.value.text }
        : { loading: false, error: result.error },
    }));
  };

  const angles = [
    { label: "Ascendente", pos: chart.angles.ascendant },
    { label: "Meio do Céu", pos: chart.angles.midheaven },
  ];

  return (
    <div>
      <Section title="PLANETAS">
        {chart.planets.map((p) => (
          <PlanetRow
            key={p.body}
            planet={p}
            open={openBody === p.body}
            reading={readings[p.body]}
            onToggle={() => handleToggle(p)}
          />
        ))}
        <p style={{ color: "var(--moon-silver)", fontSize: 12, marginTop: 8, opacity: 0.7 }}>
          Clique em um planeta para a leitura por IA.
        </p>
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

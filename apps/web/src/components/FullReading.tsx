/**
 * Leitura Completa — síntese narrativa do mapa inteiro, em painel dedicado
 * (não accordion). Dispara sob demanda (a síntese custa uma chamada de IA e não
 * é cacheada), com um skeleton enquanto o texto é tecido.
 *
 * Recebe o `BirthInput` do mapa exibido; a API recalcula e sintetiza. A `page`
 * remonta este componente por mapa (via key), então o estado não vaza entre um
 * mapa e outro.
 */

"use client";

import { useState } from "react";
import type { BirthInput } from "@astra/types";
import { fetchReading } from "../lib/api";
import { Markdown } from "./Markdown";

interface State {
  loading: boolean;
  text?: string;
  error?: string;
}

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  padding: 24,
  backdropFilter: "blur(6px)",
};

const primaryButton: React.CSSProperties = {
  background: "var(--celestial-gold)",
  color: "var(--deep-violet)",
  border: "none",
  borderRadius: 6,
  padding: "11px 20px",
  fontSize: 14,
  fontWeight: 600,
};

function Skeleton() {
  // Larguras variadas para lembrar parágrafos de texto sendo gerados.
  const widths = ["95%", "88%", "92%", "70%", "85%", "60%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
      <span style={{ color: "var(--moon-silver)", fontSize: 13.5, marginBottom: 4 }}>
        Tecendo a leitura do seu mapa…
      </span>
      {widths.map((w, i) => (
        <div key={i} className="astra-skeleton" style={{ width: w }} />
      ))}
    </div>
  );
}

export function FullReading({ input }: { input: BirthInput }) {
  const [state, setState] = useState<State>({ loading: false });

  const handleClick = async () => {
    if (state.loading) return;
    setState({ loading: true });
    const result = await fetchReading(input);
    setState(
      result.ok
        ? { loading: false, text: result.value.text }
        : { loading: false, error: result.error },
    );
  };

  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 22 }}>✦ Leitura Completa</h2>
        <button
          type="button"
          onClick={handleClick}
          disabled={state.loading}
          style={{ ...primaryButton, marginLeft: "auto" }}
        >
          {state.loading
            ? "Gerando…"
            : state.text
              ? "Gerar novamente"
              : "Gerar leitura do mapa"}
        </button>
      </div>

      {!state.loading && !state.text && !state.error && (
        <p style={{ color: "var(--moon-silver)", fontSize: 13.5, marginTop: 10, opacity: 0.8 }}>
          Uma síntese que conecta os temas centrais do mapa — para além de cada
          posição isolada.
        </p>
      )}

      {state.loading && <Skeleton />}

      {state.error && (
        <p style={{ color: "#e89ab0", marginTop: 16, fontSize: 14 }}>{state.error}</p>
      )}

      {state.text && !state.loading && (
        <Markdown
          text={state.text}
          style={{
            marginTop: 18,
            fontSize: 14.5,
            lineHeight: 1.7,
            color: "var(--off-white)",
          }}
        />
      )}
    </section>
  );
}

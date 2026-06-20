"use client";

import { useState } from "react";
import type { BirthInput, NatalChart } from "@astra/types";
import { fetchChart } from "../lib/api";
import { BirthForm } from "../components/BirthForm";
import { NatalChartWheel } from "../components/NatalChartWheel";
import { ChartPanel } from "../components/ChartPanel";

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  padding: 24,
  backdropFilter: "blur(6px)",
};

// O Next exige default export em page.tsx (arquivo especial do App Router).
export default function HomePage() {
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: BirthInput) => {
    setLoading(true);
    setError(null);
    const result = await fetchChart(input);
    if (result.ok) {
      setChart(result.value);
    } else {
      setError(result.error);
      setChart(null);
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px 80px" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 38, letterSpacing: 0.5 }}>✦ Astra</h1>
        <p style={{ color: "var(--moon-silver)", marginTop: 6, maxWidth: 560 }}>
          Informe data, hora e local de nascimento para gerar o mapa natal —
          cálculo de precisão via Swiss Ephemeris.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: chart ? "minmax(0, 1.3fr) minmax(320px, 1fr)" : "minmax(320px, 460px)",
          gap: 24,
          alignItems: "start",
        }}
      >
        {!chart && (
          <div style={card}>
            <BirthForm onSubmit={handleSubmit} loading={loading} />
            {error && (
              <p style={{ color: "#e89ab0", marginTop: 16, fontSize: 14 }}>{error}</p>
            )}
          </div>
        )}

        {chart && (
          <>
            <div style={card}>
              <NatalChartWheel chart={chart} />
              {chart.ephemeris === "moshier" && (
                <p style={{ color: "var(--moon-silver)", fontSize: 12, marginTop: 12, opacity: 0.7 }}>
                  Efemérides Moshier (precisão de arco-minuto). Quíron pode estar ausente.
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card}>
                <ChartPanel chart={chart} />
              </div>
              <button
                onClick={() => {
                  setChart(null);
                  setError(null);
                }}
                style={{
                  background: "transparent",
                  color: "var(--moon-silver)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 6,
                  padding: "10px 16px",
                  fontSize: 14,
                }}
              >
                ← Novo mapa
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

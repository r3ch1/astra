/**
 * Mapa compartilhado — `/m/[token]`. Decodifica o BirthInput embutido no token,
 * recalcula o mapa (mesmo proxy /api/chart da home) e o exibe read-only, com um
 * CTA para o visitante criar o próprio mapa. Stateless: nada é persistido.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { NatalChart } from "@astra/types";
import { fetchChart } from "../../../lib/api";
import { decodeShareToken } from "../../../lib/share";
import { NatalChartWheel } from "../../../components/NatalChartWheel";
import { ChartPanel } from "../../../components/ChartPanel";
import { FullReading } from "../../../components/FullReading";

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  padding: 24,
  backdropFilter: "blur(6px)",
};

const ctaLink: React.CSSProperties = {
  display: "inline-block",
  background: "var(--celestial-gold)",
  color: "var(--deep-violet)",
  borderRadius: 6,
  padding: "11px 20px",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

export default function SharedChartPage() {
  const params = useParams<{ token: string }>();
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = params.token;
    const token = Array.isArray(raw) ? (raw[0] ?? "") : raw;

    const decoded = decodeShareToken(token);
    if (!decoded.ok) {
      setError(decoded.error);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    fetchChart(decoded.value).then((result) => {
      if (!active) return;
      if (result.ok) setChart(result.value);
      else setError(result.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.token]);

  const name = chart?.input.name?.trim();

  return (
    <main style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px 80px" }}>
      <header
        style={{
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, letterSpacing: 0.5 }}>
            ✦ {name ? `Mapa natal de ${name}` : "Mapa natal compartilhado"}
          </h1>
          <p style={{ color: "var(--moon-silver)", marginTop: 6 }}>
            Mapa compartilhado via Astra — cálculo de precisão via Swiss Ephemeris.
          </p>
        </div>
        <Link href="/" style={ctaLink}>
          ✦ Criar meu próprio mapa
        </Link>
      </header>

      {loading && (
        <p style={{ color: "var(--moon-silver)" }}>Calculando o mapa…</p>
      )}

      {error && !loading && (
        <div style={card}>
          <p style={{ color: "#e89ab0", fontSize: 14 }}>{error}</p>
          <p style={{ color: "var(--moon-silver)", fontSize: 13.5, marginTop: 12 }}>
            <Link href="/" style={{ color: "var(--celestial-gold)" }}>
              Criar um novo mapa →
            </Link>
          </p>
        </div>
      )}

      {chart && !loading && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 1fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div style={card}>
              <NatalChartWheel chart={chart} />
              {chart.ephemeris === "moshier" && (
                <p style={{ color: "var(--moon-silver)", fontSize: 12, marginTop: 12, opacity: 0.7 }}>
                  Efemérides Moshier (precisão de arco-minuto). Quíron pode estar ausente.
                </p>
              )}
            </div>

            <div style={card}>
              <ChartPanel chart={chart} />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <FullReading key={chart.julian_day_ut} input={chart.input} />
          </div>
        </>
      )}
    </main>
  );
}

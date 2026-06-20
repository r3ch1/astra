"use client";

import { useState } from "react";
import type { BirthInput } from "@astra/types";

// Fusos mais comuns no Brasil; o motor aceita qualquer fuso IANA.
const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Cuiaba",
  "America/Belem",
  "America/Fortaleza",
  "America/Rio_Branco",
  "America/Noronha",
  "UTC",
];

const field: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
  color: "var(--moon-silver)",
};

const input: React.CSSProperties = {
  background: "rgba(13,27,75,0.6)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 6,
  padding: "9px 10px",
  color: "var(--off-white)",
  fontFamily: "var(--font-body)",
  fontSize: 14,
};

export function BirthForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: BirthInput) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("1987-12-04");
  const [time, setTime] = useState("20:20");
  const [timezone, setTimezone] = useState(TIMEZONES[0]!);
  const [latitude, setLatitude] = useState("-22.9068");
  const [longitude, setLongitude] = useState("-43.1729");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = date.split("-").map(Number) as [number, number, number];
    const [hour, minute] = time.split(":").map(Number) as [number, number];
    onSubmit({
      ...(name.trim() ? { name: name.trim() } : {}),
      year,
      month,
      day,
      hour,
      minute,
      timezone,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={field}>
        Nome (opcional)
        <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="—" />
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ ...field, flex: 1 }}>
          Data de nascimento
          <input style={input} type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
        </label>
        <label style={{ ...field, flex: 1 }}>
          Hora
          <input style={input} type="time" value={time} required onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>

      <label style={field}>
        Fuso horário
        <select style={input} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ ...field, flex: 1 }}>
          Latitude
          <input
            style={{ ...input, fontFamily: "var(--font-mono)" }}
            value={latitude}
            required
            inputMode="decimal"
            onChange={(e) => setLatitude(e.target.value)}
          />
        </label>
        <label style={{ ...field, flex: 1 }}>
          Longitude
          <input
            style={{ ...input, fontFamily: "var(--font-mono)" }}
            value={longitude}
            required
            inputMode="decimal"
            onChange={(e) => setLongitude(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 4,
          background: "var(--celestial-gold)",
          color: "var(--deep-violet)",
          border: "none",
          borderRadius: 6,
          padding: "11px 16px",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}
      >
        {loading ? "Calculando…" : "Gerar mapa natal"}
      </button>
    </form>
  );
}

/**
 * Botão "Compartilhar" — monta o link stateless do mapa (dados embutidos na
 * URL) e copia para a área de transferência. Cai num prompt manual quando o
 * navegador bloqueia o clipboard (sem HTTPS/permissão).
 */

"use client";

import { useState } from "react";
import type { BirthInput } from "@astra/types";
import { buildShareUrl } from "../lib/share";

const buttonStyle: React.CSSProperties = {
  background: "transparent",
  color: "var(--moon-silver)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 6,
  padding: "10px 16px",
  fontSize: 14,
};

export function ShareButton({ input }: { input: BirthInput }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl(input, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link do mapa:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{ ...buttonStyle, color: copied ? "var(--celestial-gold)" : "var(--moon-silver)" }}
    >
      {copied ? "✓ Link copiado!" : "Compartilhar"}
    </button>
  );
}

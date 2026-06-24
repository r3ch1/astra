/**
 * Compartilhamento de mapa — stateless. O mapa é compartilhado codificando o
 * próprio `BirthInput` na URL (base64url), sem banco nem persistência: quem
 * abre o link recalcula o mapa a partir dos dados embutidos. Simples e sem
 * segredos; o custo é uma URL um pouco longa.
 *
 * A codificação é UTF-8-safe (nomes com acento) — `btoa`/`atob` sozinhos só
 * lidam com Latin1, então passamos pelos Text(En|De)coder.
 */

import type { BirthInput } from "@astra/types";
import { type Result, ok, err } from "./result";

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string {
  const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Campos mínimos de um BirthInput — guard leve; o schema da API valida o resto. */
function isBirthInput(v: unknown): v is BirthInput {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.year === "number" &&
    typeof o.month === "number" &&
    typeof o.day === "number" &&
    typeof o.hour === "number" &&
    typeof o.minute === "number" &&
    typeof o.timezone === "string" &&
    typeof o.latitude === "number" &&
    typeof o.longitude === "number"
  );
}

export function encodeBirthInput(input: BirthInput): string {
  return toBase64Url(JSON.stringify(input));
}

/** Monta a URL absoluta de compartilhamento (`origin` = window.location.origin). */
export function buildShareUrl(input: BirthInput, origin: string): string {
  return `${origin}/m/${encodeBirthInput(input)}`;
}

/** Decodifica o token de um link compartilhado, validando o formato. */
export function decodeShareToken(token: string): Result<BirthInput, string> {
  let json: string;
  try {
    json = fromBase64Url(token);
  } catch {
    return err("Link inválido — não foi possível ler os dados do mapa.");
  }

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return err("Link inválido — dados corrompidos.");
  }

  if (!isBirthInput(data)) {
    return err("Link inválido ou incompleto.");
  }
  return ok(data);
}

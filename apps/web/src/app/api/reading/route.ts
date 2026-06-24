/**
 * Proxy server-side para POST /reading na API do Astra (Leitura Completa).
 * Mesmo padrão de /api/chart e /api/interpretation: o browser chama same-origin
 * (sem CORS) e o Next encaminha, mantendo a URL interna da API fora do cliente.
 */

import { NextResponse } from "next/server";

const API_URL = process.env.ASTRA_API_URL ?? "http://localhost:3333";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    return NextResponse.json(
      { message: `API indisponível: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  const payload = await upstream.text();
  return new NextResponse(payload, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}

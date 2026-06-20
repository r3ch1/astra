/**
 * Testes de integração da API. Usam `inject()` (sem abrir porta) e exercitam o
 * subprocesso real do `astra-calc` — exige o binário compilado
 * (`pnpm calc:build`).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { NatalChart } from "@astra/types";
import { buildServer } from "./server.js";

// Fixture padrão de teste do projeto.
const birthInput = {
  name: "Teste",
  year: 1987,
  month: 12,
  day: 4,
  hour: 20,
  minute: 20,
  timezone: "America/Sao_Paulo",
  latitude: -22.9068,
  longitude: -43.1729,
};

test("GET /health responde ok", async () => {
  const app = buildServer();
  const res = await app.inject({ method: "GET", url: "/health" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { status: "ok" });
  await app.close();
});

test("POST /chart calcula o mapa natal", async () => {
  const app = buildServer();
  const res = await app.inject({ method: "POST", url: "/chart", payload: birthInput });
  assert.equal(res.statusCode, 200);
  const chart = res.json() as NatalChart;
  assert.ok(chart.planets.length > 0, "deve retornar planetas");
  assert.ok(chart.houses.length === 12, "deve retornar 12 casas");
  const sun = chart.planets.find((p) => p.body === "Sun");
  assert.ok(sun, "deve conter o Sol");
  // 04/12/1987 → Sol em Sagitário.
  assert.equal(sun.sign, "Sagittarius");
  await app.close();
});

test("POST /chart rejeita corpo inválido com 400", async () => {
  const app = buildServer();
  const res = await app.inject({ method: "POST", url: "/chart", payload: { year: 1987 } });
  assert.equal(res.statusCode, 400);
  await app.close();
});

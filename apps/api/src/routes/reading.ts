/**
 * Rota POST /reading — Leitura Completa: recebe os dados de nascimento, recalcula
 * o mapa e devolve a síntese narrativa por IA. Recalcular (em vez de receber o
 * mapa do cliente) mantém o request pequeno, reaproveita o schema de BirthInput
 * e garante que a leitura reflita um mapa consistente.
 */

import type { FastifyPluginAsync } from "fastify";
import type { BirthInput, ReadingResponse } from "@astra/types";
import { computeChart, type CalcErrorKind } from "../calculator.js";
import { synthesize } from "../llm/reading.js";
import type { LlmErrorKind } from "../llm/provider.js";
import { birthInputSchema } from "./chart.js";

// Mesmo mapeamento das rotas /chart e /interpretation (cada rota declara o seu).
const calcStatusByKind: Record<CalcErrorKind, number> = {
  exit: 422,
  spawn: 500,
  parse: 500,
  timeout: 504,
};

const llmStatusByKind: Record<LlmErrorKind, number> = {
  config: 503,
  refusal: 502,
  request: 502,
};

export const readingRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: BirthInput }>(
    "/reading",
    { schema: { body: birthInputSchema } },
    async (req, reply) => {
      const chart = await computeChart(req.body);
      if (!chart.ok) {
        const status = calcStatusByKind[chart.error.kind];
        if (status >= 500) req.log.error(chart.error, "falha no cálculo para leitura");
        return reply
          .status(status)
          .send({ error: chart.error.kind, message: chart.error.message });
      }

      const reading = await synthesize(chart.value);
      if (!reading.ok) {
        const status = llmStatusByKind[reading.error.kind];
        req.log.error(reading.error, "falha na leitura completa por IA");
        return reply
          .status(status)
          .send({ error: reading.error.kind, message: reading.error.message });
      }

      const payload: ReadingResponse = {
        text: reading.value.text,
        model: reading.value.model,
        prompt_version: reading.value.promptVersion,
      };
      return reply.send(payload);
    },
  );
};

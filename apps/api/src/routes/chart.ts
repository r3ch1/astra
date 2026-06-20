/**
 * Rota POST /chart — recebe os dados de nascimento e devolve o mapa natal.
 *
 * A validação do corpo usa o JSON Schema nativo do Fastify (ajv), espelhando
 * o `BirthInput` de @astra/types.
 */

import type { FastifyPluginAsync } from "fastify";
import type { BirthInput } from "@astra/types";
import { computeChart, type CalcErrorKind } from "../calculator.js";

const birthInputSchema = {
  type: "object",
  required: ["year", "month", "day", "hour", "minute", "timezone", "latitude", "longitude"],
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    year: { type: "integer" },
    month: { type: "integer", minimum: 1, maximum: 12 },
    day: { type: "integer", minimum: 1, maximum: 31 },
    hour: { type: "integer", minimum: 0, maximum: 23 },
    minute: { type: "integer", minimum: 0, maximum: 59 },
    second: { type: "integer", minimum: 0, maximum: 59 },
    timezone: { type: "string", minLength: 1 },
    latitude: { type: "number", minimum: -90, maximum: 90 },
    longitude: { type: "number", minimum: -180, maximum: 180 },
    house_system: { type: "string", minLength: 1, maxLength: 1 },
  },
} as const;

// Erro de cálculo (`exit`) normalmente significa entrada inválida para o motor
// (ex.: fuso inexistente) → 422. Os demais são falhas internas → 500.
const statusByKind: Record<CalcErrorKind, number> = {
  exit: 422,
  spawn: 500,
  parse: 500,
  timeout: 504,
};

export const chartRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: BirthInput }>(
    "/chart",
    { schema: { body: birthInputSchema } },
    async (req, reply) => {
      const result = await computeChart(req.body);
      if (!result.ok) {
        const status = statusByKind[result.error.kind];
        if (status >= 500) req.log.error(result.error, "falha no motor de cálculo");
        return reply
          .status(status)
          .send({ error: result.error.kind, message: result.error.message });
      }
      return reply.send(result.value);
    },
  );
};

/**
 * Rota POST /interpretation — gera (ou recupera do cache) a leitura por IA de
 * uma posição do mapa. Validação via JSON Schema do Fastify, espelhando
 * `InterpretationRequest` de @astra/types.
 */

import type { FastifyPluginAsync } from "fastify";
import type { InterpretationRequest, InterpretationResponse } from "@astra/types";
import { SIGNS } from "@astra/types";
import { interpret } from "../llm/interpret.js";
import type { LlmErrorKind } from "../llm/provider.js";

const interpretationSchema = {
  type: "object",
  required: ["body", "sign", "house"],
  additionalProperties: false,
  properties: {
    body: { type: "string", minLength: 1 },
    sign: { type: "string", enum: [...SIGNS] },
    house: { type: "integer", minimum: 1, maximum: 12 },
    aspect: {
      type: "object",
      required: ["type", "with", "orb_bucket"],
      additionalProperties: false,
      properties: {
        type: { type: "string", minLength: 1 },
        with: { type: "string", minLength: 1 },
        orb_bucket: { type: "string", enum: ["exato", "forte", "moderado", "fraco"] },
      },
    },
  },
} as const;

// "config" (ex.: key ausente) é problema de configuração do serviço → 503.
// "refusal"/"request" são falhas a montante (modelo) → 502.
const statusByKind: Record<LlmErrorKind, number> = {
  config: 503,
  refusal: 502,
  request: 502,
};

export const interpretationRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: InterpretationRequest }>(
    "/interpretation",
    { schema: { body: interpretationSchema } },
    async (req, reply) => {
      const result = await interpret(req.body);
      if (!result.ok) {
        const status = statusByKind[result.error.kind];
        req.log.error(result.error, "falha na interpretação por IA");
        return reply
          .status(status)
          .send({ error: result.error.kind, message: result.error.message });
      }
      const payload: InterpretationResponse = {
        text: result.value.text,
        cached: result.value.cached,
        model: result.value.model,
        prompt_version: result.value.promptVersion,
      };
      return reply.send(payload);
    },
  );
};

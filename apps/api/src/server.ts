/**
 * Construção da instância Fastify. Separada do bootstrap (`index.ts`) para que
 * os testes possam montar o app e usar `inject()` sem abrir uma porta.
 */

import Fastify, { type FastifyInstance } from "fastify";
import { chartRoutes } from "./routes/chart.js";
import { interpretationRoutes } from "./routes/interpretation.js";
import { readingRoutes } from "./routes/reading.js";

export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(chartRoutes);
  app.register(interpretationRoutes);
  app.register(readingRoutes);

  return app;
}

/** Bootstrap da API. */

import { buildServer } from "./server.js";
import { config } from "./config.js";

const app = buildServer();

app.listen({ host: config.host, port: config.port }).catch((e) => {
  app.log.error(e);
  process.exit(1);
});

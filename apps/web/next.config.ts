import type { NextConfig } from "next";

const config: NextConfig = {
  // @astra/types é distribuído como TypeScript-fonte (sem build), então o Next
  // precisa transpilá-lo.
  transpilePackages: ["@astra/types"],
};

export default config;

/**
 * Camada de acesso ao motor de cálculo.
 *
 * Hoje a estratégia é invocar o binário `astra-calc` como subprocesso (stdin
 * JSON → stdout JSON). Toda a integração com o Rust mora NESTE módulo: a
 * interface pública é `computeChart(input) → Result<NatalChart>`. Se um dia
 * migrarmos para um binding nativo (napi-rs), troca-se só a implementação
 * daqui, sem tocar nas rotas.
 */

import { spawn } from "node:child_process";
import type { BirthInput, NatalChart } from "@astra/types";
import { type Result, ok, err } from "./result.js";
import { config } from "./config.js";

export type CalcErrorKind = "spawn" | "exit" | "parse" | "timeout";

export interface CalcError {
  kind: CalcErrorKind;
  message: string;
}

/** Calcula o mapa natal a partir dos dados de nascimento. */
export function computeChart(
  input: BirthInput,
): Promise<Result<NatalChart, CalcError>> {
  return new Promise((resolve) => {
    const child = spawn(config.calcBin, ["--compact"], {
      env: config.ephePath
        ? { ...process.env, ASTRA_EPHE_PATH: config.ephePath }
        : process.env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (result: Result<NatalChart, CalcError>): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(
        err({
          kind: "timeout",
          message: `cálculo excedeu ${config.calcTimeoutMs}ms`,
        }),
      );
    }, config.calcTimeoutMs);

    child.on("error", (e) => {
      finish(
        err({
          kind: "spawn",
          message: `falha ao executar ${config.calcBin}: ${e.message}`,
        }),
      );
    });

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (code) => {
      if (code !== 0) {
        finish(
          err({
            kind: "exit",
            message: stderr.trim() || `astra-calc encerrou com código ${code}`,
          }),
        );
        return;
      }
      try {
        finish(ok(JSON.parse(stdout) as NatalChart));
      } catch (e) {
        finish(
          err({
            kind: "parse",
            message: `JSON inválido vindo do astra-calc: ${(e as Error).message}`,
          }),
        );
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

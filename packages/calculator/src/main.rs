//! CLI do motor de cálculo.
//!
//! Lê um `BirthInput` em JSON (de um arquivo passado como argumento ou da
//! entrada padrão) e imprime o `NatalChart` em JSON na saída padrão.
//!
//! ```text
//! echo '{"year":1987,"month":12,"day":4,"hour":20,"minute":20,
//!        "timezone":"America/Sao_Paulo","latitude":-22.9068,
//!        "longitude":-43.1729}' | astra-calc
//!
//! astra-calc dados.json --compact
//! ```

use std::io::Read;
use std::process::ExitCode;

use astra_calculator::{compute_natal_chart, BirthInput};

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let compact = args.iter().any(|a| a == "--compact");
    let path = args.iter().find(|a| !a.starts_with("--"));

    let raw = match read_input(path.map(String::as_str)) {
        Ok(s) => s,
        Err(e) => return fail(&format!("falha ao ler entrada: {e}")),
    };

    let input: BirthInput = match serde_json::from_str(&raw) {
        Ok(i) => i,
        Err(e) => return fail(&format!("JSON de entrada inválido: {e}")),
    };

    let chart = match compute_natal_chart(input) {
        Ok(c) => c,
        Err(e) => return fail(&format!("erro de cálculo: {e}")),
    };

    let out = if compact {
        serde_json::to_string(&chart)
    } else {
        serde_json::to_string_pretty(&chart)
    };

    match out {
        Ok(json) => {
            println!("{json}");
            ExitCode::SUCCESS
        }
        Err(e) => fail(&format!("falha ao serializar saída: {e}")),
    }
}

fn read_input(path: Option<&str>) -> std::io::Result<String> {
    match path {
        Some(p) => std::fs::read_to_string(p),
        None => {
            let mut buf = String::new();
            std::io::stdin().read_to_string(&mut buf)?;
            Ok(buf)
        }
    }
}

fn fail(message: &str) -> ExitCode {
    eprintln!("astra-calc: {message}");
    ExitCode::FAILURE
}

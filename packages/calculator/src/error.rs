//! Erros do motor de cálculo. Seguimos o padrão Result do projeto — sem
//! `unwrap`/`panic` no caminho de cálculo.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CalcError {
    #[error("fuso horário inválido: '{0}' (esperado nome IANA, ex: America/Sao_Paulo)")]
    InvalidTimezone(String),

    #[error("data/hora local inválida ou inexistente: {0}")]
    InvalidDateTime(String),

    #[error("hora local ambígua (transição de horário de verão): {0}")]
    AmbiguousLocalTime(String),

    #[error("sistema de casas inválido: '{0}'")]
    InvalidHouseSystem(char),

    #[error("Swiss Ephemeris falhou ao calcular {body}: {message}")]
    Ephemeris { body: String, message: String },
}

pub type Result<T> = std::result::Result<T, CalcError>;

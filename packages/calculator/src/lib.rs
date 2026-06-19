//! `astra-calculator` — motor de cálculo astrológico do Astra.
//!
//! Calcula mapas natais de precisão usando o Swiss Ephemeris (via FFI) e
//! devolve uma estrutura serializável em JSON, contrato com o restante da
//! plataforma.
//!
//! ```no_run
//! use astra_calculator::{compute_natal_chart, BirthInput};
//!
//! let chart = compute_natal_chart(BirthInput {
//!     name: Some("Exemplo".into()),
//!     year: 1987, month: 12, day: 4,
//!     hour: 20, minute: 20, second: 0,
//!     timezone: "America/Sao_Paulo".into(),
//!     latitude: -22.9068, longitude: -43.1729,
//!     house_system: 'P',
//! })
//! .unwrap();
//! println!("Sol: {}", chart.planets[0].position.formatted);
//! ```

mod ephemeris;
mod error;
mod types;

pub use ephemeris::compute_natal_chart;
pub use error::{CalcError, Result};
pub use types::{
    Angles, Aspect, BirthInput, HouseCusp, NatalChart, OrbBucket, PlanetPosition, ZodiacPosition,
    SIGNS,
};

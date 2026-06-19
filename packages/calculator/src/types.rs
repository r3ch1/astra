//! Tipos de entrada e saída do motor de cálculo.
//!
//! O JSON produzido aqui é o contrato com o restante da plataforma (API Node,
//! frontend). Ao evoluir estes tipos, espelhar em `packages/types`.

use serde::{Deserialize, Serialize};

/// Os 12 signos do zodíaco, em ordem (índice 0 = Áries).
pub const SIGNS: [&str; 12] = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
];

/// Dados de nascimento de entrada (hora civil local + fuso IANA).
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BirthInput {
    /// Nome opcional (apenas ecoado na saída).
    #[serde(default)]
    pub name: Option<String>,
    pub year: i32,
    pub month: u32,
    pub day: u32,
    pub hour: u32,
    pub minute: u32,
    #[serde(default)]
    pub second: u32,
    /// Fuso horário IANA, ex: "America/Sao_Paulo". Resolve o horário de verão
    /// histórico automaticamente.
    pub timezone: String,
    pub latitude: f64,
    pub longitude: f64,
    /// Letra do sistema de casas Swiss Ephemeris. Padrão 'P' (Placidus).
    #[serde(default = "default_house_system")]
    pub house_system: char,
}

fn default_house_system() -> char {
    'P'
}

/// Uma posição zodiacal decomposta em signo + grau dentro do signo.
#[derive(Debug, Clone, Serialize)]
pub struct ZodiacPosition {
    /// Longitude eclíptica absoluta [0, 360).
    pub longitude: f64,
    pub sign: String,
    /// Grau dentro do signo [0, 30).
    pub sign_degree: f64,
    /// Representação legível, ex: "12°13'".
    pub formatted: String,
}

impl ZodiacPosition {
    pub fn from_longitude(longitude: f64) -> Self {
        let lon = longitude.rem_euclid(360.0);
        let sign_index = (lon / 30.0).floor() as usize % 12;
        let sign_degree = lon - (sign_index as f64) * 30.0;
        let deg = sign_degree.floor() as u32;
        let min = ((sign_degree - deg as f64) * 60.0).round() as u32;
        // Arredondamento pode estourar para 60'.
        let (deg, min) = if min == 60 { (deg + 1, 0) } else { (deg, min) };
        Self {
            longitude: lon,
            sign: SIGNS[sign_index].to_string(),
            sign_degree,
            formatted: format!("{deg}°{min:02}'"),
        }
    }
}

/// Um corpo celeste posicionado no mapa.
#[derive(Debug, Clone, Serialize)]
pub struct PlanetPosition {
    pub body: String,
    #[serde(flatten)]
    pub position: ZodiacPosition,
    pub latitude: f64,
    /// Velocidade em longitude (graus/dia). Negativa = retrógrado.
    pub speed: f64,
    pub retrograde: bool,
    /// Número da casa (1..12) em que o corpo se encontra.
    pub house: u8,
}

/// Cúspide de casa.
#[derive(Debug, Clone, Serialize)]
pub struct HouseCusp {
    pub number: u8,
    #[serde(flatten)]
    pub position: ZodiacPosition,
}

/// Os quatro ângulos principais do mapa.
#[derive(Debug, Clone, Serialize)]
pub struct Angles {
    pub ascendant: ZodiacPosition,
    pub midheaven: ZodiacPosition,
    pub descendant: ZodiacPosition,
    pub imum_coeli: ZodiacPosition,
}

/// Faixa de orbe, conforme estratégia de cache do projeto.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum OrbBucket {
    Exato,    // <= 1°
    Forte,    // <= 3°
    Moderado, // <= 6°
    Fraco,    // > 6°
}

impl OrbBucket {
    pub fn from_orb(orb: f64) -> Self {
        let o = orb.abs();
        if o <= 1.0 {
            OrbBucket::Exato
        } else if o <= 3.0 {
            OrbBucket::Forte
        } else if o <= 6.0 {
            OrbBucket::Moderado
        } else {
            OrbBucket::Fraco
        }
    }
}

/// Aspecto entre dois corpos.
#[derive(Debug, Clone, Serialize)]
pub struct Aspect {
    pub from: String,
    pub to: String,
    pub aspect: String,
    /// Ângulo exato do aspecto (0, 60, 90, 120, 180...).
    pub angle: u16,
    /// Desvio absoluto do ângulo exato, em graus.
    pub orb: f64,
    pub orb_bucket: OrbBucket,
    /// true = aplicativo (se formando), false = separativo.
    pub applying: bool,
}

/// Resultado completo do cálculo do mapa natal.
#[derive(Debug, Clone, Serialize)]
pub struct NatalChart {
    pub input: BirthInput,
    /// Offset UTC efetivo aplicado (horas), já considerando horário de verão.
    pub utc_offset_hours: f64,
    pub julian_day_ut: f64,
    /// Fonte de efemérides usada: "swiss" ou "moshier".
    pub ephemeris: String,
    pub planets: Vec<PlanetPosition>,
    pub houses: Vec<HouseCusp>,
    pub angles: Angles,
    pub aspects: Vec<Aspect>,
}

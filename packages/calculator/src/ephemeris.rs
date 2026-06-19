//! Camada segura sobre o Swiss Ephemeris (libswe via FFI).
//!
//! O libswe mantém estado global (caminho de efemérides) e não é reentrante,
//! então serializamos todo o cálculo com um Mutex.

use std::sync::Mutex;

use chrono::{Datelike, LocalResult, NaiveDate, Offset, TimeZone, Timelike, Utc};
use chrono_tz::Tz;
use libswe_sys::sweconst::{Bodies, Calandar, OptionalFlag};
use libswe_sys::swerust::{handler_swe02, handler_swe03, handler_swe08, handler_swe14};

use crate::error::{CalcError, Result};
use crate::types::*;

/// Serializa o acesso ao libswe (estado global, não reentrante).
static SWE_LOCK: Mutex<()> = Mutex::new(());

/// Corpos calculados no mapa natal. Nome de exibição + enum do libswe.
const NATAL_BODIES: &[(&str, Bodies)] = &[
    ("Sun", Bodies::Sun),
    ("Moon", Bodies::Moon),
    ("Mercury", Bodies::Mercury),
    ("Venus", Bodies::Venus),
    ("Mars", Bodies::Mars),
    ("Jupiter", Bodies::Jupiter),
    ("Saturn", Bodies::Saturn),
    ("Uranus", Bodies::Uranus),
    ("Neptune", Bodies::Neptune),
    ("Pluto", Bodies::Pluto),
    ("NorthNode", Bodies::TrueNode),
    ("Chiron", Bodies::Chiron),
    ("Lilith", Bodies::MeanApog),
];

/// Aspectos maiores: (nome, ângulo exato, orbe máximo).
const MAJOR_ASPECTS: &[(&str, u16, f64)] = &[
    ("Conjunction", 0, 8.0),
    ("Sextile", 60, 6.0),
    ("Square", 90, 7.0),
    ("Trine", 120, 7.0),
    ("Opposition", 180, 8.0),
];

/// Calcula o mapa natal completo a partir dos dados de nascimento.
pub fn compute_natal_chart(input: BirthInput) -> Result<NatalChart> {
    let (jd_ut, utc_offset_hours) = to_julian_day(&input)?;

    // Efemérides Swiss (precisão de arco-segundo) se ASTRA_EPHE_PATH apontar
    // para os arquivos .se1; caso contrário, Moshier (sem arquivos, ~arcsec).
    let ephe_path = std::env::var("ASTRA_EPHE_PATH").unwrap_or_default();
    let use_swiss = !ephe_path.is_empty();
    let source_flag = if use_swiss {
        OptionalFlag::SwissEph as i32
    } else {
        OptionalFlag::Moshier as i32
    };
    let iflag = source_flag | OptionalFlag::Speed as i32;

    let _guard = SWE_LOCK.lock().expect("SWE_LOCK envenenado");
    handler_swe02::set_ephe_path(&ephe_path);

    // --- Casas e ângulos ---
    if !"PKOCRWBE".contains(input.house_system.to_ascii_uppercase()) {
        handler_swe02::close();
        return Err(CalcError::InvalidHouseSystem(input.house_system));
    }
    let h = handler_swe14::houses(jd_ut, input.latitude, input.longitude, input.house_system);
    // cusps[1..=12] são válidas; cusps[0] não é usada.
    let mut cusps = [0.0f64; 13];
    for i in 1..=12 {
        cusps[i] = h.cusps[i];
    }
    let asc = h.ascmc[0];
    let mc = h.ascmc[1];
    let angles = Angles {
        ascendant: ZodiacPosition::from_longitude(asc),
        midheaven: ZodiacPosition::from_longitude(mc),
        descendant: ZodiacPosition::from_longitude(asc + 180.0),
        imum_coeli: ZodiacPosition::from_longitude(mc + 180.0),
    };
    let houses: Vec<HouseCusp> = (1..=12)
        .map(|i| HouseCusp {
            number: i as u8,
            position: ZodiacPosition::from_longitude(cusps[i]),
        })
        .collect();

    // --- Planetas ---
    let mut planets: Vec<PlanetPosition> = Vec::with_capacity(NATAL_BODIES.len());
    for (name, body) in NATAL_BODIES {
        let calc = handler_swe03::calc_ut(jd_ut, *body, iflag);
        if calc.status < 0 {
            // Corpo indisponível nesta fonte (ex: Chiron sem arquivo de
            // asteroides no modo Moshier). Pulamos sem abortar o mapa.
            continue;
        }
        let lon = calc.longitude.rem_euclid(360.0);
        planets.push(PlanetPosition {
            body: (*name).to_string(),
            position: ZodiacPosition::from_longitude(lon),
            latitude: calc.latitude,
            speed: calc.speed_longitude,
            retrograde: calc.speed_longitude < 0.0,
            house: house_of(lon, &cusps),
        });
    }

    handler_swe02::close();

    let aspects = compute_aspects(&planets);

    Ok(NatalChart {
        input,
        utc_offset_hours,
        julian_day_ut: jd_ut,
        ephemeris: if use_swiss { "swiss" } else { "moshier" }.to_string(),
        planets,
        houses,
        angles,
        aspects,
    })
}

/// Converte a hora civil local (com fuso IANA) em Julian Day UT, devolvendo
/// também o offset UTC efetivo (já com horário de verão histórico aplicado).
fn to_julian_day(input: &BirthInput) -> Result<(f64, f64)> {
    let tz: Tz = input
        .timezone
        .parse()
        .map_err(|_| CalcError::InvalidTimezone(input.timezone.clone()))?;

    let naive = NaiveDate::from_ymd_opt(input.year, input.month, input.day)
        .and_then(|d| d.and_hms_opt(input.hour, input.minute, input.second))
        .ok_or_else(|| {
            CalcError::InvalidDateTime(format!(
                "{:04}-{:02}-{:02} {:02}:{:02}:{:02}",
                input.year, input.month, input.day, input.hour, input.minute, input.second
            ))
        })?;

    let local = match tz.from_local_datetime(&naive) {
        LocalResult::Single(dt) => dt,
        // Em transição de horário de verão a hora pode repetir; usamos a
        // primeira ocorrência de forma determinística.
        LocalResult::Ambiguous(dt, _) => dt,
        LocalResult::None => {
            return Err(CalcError::InvalidDateTime(format!(
                "{naive} não existe em {}",
                input.timezone
            )))
        }
    };

    let utc = local.with_timezone(&Utc);
    let offset_seconds = local.offset().fix().local_minus_utc();
    let utc_offset_hours = offset_seconds as f64 / 3600.0;

    let decimal_hour =
        utc.hour() as f64 + utc.minute() as f64 / 60.0 + utc.second() as f64 / 3600.0;
    let jd = handler_swe08::julday(
        utc.year(),
        utc.month() as i32,
        utc.day() as i32,
        decimal_hour,
        Calandar::Gregorian,
    );

    Ok((jd, utc_offset_hours))
}

/// Determina em qual casa (1..12) cai uma longitude, dadas as 12 cúspides.
fn house_of(lon: f64, cusps: &[f64; 13]) -> u8 {
    for i in 1..=12 {
        let start = cusps[i];
        let end = cusps[if i == 12 { 1 } else { i + 1 }];
        if in_arc(lon, start, end) {
            return i as u8;
        }
    }
    1
}

/// true se `x` está no arco que vai de `start` a `end` no sentido dos signos.
fn in_arc(x: f64, start: f64, end: f64) -> bool {
    let span = (end - start).rem_euclid(360.0);
    let offset = (x - start).rem_euclid(360.0);
    offset < span
}

/// Separação angular mínima entre duas longitudes, em [0, 180].
fn angular_separation(a: f64, b: f64) -> f64 {
    let d = (a - b).rem_euclid(360.0);
    if d > 180.0 {
        360.0 - d
    } else {
        d
    }
}

/// Calcula todos os aspectos maiores entre os pares de planetas.
fn compute_aspects(planets: &[PlanetPosition]) -> Vec<Aspect> {
    let mut aspects = Vec::new();
    const DT: f64 = 0.05; // ~1h12 em dias, para estimar aplicativo/separativo

    for i in 0..planets.len() {
        for j in (i + 1)..planets.len() {
            let a = &planets[i];
            let b = &planets[j];
            let sep = angular_separation(a.position.longitude, b.position.longitude);

            // Escolhe o aspecto maior cujo orbe é o menor e está dentro do limite.
            let mut best: Option<(&str, u16, f64)> = None;
            for (name, angle, max_orb) in MAJOR_ASPECTS {
                let orb = (sep - *angle as f64).abs();
                if orb <= *max_orb {
                    match best {
                        Some((_, _, best_orb)) if best_orb <= orb => {}
                        _ => best = Some((name, *angle, orb)),
                    }
                }
            }

            if let Some((name, angle, orb)) = best {
                let sep_next = angular_separation(
                    a.position.longitude + a.speed * DT,
                    b.position.longitude + b.speed * DT,
                );
                let orb_next = (sep_next - angle as f64).abs();
                aspects.push(Aspect {
                    from: a.body.clone(),
                    to: b.body.clone(),
                    aspect: name.to_string(),
                    angle,
                    orb,
                    orb_bucket: OrbBucket::from_orb(orb),
                    applying: orb_next < orb,
                });
            }
        }
    }

    // Aspectos mais exatos primeiro.
    aspects.sort_by(|x, y| x.orb.partial_cmp(&y.orb).unwrap_or(std::cmp::Ordering::Equal));
    aspects
}

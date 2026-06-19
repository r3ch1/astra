//! Testes de precisão do mapa natal.
//!
//! Caso de referência: dado de nascimento real usado como fixture padrão do
//! projeto — 04/12/1987 20:20, Rio de Janeiro/RJ. O ponto mais sensível é o
//! fuso: em dez/1987 o Brasil estava em horário de verão (BRST = UTC−2), e não
//! UTC−3. Valores VALIDADOS contra o Astro.com (tropical, Placidus, Nodo
//! Verdadeiro), que reporta Univ.Time 22:20 — confirmando o offset −2.
//!
//! Coordenadas idênticas às do Astro.com para o Rio: 43w12'27 / 22s54'10
//! (−43.20750 / −22.90278). Com elas, Asc/MC batem no arco-minuto.
//!
//! Referência Astro.com (grau°min'seg"):
//! ```text
//! Sol     12 Sag 13'45"     Asc  24 Gem 56'00"
//! Lua      7 Gem 31'06"     MC    5 Ari 25'59"
//! Mercúrio 2 Sag 07'21"
//! Vênus    8 Cap 30'45"     Saturno 22 Sag 16'41"
//! Marte    7 Sco 03'56"     Urano   26 Sag 01'55"  (conjunção Saturno–Urano)
//! Júpiter 19 Ari 57'29" r   Netuno   6 Cap 47'02"
//! Plutão  11 Sco 09'15"     Nodo N  29 Psc 34'41"
//! Chiron  26 Gem 49'51" r   (requer arquivos .se1; pulado no modo Moshier)
//! ```

use astra_calculator::{compute_natal_chart, BirthInput};

/// Fixture: dado de nascimento de referência do projeto.
fn heric() -> BirthInput {
    BirthInput {
        name: Some("Heric".into()),
        year: 1987,
        month: 12,
        day: 4,
        hour: 20,
        minute: 20,
        second: 0,
        timezone: "America/Sao_Paulo".into(),
        // Coordenadas do Rio idênticas às do Astro.com (43w12'27 / 22s54'10).
        latitude: -22.90278,
        longitude: -43.20750,
        house_system: 'P',
    }
}

fn planet<'a>(chart: &'a astra_calculator::NatalChart, body: &str) -> &'a astra_calculator::PlanetPosition {
    chart
        .planets
        .iter()
        .find(|p| p.body == body)
        .unwrap_or_else(|| panic!("planeta {body} ausente do mapa"))
}

#[test]
fn aplica_horario_de_verao_historico() {
    let chart = compute_natal_chart(heric()).expect("cálculo deve suceder");
    // Dez/1987: horário de verão brasileiro vigente → UTC−2.
    assert_eq!(chart.utc_offset_hours, -2.0, "offset deveria ser BRST (−2)");
}

#[test]
fn fora_do_horario_de_verao_usa_utc_menos_3() {
    // Junho = inverno no Brasil, sem horário de verão → UTC−3.
    let mut input = heric();
    input.month = 6;
    let chart = compute_natal_chart(input).expect("cálculo deve suceder");
    assert_eq!(chart.utc_offset_hours, -3.0, "offset deveria ser BRT (−3)");
}

#[test]
fn posicoes_planetarias_batem_com_referencia() {
    let chart = compute_natal_chart(heric()).expect("cálculo deve suceder");
    let tol = 0.03; // graus (~1.8 arcmin) — Moshier vs Swiss, validado vs Astro.com

    // Graus dentro do signo, convertidos dos valores arcsec do Astro.com.
    let casos = [
        ("Sun", "Sagittarius", 12.2292),
        ("Moon", "Gemini", 7.5183),
        ("Mercury", "Sagittarius", 2.1225),
        ("Venus", "Capricorn", 8.5125),
        ("Mars", "Scorpio", 7.0656),
        ("Jupiter", "Aries", 19.9581),
        ("Saturn", "Sagittarius", 22.2781),
        ("Uranus", "Sagittarius", 26.0319),
        ("Neptune", "Capricorn", 6.7839),
        ("Pluto", "Scorpio", 11.1542),
    ];

    for (body, sign, sign_degree) in casos {
        let p = planet(&chart, body);
        assert_eq!(p.position.sign, sign, "{body} deveria estar em {sign}");
        let diff = (p.position.sign_degree - sign_degree).abs();
        assert!(
            diff < tol,
            "{body}: grau {:.3} fora da referência {sign_degree} (Δ={diff:.3})",
            p.position.sign_degree
        );
    }
}

#[test]
fn ascendente_e_meio_do_ceu() {
    let chart = compute_natal_chart(heric()).expect("cálculo deve suceder");
    // Astro.com: Asc 24°56'00" Gem, MC 5°25'59" Ari (com coordenadas idênticas).
    assert_eq!(chart.angles.ascendant.sign, "Gemini");
    assert!((chart.angles.ascendant.sign_degree - 24.9333).abs() < 0.02);
    assert_eq!(chart.angles.midheaven.sign, "Aries");
    assert!((chart.angles.midheaven.sign_degree - 5.4331).abs() < 0.02);
}

#[test]
fn casas_angulares_coincidem_com_os_angulos() {
    let chart = compute_natal_chart(heric()).expect("cálculo deve suceder");
    assert_eq!(chart.houses.len(), 12);

    let casa1 = &chart.houses[0];
    let casa10 = &chart.houses[9];
    assert!(
        (casa1.position.longitude - chart.angles.ascendant.longitude).abs() < 1e-6,
        "cúspide da casa 1 deve igualar o Ascendente"
    );
    assert!(
        (casa10.position.longitude - chart.angles.midheaven.longitude).abs() < 1e-6,
        "cúspide da casa 10 deve igualar o Meio do Céu"
    );
}

#[test]
fn detecta_conjuncao_saturno_urano() {
    let chart = compute_natal_chart(heric()).expect("cálculo deve suceder");
    let tem = chart.aspects.iter().any(|a| {
        a.aspect == "Conjunction"
            && ((a.from == "Saturn" && a.to == "Uranus")
                || (a.from == "Uranus" && a.to == "Saturn"))
    });
    assert!(tem, "deveria haver conjunção Saturno–Urano");
}

#[test]
fn retrogradacao_detectada() {
    let chart = compute_natal_chart(heric()).expect("cálculo deve suceder");
    assert!(planet(&chart, "Jupiter").retrograde, "Júpiter retrógrado");
    assert!(!planet(&chart, "Sun").retrograde, "Sol nunca retrograda");
}

#[test]
fn fuso_invalido_retorna_erro() {
    let mut input = heric();
    input.timezone = "Marte/Olympus_Mons".into();
    assert!(compute_natal_chart(input).is_err());
}

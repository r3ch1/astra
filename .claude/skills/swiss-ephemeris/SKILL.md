---
name: swiss-ephemeris
description: Como trabalhar com Swiss Ephemeris via FFI em Rust. Use quando estiver implementando ou modificando o motor de cálculo astrológico em packages/calculator.
allowed-tools: Read, Write, Bash, Grep
---

# Swiss Ephemeris — Motor de Cálculo

## Quando Usar
- Implementar cálculo de posições planetárias
- Modificar bindings FFI com a lib C
- Adicionar suporte a novos tipos de cálculo (casas, aspectos, asteroides)
- Debugar imprecisões nos resultados

## Estrutura do Módulo

```
packages/calculator/
├── src/
│   ├── lib.rs           # API pública do módulo
│   ├── ephemeris.rs     # Bindings FFI com Swiss Ephemeris
│   ├── houses.rs        # Cálculo de casas astrológicas
│   ├── aspects.rs       # Cálculo de aspectos entre planetas
│   └── generated/       # NÃO EDITAR — gerado automaticamente
├── build.rs             # Script de build (liga a lib C)
├── Cargo.toml
└── ephemeris_data/      # Arquivos .se1 (dados de efemérides)
```

## Padrão de Binding FFI

```rust
extern "C" {
    fn swe_calc_ut(
        tjd_ut: f64,
        ipl: i32,
        iflag: i32,
        xx: *mut f64,
        serr: *mut i8,
    ) -> i32;
}

pub fn calc_planet(julian_day: f64, planet_id: i32) -> Result<PlanetPosition, String> {
    let mut positions = [0.0f64; 6];
    let mut error = [0i8; 256];
    unsafe {
        let result = swe_calc_ut(
            julian_day, planet_id,
            SEFLG_SWIEPH | SEFLG_SPEED,
            positions.as_mut_ptr(),
            error.as_mut_ptr(),
        );
        if result < 0 {
            let err = CStr::from_ptr(error.as_ptr()).to_string_lossy();
            return Err(err.to_string());
        }
    }
    Ok(PlanetPosition {
        longitude: positions[0],
        latitude: positions[1],
        distance: positions[2],
        speed: positions[3],
    })
}
```

## IDs dos Planetas

```rust
pub const SE_SUN: i32 = 0;
pub const SE_MOON: i32 = 1;
pub const SE_MERCURY: i32 = 2;
pub const SE_VENUS: i32 = 3;
pub const SE_MARS: i32 = 4;
pub const SE_JUPITER: i32 = 5;
pub const SE_SATURN: i32 = 6;
pub const SE_URANUS: i32 = 7;
pub const SE_NEPTUNE: i32 = 8;
pub const SE_PLUTO: i32 = 9;
pub const SE_TRUE_NODE: i32 = 11;  // Nodo Norte
```

## Validação de Precisão

```bash
cargo test -- --nocapture
# Tolerância máxima: 0.001° (arco-segundo)
# Comparar resultados com Astro.com após qualquer mudança nos bindings
```

## Importante

- Arquivos `.se1` devem estar em `ephemeris_data/` — sem eles os cálculos falham silenciosamente
- Julian Day é calculado a partir de UTC — sempre converter o fuso antes

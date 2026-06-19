# astra-calculator

Motor de cálculo astrológico do Astra — mapas natais de precisão via
**Swiss Ephemeris** (libswe, FFI em Rust).

## Uso (CLI)

A CLI lê um `BirthInput` em JSON (arquivo ou stdin) e imprime o `NatalChart`:

```bash
echo '{
  "name": "Heric",
  "year": 1987, "month": 12, "day": 4,
  "hour": 20, "minute": 20,
  "timezone": "America/Sao_Paulo",
  "latitude": -22.9068, "longitude": -43.1729
}' | cargo run --quiet

# ou
cargo run --release -- dados.json --compact
```

Campos de entrada: `year, month, day, hour, minute` (obrigatórios),
`second` (0), `timezone` (IANA), `latitude`, `longitude`, `house_system`
(`'P'` Placidus, padrão), `name` (opcional).

## Fuso horário

A hora informada é **civil local**. O fuso IANA (ex: `America/Sao_Paulo`)
resolve automaticamente o **horário de verão histórico** — crítico para datas
brasileiras: 04/12/1987 caiu em horário de verão (BRST = UTC−2, não UTC−3).

## Precisão / efemérides

- **Padrão:** efemérides analíticas de **Moshier** — sem arquivos de dados,
  precisão de ~arco-segundo para a era moderna.
- **Máxima precisão:** aponte `ASTRA_EPHE_PATH` para os arquivos `.se1` do
  Swiss Ephemeris (`sepl_*.se1`, `semo_*.se1`, `seas_*.se1`) para precisão de
  arco-segundo e corpos extras (ex: Chiron). Os `.se1` **não** são versionados
  (ver `.gitignore`).

```bash
ASTRA_EPHE_PATH=/caminho/para/ephe cargo run -- dados.json
```

## Testes

```bash
cargo test
```

O caso de referência (`tests/natal_chart.rs`) trava as posições do mapa de
04/12/1987 20:20 (Rio) cruzadas com o Astro.com — incluindo a aplicação
correta do horário de verão e a conjunção Saturno–Urano de 1987–88.

## Regras do projeto

- Nunca editar `src/generated/` (quando existir — código gerado).
- Nunca alterar os bindings FFI sem rodar `cargo test`.

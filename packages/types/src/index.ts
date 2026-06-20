/**
 * Tipos compartilhados do Astra.
 *
 * Este arquivo é o espelho TypeScript do contrato JSON produzido pelo motor de
 * cálculo em Rust (`packages/calculator/src/types.rs`). As chaves usam
 * `snake_case` porque é assim que o `serde` serializa os campos — qualquer
 * divergência quebra a desserialização no frontend/API.
 *
 * Ao evoluir os tipos do Rust, evoluir aqui também (e vice-versa).
 */

/** Os 12 signos do zodíaco, em ordem (índice 0 = Áries). */
export const SIGNS = [
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
] as const;

/** Um signo do zodíaco. */
export type Sign = (typeof SIGNS)[number];

/** Fonte de efemérides usada no cálculo. */
export type Ephemeris = "swiss" | "moshier";

/**
 * Faixa de orbe de um aspecto, conforme estratégia de cache do projeto.
 * Serializada em minúsculas pelo Rust (`rename_all = "lowercase"`).
 */
export type OrbBucket = "exato" | "forte" | "moderado" | "fraco";

/**
 * Dados de nascimento de entrada (hora civil local + fuso IANA).
 *
 * `name`, `second` e `house_system` são opcionais na entrada; o motor aplica
 * os defaults (`second = 0`, `house_system = "P"`) e os ecoa sempre presentes
 * dentro do {@link NatalChart}.
 */
export interface BirthInput {
  /** Nome opcional (apenas ecoado na saída). */
  name?: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Padrão 0. */
  second?: number;
  /** Fuso IANA, ex: "America/Sao_Paulo". Resolve horário de verão histórico. */
  timezone: string;
  latitude: number;
  longitude: number;
  /** Letra do sistema de casas Swiss Ephemeris. Padrão "P" (Placidus). */
  house_system?: string;
}

/** Uma posição zodiacal decomposta em signo + grau dentro do signo. */
export interface ZodiacPosition {
  /** Longitude eclíptica absoluta [0, 360). */
  longitude: number;
  sign: Sign;
  /** Grau dentro do signo [0, 30). */
  sign_degree: number;
  /** Representação legível, ex: "12°13'". */
  formatted: string;
}

/**
 * Um corpo celeste posicionado no mapa.
 *
 * No Rust o `ZodiacPosition` é achatado (`serde(flatten)`) dentro deste tipo,
 * então os campos de posição aparecem no mesmo nível do objeto.
 */
export interface PlanetPosition extends ZodiacPosition {
  body: string;
  latitude: number;
  /** Velocidade em longitude (graus/dia). Negativa = retrógrado. */
  speed: number;
  retrograde: boolean;
  /** Número da casa (1..12) em que o corpo se encontra. */
  house: number;
}

/** Cúspide de casa. O `ZodiacPosition` é achatado dentro deste tipo. */
export interface HouseCusp extends ZodiacPosition {
  number: number;
}

/** Os quatro ângulos principais do mapa. */
export interface Angles {
  ascendant: ZodiacPosition;
  midheaven: ZodiacPosition;
  descendant: ZodiacPosition;
  imum_coeli: ZodiacPosition;
}

/** Aspecto entre dois corpos. */
export interface Aspect {
  from: string;
  to: string;
  aspect: string;
  /** Ângulo exato do aspecto (0, 60, 90, 120, 180...). */
  angle: number;
  /** Desvio absoluto do ângulo exato, em graus. */
  orb: number;
  orb_bucket: OrbBucket;
  /** true = aplicativo (se formando), false = separativo. */
  applying: boolean;
}

/** Resultado completo do cálculo do mapa natal. */
export interface NatalChart {
  input: BirthInput;
  /** Offset UTC efetivo aplicado (horas), já considerando horário de verão. */
  utc_offset_hours: number;
  julian_day_ut: number;
  ephemeris: Ephemeris;
  planets: PlanetPosition[];
  houses: HouseCusp[];
  angles: Angles;
  aspects: Aspect[];
}

# ✦ ASTRA — Briefing de Design
**Para:** Claude Designer
**De:** Equipe Astra
**Objetivo:** Criar o layout das 3 telas fundacionais do produto

---

## Contexto Rápido

Astra é uma plataforma de mapas astrológicos com IA. O usuário informa data, hora e local de nascimento — o app gera um mapa natal preciso (usando Swiss Ephemeris, a mesma lib do Astro.com) e a IA interpreta esse mapa em linguagem acessível, cruzando com a vida real do usuário para gerar metas de autoconhecimento.

**O produto existe como web app e desktop (Tauri + React).**

Você vai desenhar as **3 telas que precisamos antes de começar a codar**. O resto pode evoluir durante o desenvolvimento — essas 3 são bloqueantes porque definem como o SVG do mapa precisa ser construído e qual é a primeira impressão do produto.

---

## Identidade Visual — Leia com atenção

### A referência de mundo

> **Observatório astronômico do século XVIII encontra carta náutica celestial — operado com ferramentas do século XXI.**

Não é horóscopo de revista. Não é app de bem-estar genérico. Não é misticismo de cristal. É preciso, contemplativo, elevado.

### Paleta de cores

| Nome | Hex | Uso |
|---|---|---|
| Deep Violet | `#1A0A2E` | Background principal — o céu |
| Midnight Blue | `#0D1B4B` | Cards, backgrounds secundários |
| Cosmic Purple | `#4B2D8A` | Destaques, bordas ativas, CTAs secundários |
| Celestial Gold | `#C9A84C` | Acentos, glyphs planetários, CTAs primários |
| Moon Silver | `#B8C0D4` | Textos secundários, linhas de aspecto, elementos discretos |
| Off White | `#F0EEF8` | Texto principal sobre fundos escuros |

**Modo padrão: escuro.** Modo claro é opcional e secundário.

### Tipografia

| Papel | Família |
|---|---|
| Display / Títulos grandes | Playfair Display |
| Interface / Corpo de texto | Inter |
| Dados astronômicos (graus, coordenadas) | JetBrains Mono |

### O que evitar — sem exceções

- ❌ Gradientes arco-íris ou paleta pastel
- ❌ Fontes script/cursivas (tipo caligráfica)
- ❌ Estrelinhas ✨ decorativas em excesso
- ❌ Estética "cristal", "chakra", "boho"
- ❌ Cards com bordas arredondadas genéricas ao estilo Material Design
- ❌ Qualquer coisa que pareça template de Figma community gratuito

### O que buscar

- ✅ Profundidade e contraste — o fundo escuro deve parecer o espaço, não uma tela preta
- ✅ Detalhes dourados usados com parcimônia — ouro que aparece muito deixa de ser ouro
- ✅ Tipografia serifada nos títulos cria gravidade e seriedade
- ✅ Espaçamento generoso — o produto respira, não sufoca
- ✅ Sensação de instrumento de precisão, não de app de entretenimento

---

## As 3 Telas

---

### TELA 1 — Landing Page (Web)

**Objetivo:** Converter visitante em alguém que calcula o mapa. Uma única ação.

#### Hero Section
- Fundo: Deep Violet com estrelas sutis — **não animadas no mockup, mas pense nelas como se fossem ter parallax lento**
- Elemento visual central: um mapa astrológico SVG parcialmente visível, como se estivesse "emergindo" do fundo — não um mapa completo, mais uma evocação
- **Headline principal:** `"Seu céu no momento em que você chegou."` — Playfair Display, grande, Off White
- **Subheadline:** uma linha só, Inter Regular, Moon Silver — algo como *"Mapa natal de precisão astronômica. Interpretado por IA. Gratuito para começar."*
- **CTA único:** botão primário dourado — `"Calcular meu mapa"` — centralizado, sem distração

#### Seção de Credibilidade (abaixo do fold)
Três pilares lado a lado, ícones simples (não emoji), texto curto:
- 🔭 **Swiss Ephemeris** — a mesma precisão do Astro.com
- 🔓 **Código auditável** — open source no GitHub
- 🤖 **IA contextual** — interpreta seu mapa, não um horóscopo genérico

#### Seção de Preços
Três cards simples: **Free · Pro · Profissional**
- Free: R$ 0
- Pro: R$ 17,90/mês ou R$ 149/ano
- Profissional: R$ 44,90/mês
- Sem asteriscos, sem letras miúdas, sem "a partir de"
- Card Pro com destaque visual sutil (borda dourada)

#### Rodapé
Minimal — logo, links essenciais, "Código aberto sob AGPL v3"

---

### TELA 2 — Entrada de Dados (Onboarding)

**Objetivo:** Usuário preenche os dados e sente que algo especial está prestes a acontecer.

#### Estrutura
- Fundo Deep Violet, bem limpo — nada competindo com o formulário
- Formulário centralizado, largura máxima ~480px
- Título acima do form: `"Onde você estava quando nasceu?"` — Playfair Display, tamanho médio
- Subtítulo: *"Precisamos do momento exato para calcular seu mapa com precisão astronômica."* — Inter, Moon Silver, pequeno

#### Campos do formulário (nessa ordem)
1. **Nome** — como você quer ser chamado
2. **Data de nascimento** — date picker elegante, não o nativo do browser
3. **Horário de nascimento** — time picker, com nota discreta: *"Quanto mais preciso, mais preciso o Ascendente"*
4. **Cidade de nascimento** — campo com autocomplete (dropdown de sugestões)
5. Abaixo da cidade: confirmação automática do fuso horário detectado — `"Fuso detectado: America/Sao_Paulo (UTC-3)"` — texto pequeno, Moon Silver

#### Botão de submit
- Grande, dourado, texto: `"Revelar meu mapa"`
- Abaixo do botão: `"Sem cadastro obrigatório"` — texto minúsculo, discreto, Moon Silver

#### Estado de loading (após submit)
- Tela de transição: fundo escuro, mapa girando lentamente ao centro (só o círculo vazio, os planetas vão se posicionando um a um)
- Texto embaixo alternando suavemente: *"Calculando posições planetárias..."* → *"Posicionando os planetas..."* → *"Seu mapa está pronto."*
- Isso não é um spinner genérico — é parte da experiência

---

### TELA 3 — Tela Principal do Mapa Natal

**Objetivo:** O usuário vê o mapa e sente que aquilo foi feito para ele. É a tela mais importante do produto.

#### Layout Desktop (referência principal)
Split em duas colunas:
- **Coluna esquerda (~60% da largura):** o mapa SVG
- **Coluna direita (~40%):** painel de informações e interação

#### O Mapa SVG (coluna esquerda)

Esse é o elemento mais crítico do briefing. Precisa parecer desenhado, não gerado.

**Estrutura do círculo:**
- Anel externo: 12 setores do zodíaco, cada um com seu glyph (símbolo) e nome em Playfair Display pequeno
- Anel intermediário: divisão das 12 casas astrológicas — linhas finas em Moon Silver (0.5px)
- Centro: espaço vazio ou com símbolo sutil do Astra

**Planetas:**
- Posicionados no círculo nos graus corretos
- Glyph de cada planeta em Celestial Gold (`☉ ☽ ♂ ♀ ♃ ♄ ♅ ♆ ♇`)
- Tamanho do glyph: uniforme, mas com leve hierarquia (Sol e Lua ligeiramente maiores)
- Linha radial fina conectando o glyph à posição exata no anel do zodíaco

**Linhas de aspecto (no interior do círculo):**
- Conjunção: Celestial Gold, linha contínua
- Trígono: `#4A7A9B` (azul suave), linha contínua
- Quadratura: `#7A2D4B` (rose escuro), linha contínua
- Sextil: `#1A6B6B` (teal), linha tracejada
- Oposição: Moon Silver, linha pontilhada
- Espessura: 0.8px para aspectos exatos, 0.4px para aspectos fracos

**Hover no mapa:**
- Hover em planeta: highlight dourado + tooltip com nome, grau exato, signo, casa
- Hover em linha de aspecto: highlight + tooltip com tipo do aspecto e orbe
- Tudo com transição suave (200ms)

#### Painel direito

**Parte superior — Dados do mapa:**
```
MAPA NATAL DE [NOME]
[Data] às [Hora] · [Cidade]

☉ Sol      Escorpião   Casa 8   15°23'
☽ Lua      Peixes      Casa 12   3°44'
↑ Asc      Áries
...
```
Fonte monospace para os dados astronômicos. Cada linha clicável — ao clicar, abre interpretação.

**Parte do meio — Botões de área de vida:**
Seis botões compactos em grid 2×3 ou linha horizontal:
`Carreira` · `Amor` · `Propósito` · `Saúde` · `Finanças` · `Família`

Ao clicar em um, o painel se transforma na leitura daquela área.

**Parte inferior — CTA de leitura:**
- Botão: `"Ver leitura completa"` — abre a síntese narrativa completa abaixo ou em painel expandido
- Botão secundário: `"Compartilhar mapa"` — gera imagem para download

#### Layout Mobile
- Mapa ocupa 100% da largura, altura ~50vh
- Abaixo do mapa: tabs horizontais scrolláveis (Planetas · Casas · Aspectos · Áreas)
- Botão de leitura completa fixo no bottom

---

## Entregáveis Esperados

Para cada tela:
1. **Layout desktop** (largura de referência: 1440px)
2. **Layout mobile** (375px) — ao menos para a Tela 3
3. **Um estado de hover/interação** relevante por tela

Se possível, entregue também:
- Uma proposta de como o **loading do mapa** (Tela 2 → Tela 3) poderia parecer
- Sugestão de como o **mapa SVG se parece em mini** (para o dashboard e sinastria)

---

## Referências de Mood (descreva, não copie)

- Cartas náuticas antigas — a precisão e seriedade dos instrumentos
- Interface do Astro.com — referência técnica, mas o Astra precisa ser muito mais bonito
- Observatórios astronômicos — a escuridão como elemento visual, não ausência de design
- Fontes de relógio de bolso ou sextante — detalhes dourados em fundo escuro

---

## Uma última coisa

O Astra precisa parecer que **respeita o usuário**. Não tenta impressionar com efeitos. Não tenta parecer mágico com gradientes. A seriedade do produto é o design. A precisão dos cálculos é o design. O silêncio visual é o design.

Quem abrir o Astra deve sentir que está usando algo feito com cuidado — não mais um app de horóscopo.

---

*✦ ☽ ✦*
*Astra Design Briefing · v1.0 · Junho 2025*

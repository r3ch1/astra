# ✦ ☽ ASTRA ✦
**Plataforma de Mapas Astrológicos com IA**
*Documento de Projeto — Design & Arquitetura · v2.1*

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Funcionalidades do Produto](#3-funcionalidades-do-produto)
4. [Diretrizes de Design](#4-diretrizes-de-design)
5. [Modelo de Negócio e Precificação](#5-modelo-de-negócio-e-precificação)
6. [Crescimento Orgânico e Viralidade](#6-crescimento-orgânico-e-viralidade)
7. [Estratégia Open Source](#7-estratégia-open-source)
8. [Roadmap de Desenvolvimento](#8-roadmap-de-desenvolvimento)

---

## 1. Visão Geral do Produto

Astra é uma plataforma de mapas astrológicos que combina cálculos astronômicos de precisão profissional com interpretações geradas por inteligência artificial. O produto existe simultaneamente como aplicativo desktop (Tauri) e interface web, compartilhando backend e dados.

A proposta central é ir além do horóscopo descartável: o mapa natal não é destino — é um mapa de possibilidades. A vida real é o terreno. Astra conecta os dois, oferecendo um espaço dialógico onde o usuário narra sua vida e a IA cruza esse relato com o mapa para gerar insights acionáveis e metas concretas de desenvolvimento pessoal.

> **"O mapa é o território das possibilidades. A vida é o terreno real. Astra é a bússola entre os dois."**

### 1.1 Proposta de Valor Central

> Mapa natal preciso + leitura personalizada por área de vida + sistema de metas alinhadas ao potencial do mapa — disponível no navegador e no desktop, com viralidade nativa via compartilhamento de sinastria.

### 1.2 Filosofia do Produto

O mapa astrológico é tratado como um GPS de potencialidades, não como profecia. Cada pessoa nasce com um conjunto de energias e tendências — o mapa revela o caminho de menor resistência para o desenvolvimento pleno. A vida impõe desvios, mas o caminho permanece disponível.

Astra ajuda o usuário a entender onde está, para onde seu mapa aponta, e quais passos concretos aproximam os dois.

### 1.3 Público-Alvo

| Perfil | Necessidade Principal | Frequência de Uso |
|---|---|---|
| Iniciantes em astrologia | Entender o próprio mapa sem precisar estudar anos | Alta — leitura inicial + revisitas |
| Praticantes intermediários | Trânsitos, sinastria, previsões por área de vida | Média — consultas periódicas |
| Pessoas em transição de vida | Orientação em carreira, relacionamentos, propósito | Alta — uso ativo do sistema de metas |
| Astrólogos profissionais | Ferramenta de cálculo precisa + relatórios para clientes | Alta — uso diário |
| Curiosos sociais | Compartilhar sinastria com amigos, experiência visual | Baixa — uso pontual e viral |

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Desktop | Tauri v2 + React | App nativo leve, Rust no core, mesmo frontend do web |
| Web Frontend | Next.js (React) | SSR para SEO, reutiliza componentes do desktop |
| API / Backend | Node.js + Fastify | I/O bound — performance equivalente, stack familiar |
| Motor de Cálculo | Rust + Swiss Ephemeris (FFI) | Precisão de arco-segundo, padrão da indústria, auditável |
| Banco de Dados | PostgreSQL | Mapas, usuários, cache de interpretações, diário pessoal |
| IA / LLM | OpenRouter (multi-modelo) | Flexibilidade de modelo por caso de uso, custo controlado |
| Infra | Railway ou Fly.io | Deploy simples, escalável conforme crescimento |
| Auth | Google OAuth + email/senha | Google cobre 90% dos casos, sem burocracia de API do Instagram |

### 2.2 Fluxo de Dados — Mapa Natal

```
① Entrada de dados
   Usuário informa nome, data de nascimento, horário e cidade

② Geocoding
   Backend resolve a cidade em coordenadas (lat/lon) e fuso horário

③ Cálculo astronômico
   Serviço Rust chama Swiss Ephemeris
   → posições planetárias, casas, aspectos

④ Persistência
   JSON estruturado salvo no perfil do usuário no PostgreSQL

⑤ Renderização
   Frontend recebe o JSON e renderiza o mapa SVG interativo

⑥ Interpretação IA
   Leituras por área geradas sob demanda, com cache granular por posição
```

### 2.3 Fluxo de Dados — Leitura por Área de Vida

```
① Usuário seleciona uma área
   Ex: Carreira, Relacionamentos, Propósito, Saúde, Finanças

② App exibe o potencial do mapa nessa área
   Planetas e casas relevantes com interpretações cacheadas

③ Usuário narra sua realidade atual
   Campo livre: como está a carreira hoje, bloqueios, conquistas recentes

④ IA cruza relato com o mapa
   Identifica convergências e divergências entre terreno real e potencial

⑤ Geração de insights personalizados
   "Você mencionou dificuldade com autoridade —
    isso ressoa com Saturno quadratura Sol..."

⑥ Metas concretas alinhadas ao mapa
   3–5 ações específicas para aproximar a vida atual do potencial mapeado

⑦ Registro no diário astrológico
   Relato e metas salvos — base para acompanhamento de evolução
```

### 2.4 Estratégia de Cache

O cache opera em granularidade de posição, não de mapa completo. Dois mapas com a mesma configuração "Sol em Escorpião, Casa 8" compartilham essa interpretação — independente de serem pessoas diferentes.

```
Chave do cache = SHA-256(
  posição + signo + casa + orbe_bucket + prompt_version + model_id
)
```

**Regras:**
- Versão do prompt invalida o cache de forma natural ao evoluir
- Relatos pessoais e sínteses narrativas **não são cacheados** — são únicos por pessoa
- Orbe agrupado em faixas: `exato ≤1°` · `forte ≤3°` · `moderado ≤6°` · `fraco >6°`

### 2.5 Modelos de IA por Caso de Uso

| Tarefa | Modelo Recomendado | Cacheável? |
|---|---|---|
| Interpretações individuais de posição | DeepSeek V3 / Gemini Flash | ✅ por posição+versão |
| Síntese narrativa do mapa completo | Claude Sonnet | ✅ salva no perfil |
| Cruzamento relato pessoal × mapa | Claude Sonnet | ❌ único por pessoa e momento |
| Geração de metas | Claude Sonnet | ❌ único por pessoa e momento |
| Trânsitos e previsões | Claude Sonnet / Gemini 2.5 Pro | Parcial — por período e mapa |
| Resumos e notificações push | Gemini Flash | ✅ por trânsito e signo |

---

## 3. Funcionalidades do Produto

### 3.1 MVP — Versão 1.0

| Funcionalidade | Descrição | Prioridade |
|---|---|---|
| Mapa Natal | Cálculo Swiss Ephemeris, renderização SVG interativa, tooltip por elemento | P0 |
| Leitura por Área de Vida | Carreira, relacionamentos, propósito — com relato do usuário e metas IA | P0 |
| Sistema de Metas | Metas geradas pela IA, acompanhamento de progresso, histórico | P0 |
| Conta de usuário | Google OAuth + email, histórico de mapas e diário salvos | P0 |
| Acesso Web | Interface responsiva no navegador, sem instalação | P0 |
| Compartilhamento de Mapa | Imagem gerada do mapa natal para compartilhar em redes sociais | P0 |
| App Desktop | Versão Tauri para Windows, macOS e Linux | P1 |
| Sinastria | Comparação entre dois mapas com imagem compartilhável | P1 |
| Trânsitos | Posições atuais sobre o mapa natal, interpretação e alertas | P1 |
| Diário Astrológico | Histórico de relatos por área, evolução das metas, linha do tempo | P1 |
| Previsões | Janelas favoráveis baseadas em trânsitos futuros + metas da IA | P2 |
| Relatório PDF | Exportação da leitura completa em PDF formatado e elegante | P2 |

### 3.2 Leituras por Área de Vida

| Área | Âncoras Astrológicas | O que o usuário narra |
|---|---|---|
| Carreira & Propósito Profissional | Casa 10, MC, Saturno, Marte, Sol | Trabalho atual, bloqueios, ambições, relação com autoridade |
| Relacionamentos & Amor | Casa 7, Vênus, Lua, Descendente | Padrões que se repetem, o que busca, vínculos atuais |
| Propósito de Vida & Missão | Nodo Norte, Casa 9, Júpiter, Sol | O que sente que deveria estar fazendo, onde encontra sentido |
| Saúde & Energia Vital | Casa 6, Marte, Sol, Ascendente | Rotina, onde perde energia, hábitos, corpo |
| Finanças & Abundância | Casa 2, Casa 8, Vênus, Plutão | Relação com dinheiro, padrões de ganho e perda, bloqueios |
| Família & Raízes | Casa 4, Lua, Saturno, IC | Origem, dinâmicas familiares, lar, senso de pertencimento |

### 3.3 Sistema de Metas — "Eu-Total"

O conceito de **Eu-Total** é o diferencial filosófico do produto: o mapa natal representa o potencial máximo de desenvolvimento da pessoa — seu eu em plena expressão. O sistema de metas cria um caminho incremental entre onde a pessoa está e esse potencial.

**O papel do Nodo Norte**

O Nodo Norte na astrologia humanista representa a direção de crescimento da alma — o que a pessoa veio desenvolver nessa vida. É o eixo central do sistema de metas do Astra.

> *Exemplo — Nodo Norte em Áries, Casa 1:*
> "Seu caminho é desenvolver autonomia e iniciativa. Você tende a depender da validação dos outros (Nodo Sul em Libra) — isso é seu ponto de partida, não seu destino. Cada decisão tomada por conta própria é um passo em direção ao seu eu-total."

**Estrutura de uma meta gerada:**

- **Âncora astrológica** — qual aspecto do mapa fundamenta a meta
- **Diagnóstico atual** — baseado no relato do usuário, onde está agora
- **Direção do mapa** — para onde o potencial aponta
- **Ação concreta** — algo específico e realizável em 7–30 dias
- **Indicador de progresso** — como o usuário saberá que avançou

**Loop de retenção:**

```
Gera metas → tenta cumprir → atualiza relato → novos insights
     ↑                                                ↓
Recebe alertas de trânsitos ←── novas metas geradas ←┘
```

Isso transforma o Astra num diário de autoconhecimento com feedback astrológico contínuo — completamente diferente de um app de horóscopo descartável.

### 3.4 Viralidade — Compartilhamento de Sinastria

**A imagem viral** contém:
- Os dois nomes e signos solares em destaque
- Mapa de sobreposição SVG convertido em PNG
- Os 3 aspectos mais relevantes entre os mapas
- Uma frase-síntese gerada pela IA
- URL do Astra discreta no rodapé

> Cada imagem compartilhada é aquisição de usuário gratuita. Co-Star cresceu de 7,5M para 30M de usuários entre 2020 e 2023 exatamente por esse mecanismo.

**Fluxo de sinastria:**

```
Usuário A (tem conta) → envia link de sinastria para Usuário B
                                         ↓
                    B insere data/hora/local (sem conta obrigatória)
                                         ↓
                         Sinastria exibida com leitura IA
                                         ↓
                    B é convidado a criar conta para salvar e ver mais
```

---

## 4. Diretrizes de Design

> Referência de mundo: **observatório astronômico encontra carta náutica celestial.**

### 4.1 Personalidade Visual

| Atributo | Direção correta | Evitar |
|---|---|---|
| Tom geral | Preciso, contemplativo, elevado | Místico genérico, emojis de estrela, fontes script |
| Textura | Profundidade escura com detalhes dourados | Gradientes rainbow, cristais, auras |
| Referências | Mapas celestes antigos, instrumentos de navegação | Horóscopos de revista, zodíaco colorido pop |
| Emoção | Maravilhamento + clareza + confiança | Ansiedade, nebulosidade, ornamentação excessiva |
| Postura | Ferramenta de autoconhecimento séria | App de entretenimento superficial |

### 4.2 Paleta de Cores

| Nome | Hex | Uso Principal |
|---|---|---|
| Deep Violet | `#1A0A2E` | Backgrounds principais, céu profundo |
| Midnight Blue | `#0D1B4B` | Backgrounds secundários, cards |
| Cosmic Purple | `#4B2D8A` | Destaques, bordas ativas, CTAs secundários |
| Celestial Gold | `#C9A84C` | Acentos, glyphs planetários, CTAs primários |
| Moon Silver | `#B8C0D4` | Textos secundários, linhas de aspecto |
| Off White | `#F0EEF8` | Texto principal em fundos escuros |

> Modo claro opcional: inversão com Deep Violet como acento sobre Off White. A paleta escura é o modo padrão e identidade principal.

### 4.3 Tipografia

| Papel | Família Sugerida | Uso |
|---|---|---|
| Display / Títulos | Playfair Display ou Georgia | Nome do produto, títulos de seção, nomes dos planetas |
| Corpo / Interface | Inter ou DM Sans | Textos de leitura, labels, navegação, relatos do usuário |
| Dados / Graus | JetBrains Mono ou IBM Plex Mono | Graus planetários — ex: `☉ 15°23'` |

### 4.4 O Mapa SVG — Elemento Central

O mapa astrológico não deve parecer gerado por algoritmo — deve parecer **desenhado à mão por um astrônomo do século XVIII com ferramentas do século XXI**.

- Círculo externo do zodíaco com 12 setores, glyph e nome em fonte serifada pequena
- Linhas de casa em Moon Silver (0.5px), discretas — estrutura sem dominar
- Linhas de aspecto coloridas por tipo:
  - Conjunção → Celestial Gold
  - Trígono → azul suave
  - Quadratura → rose (`#7A2D4B`)
  - Sextil → teal (`#1A6B6B`)
  - Oposição → Moon Silver
- Glyphs planetários em dourado, tamanho proporcional à relevância
- Hover → tooltip com nome + grau + interpretação de uma linha
- Clique → painel lateral com leitura IA completa
- Animação de entrada: planetas emergem do centro como um relógio sendo montado — sutil, não decorativa

### 4.5 Telas Principais

#### ① Landing Page
- Hero com mapa animado ao fundo — parallax de estrelas em movimento lento
- Headline honesta e curta. Sugestão: *"Seu céu no momento em que você chegou."*
- CTA único central: **"Calcular meu mapa"** — sem cadastro obrigatório na primeira vez
- Seção de credibilidade: Swiss Ephemeris · precisão de arco-segundo · código auditável no GitHub
- Prova social: imagens de mapas compartilhados, depoimentos curtos
- Preços simples: 3 tiers, sem asteriscos

#### ② Entrada de Dados (Onboarding)
- Formulário minimalista: nome, data, hora, cidade — nada mais nessa etapa
- Campo de cidade com autocomplete e geocoding — fuso horário resolvido automaticamente
- Fuso horário confirmado visualmente antes do submit
- Ao calcular: animação de "leitura do céu" antes de renderizar o mapa
- **Primeira experiência sem cadastro obrigatório** — mapa aparece, convite a criar conta vem depois

#### ③ Tela do Mapa Natal
- Mapa SVG central, grande, responsivo — protagonista absoluto
- Sidebar direita (desktop) / Tabs inferiores (mobile): lista de planetas, casas, aspectos
- Clique em planeta ou aspecto → painel lateral com interpretação IA
- Botão "Leitura Completa" → síntese narrativa em painel expandido
- Botões de área de vida abaixo do mapa: `Carreira` · `Amor` · `Propósito` · `Saúde` · `Finanças` · `Família`
- Botão "Compartilhar" → gera imagem para download/compartilhamento

#### ④ Tela de Leitura por Área *(tela mais única do produto)*
- **Bloco 1 — O que seu mapa diz:** interpretações das posições relevantes para essa área
- **Bloco 2 — Como está sua vida nessa área hoje?** campo de texto livre
- **Bloco 3 — Insights** (gerado pela IA após o relato): conexões entre relato e mapa
- **Bloco 4 — Metas para se aproximar do seu eu-total:** 3–5 ações concretas com prazo
- **Bloco 5 — Trânsitos atuais que afetam essa área:** o céu de hoje em contexto
- Histórico de relatos anteriores — linha do tempo de evolução

#### ⑤ Dashboard do Usuário
- Grid de mapas salvos com mini-preview SVG
- Cards de áreas de vida com status das metas (progresso visual)
- Feed de trânsitos ativos relevantes para o mapa do usuário
- Agenda: próximos aspectos importantes nos próximos 30 dias
- Atalho para nova sinastria: selecionar um mapa salvo + convidar alguém

#### ⑥ Tela de Sinastria
- Dois mapas lado a lado + mapa de sobreposição central
- Aspectos cruzados com espessura de linha proporcional à intensidade
- Cards dos 5 aspectos mais marcantes, com interpretação
- Leitura IA: pontos de harmonia, tensões criativas, complementaridade
- Botão proeminente: **"Gerar imagem para compartilhar"** — o gatilho viral
- Imagem gerada: nomes, signos, aspectos principais, URL do Astra

---

## 5. Modelo de Negócio e Precificação

### 5.1 Contexto Competitivo

| Concorrente | Modelo | Preço | Problema identificado |
|---|---|---|---|
| Co-Star (EUA) | Freemium + avulso | $9/mês | Features básicas bloqueadas, usuários frustrados |
| Nebula (EUA) | Freemium agressivo | $7,99/semana ou $24,99/mês | Dark patterns, cobranças escondidas, reclamações frequentes |
| Astrolink (BR) | Freemium + avulso | R$ 19,90/mês | Concorrente direto — valida o preço no mercado BR |

> A Nebula e Co-Star mostram o que **não fazer**: dark patterns e features básicas bloqueadas geram reviews negativas e churn. A oportunidade é entrar com transparência total como diferencial.

### 5.2 Planos do Astra

| Plano | Preço | O que inclui |
|---|---|---|
| **Free** | R$ 0 | Mapa natal completo · leitura IA básica de 3 planetas · 1 sinastria/mês com imagem compartilhável · sem histórico em nuvem |
| **Pro Mensal** | **R$ 17,90/mês** | Tudo — todas as áreas de vida · sistema de metas · diário · trânsitos · histórico · PDF · mapas ilimitados |
| **Pro Anual** | **R$ 149/ano** (~R$ 12,40/mês) | Mesmo que Pro Mensal · ~30% de desconto · melhor fluxo de caixa |
| **Profissional** | R$ 44,90/mês | Pro + múltiplos clientes · relatórios white-label · API access |

**Compras avulsas (sem assinatura):**
- Guia do Ano Astrológico — R$ 24,90 (relatório especial gerado uma vez)
- Mapa do Amor / Sinastria Profunda — R$ 34,90

> O plano Free inclui compartilhamento de sinastria propositalmente — é o principal mecanismo de aquisição orgânica. O Free precisa ser bom o suficiente para o usuário descobrir o valor e querer mais, não frustrante como o Co-Star se tornou.

### 5.3 Custos de IA por Usuário Pro — A Conta Real

**Taxa de câmbio de referência:** R$ 17,90 ≈ $3,20 USD

#### Custos mensais estimados por usuário Pro ativo

| Operação | Custo USD | Frequência estimada | Total mensal |
|---|---|---|---|
| Cruzamento relato × mapa (por área) | ~$0,04/chamada | 3x/mês em média | ~$0,12 |
| Síntese natal completa (amortizada) | ~$0,03 total | 1x por mapa, depois cacheada | ~$0,01 |
| Trânsitos mensais | ~$0,015 | 1x/mês | ~$0,015 |
| Interpretações avulsas (cache miss) | ~$0,005 | Decresce com escala | ~$0,005 |
| Infra (Railway/Fly.io) | — | — | ~$0,10–0,20 |
| **Total estimado** | | | **~$0,25–0,35** |

#### Margem de contribuição

| | Valor |
|---|---|
| Receita por usuário Pro mensal | $3,20 |
| Custo total estimado (IA + infra) | ~$0,30 |
| **Margem de contribuição** | **~$2,90 (~90%)** |

> Com 500 usuários Pro ativos, a receita mensal seria ~R$ 8.950 com custo de IA + infra de ~R$ 750. Com 2.000 usuários, ~R$ 35.800 de receita com custo operacional ainda baixo — o cache cresce junto com a base.

#### Cenário de abuso (worst case)

Um usuário que gerasse 20 leituras por área por mês (60 chamadas) custaria ~$2,40 em IA — ainda dentro da receita de $3,20. Para o Free, um soft limit de 5 chamadas/mês é suficiente para motivar upgrade sem frustrar.

### 5.4 Por que o Anual é o Produto Real

- Usuário paga R$ 149 adiantado — melhora seu fluxo de caixa imediatamente
- Retém o usuário por 12 meses, aumentando LTV e reduzindo churn
- Custo de IA do ano inteiro: ~$3,60 — contra R$ 149 (~$26,50) de receita
- Apps de autoconhecimento como Headspace e Calm convertem 60–70% dos assinantes para anual quando o desconto é percebido como genuíno

---

## 6. Crescimento Orgânico e Viralidade

### 6.1 Mecanismos Virais

| Mecanismo | Como funciona | Canal |
|---|---|---|
| Imagem de sinastria | Mapa de sobreposição + aspectos + frase IA + URL | Instagram, WhatsApp, Twitter/X |
| Link de sinastria | Usuário A convida B com link — B vê o mapa sem cadastro | WhatsApp, DM, email |
| Mapa natal compartilhável | Imagem elegante com signo solar/ascendente em destaque | Instagram stories, feed |
| Card "Meu eu-total" | Meta gerada pelo Astra (compartilhamento opcional) | Instagram, comunidades de autoconhecimento |

### 6.2 Credibilidade Técnica como Diferencial

- **Código aberto (AGPL)** — qualquer pessoa pode auditar os cálculos astrológicos
- **Swiss Ephemeris** — a mesma lib usada por Astro.com e softwares profissionais
- **Transparência de prompt** — versões documentadas das instruções de IA
- **Sem invenção** — a IA interpreta posições calculadas, não gera horóscopo genérico
- **Sem dark patterns** — preços claros, sem cobrança escondida, sem trial armadilha

---

## 7. Estratégia Open Source

O código-fonte do Astra será público sob licença **AGPL v3**, alinhado com a licença da Swiss Ephemeris.

### Por que AGPL é vantajoso

- Transparência dos cálculos como argumento de credibilidade — *"você pode auditar"*
- Qualquer concorrente que copiar é obrigado a publicar o código dele também
- Contribuições da comunidade astrológica e de desenvolvedores
- O valor real fica nos dados dos usuários, na UX e na marca — não no código-fonte

### O que permanece fora do repositório público

- Dados e histórico dos usuários *(LGPD — data + hora + local de nascimento é dado pessoal)*
- Prompts versionados de IA — ficam no servidor, não no repo
- Leituras geradas e cacheadas — pertencem à plataforma e ao usuário

---

## 8. Roadmap de Desenvolvimento

| Fase | Duração Est. | Entregáveis |
|---|---|---|
| **Fase 0 — Fundação técnica** | 2–3 semanas | Swiss Ephemeris via FFI Rust · cálculo de mapa natal em JSON · testes de precisão vs Astro.com |
| **Fase 1 — MVP Web** | 4–6 semanas | Renderização SVG · entrada de dados · leitura IA básica · auth Google · deploy · compartilhamento de mapa |
| **Fase 2 — Diferencial** | 4–6 semanas | Leituras por área de vida · sistema de metas · diário · cache granular · planos de assinatura |
| **Fase 3 — Crescimento** | 3–4 semanas | Sinastria com imagem viral · trânsitos · link de convite · dashboard de metas |
| **Fase 4 — Desktop** | 2–3 semanas | Wrapper Tauri · sync com backend · recursos offline |
| **Fase 5 — Escala** | Contínuo | PDF export · API pública · white-label · mobile nativo · previsões avançadas |

---

## 9. Design — Artefatos Produzidos

### 9.1 Tela 3 — Mapa Natal (Layout Interativo)

**Arquivo:** `Astra_Tela3_layout.html`
**Produzido em:** Junho 2025
**Ferramenta:** Claude Designer (Opus 4.8 Preview)

Layout interativo standalone da tela principal do produto — a tela do mapa natal. Inclui:

- Mapa SVG com posicionamento real dos planetas (dados de exemplo plausíveis)
- Duas variações do mapa (aspectos visíveis / ocultos)
- Painel lateral direito com lista de planetas, casas e aspectos
- Botões de área de vida (Carreira · Amor · Propósito · Saúde · Finanças · Família)
- Estado de hover nos planetas e aspectos
- Paleta e tipografia conforme briefing (Deep Violet, Celestial Gold, Playfair Display, Inter, JetBrains Mono)
- Modo escuro como padrão

**Próximos artefatos a produzir:**
- Tela 1 — Landing Page (desktop)
- Tela 2 — Entrada de Dados / Onboarding
- Estado de loading (transição Tela 2 → 3)
- Mini-mapa para dashboard e sinastria

---

*✦ ☽ ✦*
*Astra — Documento interno de projeto · v2.1 · Junho 2025*
*Licença do projeto: AGPL v3*

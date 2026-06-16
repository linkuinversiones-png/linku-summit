/**
 * Registry de eventos del Directorio LINKU.
 *
 * Fuente única de verdad para:
 *  - Pillar page /directorio (índice por categorías)
 *  - Páginas hijo /directorio/[slug] (generateStaticParams, metadata, fallback "próximamente")
 *  - JSON-LD CollectionPage.hasPart y BreadcrumbList
 *  - sitemap.xml (cuando se agregue)
 *
 * Cuando llegue el contenido completo de un evento, se mueve a
 * `lib/directorio/content/eventos/<slug>.ts` y se marca `published: true`.
 */

export type DirectoryCategory =
  | 'capital-privado-vc-pe'
  | 'family-office-wealth'
  | 'real-estate'
  | 'fintech'
  | 'cripto'
  | 'ecosistema-startup'
  | 'educacion-financiera-retail';

export type DirectoryEvent = {
  slug: string;
  nombre: string;
  /** Lead corto que aparece debajo del título en la card del índice. */
  hook: string;
  category: DirectoryCategory;
  /** Texto humano "Ciudad, País" o "Latam (rotativo)". */
  donde: string;
  /** Texto humano de fecha: "19–21 oct 2026", "variable 2026". */
  cuando: string;
  /** Etiquetas de clase de activo que aparecen en la card. */
  asset_classes: string[];
  /** Datos clave citables: asistentes, AUM, GPs, etc. */
  datos_clave: string;
  /** Keywords que el evento ataca (para SEO/posicionamiento). */
  posiciona_por: string[];
  /** Si está publicado el artículo hijo o sigue como "próximamente". */
  published: boolean;
};

export const DIRECTORY_CATEGORIES: Record<DirectoryCategory, string> = {
  'capital-privado-vc-pe': 'Capital privado, Venture Capital y Private Equity',
  'family-office-wealth': 'Family Offices y Wealth Management',
  'real-estate': 'Real Estate y activos reales',
  fintech: 'Fintech e innovación financiera',
  cripto: 'Cripto y activos digitales',
  'ecosistema-startup': 'Ecosistema startup e innovación (donde fluye el capital)',
  'educacion-financiera-retail': 'Educación financiera e inversión retail'
};

/** Orden en el que se muestran las categorías en la pillar page. */
export const CATEGORY_ORDER: DirectoryCategory[] = [
  'capital-privado-vc-pe',
  'family-office-wealth',
  'real-estate',
  'fintech',
  'cripto',
  'ecosistema-startup',
  'educacion-financiera-retail'
];

export const DIRECTORY_EVENTS: DirectoryEvent[] = [
  {
    slug: 'lavca-week',
    nombre: 'LAVCA Week',
    hook: 'El cónclave institucional del capital privado latinoamericano en Nueva York: donde los LPs globales deciden cuánto dry powder asignan a la región.',
    category: 'capital-privado-vc-pe',
    donde: 'Nueva York, EE.UU.',
    cuando: '19–21 oct 2026',
    asset_classes: ['Capital Privado', 'VC', 'PE'],
    datos_clave:
      'Reunión curada de GPs, LPs, fondos de pensiones y family offices activos en Latam. Organiza LAVCA.',
    posiciona_por: ['LAVCA Week', 'LAVCA Week 2026', 'private capital Latin America conference'],
    published: true
  },
  {
    slug: 'vc-latam-summit',
    nombre: 'VC Latam Summit',
    hook: 'La mesa chica del venture capital regional: 100 fund managers y allocators que mueven el ecosistema de un solo apretón de manos.',
    category: 'capital-privado-vc-pe',
    donde: 'Latam (por invitación)',
    cuando: 'abr 2026',
    asset_classes: ['VC', 'PE'],
    datos_clave:
      'Formato exclusivo, ~100 GPs y LPs top. Organizado por las asociaciones de VC/PE de Latam (ABVCAP, AMEXCAP, ColCapital, PECAP).',
    posiciona_por: ['VC Latam Summit', 'VC Latam Summit 2026', 'venture capital latam summit'],
    published: true
  },
  {
    slug: 'congreso-colcapital',
    nombre: 'Congreso de Capital Privado y Capital Emprendedor (ColCapital)',
    hook: 'Dos días donde se define hacia dónde se mueve el capital privado en Colombia, con 150+ inversionistas y 40+ expertos sobre el escenario.',
    category: 'capital-privado-vc-pe',
    donde: 'Bogotá, Colombia',
    cuando: '10–11 mar 2026',
    asset_classes: ['VC', 'PE', 'Family Offices'],
    datos_clave:
      'El evento más relevante de capital privado y emprendedor de Colombia. Pitch session + paneles. Industria con >USD 31.500M en compromisos.',
    posiciona_por: ['Congreso ColCapital', 'ColCapital', 'congreso capital privado Colombia'],
    published: true
  },
  {
    slug: 'cumbre-amexcap',
    nombre: 'Cumbre de Capital Privado AMEXCAP',
    hook: 'El punto de encuentro entre los GPs mexicanos y los LPs globales que buscan exposición a uno de los mercados más profundos de Latam.',
    category: 'capital-privado-vc-pe',
    donde: 'CDMX, México',
    cuando: '19–20 mar 2026',
    asset_classes: ['PE', 'VC', 'Real Estate', 'Infra'],
    datos_clave:
      'La conferencia de capital privado más importante de México: ~530 asistentes (120 LPs, 170 GPs). Masterclasses y roundtables.',
    posiciona_por: ['Cumbre AMEXCAP', 'AMEXCAP', 'cumbre capital privado México'],
    published: true
  },
  {
    slug: 'mexico-pe-day',
    nombre: 'México PE Day',
    hook: 'El roadshow de México hacia el capital institucional: crecimiento, crédito privado, real estate, infraestructura y energía.',
    category: 'capital-privado-vc-pe',
    donde: 'Nueva York, EE.UU.',
    cuando: 'variable 2026',
    asset_classes: ['PE', 'Crédito Privado', 'Real Estate'],
    datos_clave:
      'AMEXCAP posiciona a México como destino de capital privado ante LPs, fondos de pensiones y family offices globales.',
    posiciona_por: ['México PE Day', 'PE Day AMEXCAP', 'private equity day Mexico'],
    published: true
  },
  {
    slug: 'mexico-vc-day',
    nombre: 'Mexico VC Day',
    hook: 'La cita anual del venture capital mexicano para conectar founders, GPs y LPs en un mismo salón.',
    category: 'capital-privado-vc-pe',
    donde: 'CDMX, México',
    cuando: 'variable 2026',
    asset_classes: ['VC'],
    datos_clave:
      'Único evento en México dedicado exclusivamente a venture capital. GPs, LPs, family offices y gobierno.',
    posiciona_por: ['Mexico VC Day', 'VC Day México', 'venture capital day Mexico'],
    published: true
  },
  {
    slug: 'abvcap-conference',
    nombre: 'ABVCAP Conference',
    hook: 'La puerta de entrada al deal-flow brasileño: donde los fondos globales miden el apetito por el mayor mercado de la región.',
    category: 'capital-privado-vc-pe',
    donde: 'São Paulo, Brasil',
    cuando: 'mediados de año 2026',
    asset_classes: ['VC', 'PE'],
    datos_clave:
      'El mayor encuentro de capital privado y emprendedor de Brasil, el mercado más grande de Latam.',
    posiciona_por: ['ABVCAP Conference', 'ABVCAP', 'private equity venture capital Brazil'],
    published: true
  },
  {
    slug: 'gpca-conference',
    nombre: 'Global Private Capital Conference (GPCA)',
    hook: 'La conversación global sobre capital privado en mercados emergentes, con Latam como protagonista recurrente.',
    category: 'capital-privado-vc-pe',
    donde: 'Nueva York / global',
    cuando: 'variable 2026',
    asset_classes: ['PE', 'VC', 'Mercados emergentes'],
    datos_clave:
      'Allocators institucionales globales y fondos enfocados en mercados emergentes, incluida Latam.',
    posiciona_por: ['GPCA', 'Global Private Capital Association', 'emerging markets private capital'],
    published: true
  },
  {
    slug: 'reconocimientos-colcapital',
    nombre: 'Reconocimientos a la Industria de Capital Privado (ColCapital)',
    hook: 'La noche en que la industria colombiana de capital privado reconoce a los fondos que mejor crearon valor.',
    category: 'capital-privado-vc-pe',
    donde: 'Bogotá, Colombia',
    cuando: 'nov 2026',
    asset_classes: ['PE', 'VC (premios)'],
    datos_clave:
      'Gala que celebra los casos de éxito de fondos de capital privado y emprendedor en Colombia.',
    posiciona_por: ['Reconocimientos Capital Privado ColCapital', 'premios capital privado Colombia'],
    published: true
  },
  {
    slug: 'startco',
    nombre: 'StartCo',
    hook: 'El "Coachella de los negocios" de Latam: en Medellín, el capital se mueve de verdad sobre el escenario, en vivo y por subasta.',
    category: 'capital-privado-vc-pe',
    donde: 'Medellín, Colombia (Plaza Mayor)',
    cuando: '16–17 abr 2026',
    asset_classes: ['Startups', 'VC', 'Inversión'],
    datos_clave:
      'La subasta de startups en vivo más grande de Latam. 350 startups, 500+ inversionistas, 80 fondos internacionales, 16.000 asistentes, USD 18M proyectados.',
    posiciona_por: ['StartCo', 'StartCo 2026', 'subasta de startups Medellín'],
    published: true
  },
  {
    slug: 'colombia-tech-week',
    nombre: 'Colombia Tech Week',
    hook: 'Una semana entera donde el ecosistema tech de Colombia concentra fondos, family offices y HNWIs co-invirtiendo en Latam.',
    category: 'capital-privado-vc-pe',
    donde: 'Bogotá · Medellín, Colombia',
    cuando: '10–16 ago 2026',
    asset_classes: ['Tech', 'VC', 'CVC', 'HNWI'],
    datos_clave:
      'Semana distribuida con 350+ eventos; 20.000+ asistentes, 350+ inversionistas (VCs, CVCs, LPs, family offices, HNWIs).',
    posiciona_por: ['Colombia Tech Week', 'Colombia Tech Week 2026', 'tech week Bogotá'],
    published: true
  },
  {
    slug: 'colombia-tech-fest',
    nombre: 'Colombia Tech Fest',
    hook: 'El festival a cielo abierto que mezcla negocios, inversión y comunidad para arrancar la semana tech más grande de Colombia.',
    category: 'capital-privado-vc-pe',
    donde: 'Bogotá, Colombia',
    cuando: 'ago 2026',
    asset_classes: ['Tech', 'Inversión', 'VC'],
    datos_clave:
      'Festival al aire libre que abre Colombia Tech Week. 14.000 asistentes, 140 speakers. Demo Days con bolsa de inversión.',
    posiciona_por: ['Colombia Tech Fest', 'Colombia Tech Fest 2026', 'festival tech Latam'],
    published: true
  },
  {
    slug: 'emerge-americas',
    nombre: 'eMerge Americas',
    hook: 'El puente tecnológico EE.UU.–Latam en Miami: finanzas, fintech, IA y venture en seis escenarios.',
    category: 'capital-privado-vc-pe',
    donde: 'Miami, EE.UU.',
    cuando: '22–24 abr 2026',
    asset_classes: ['Tech', 'Fintech', 'VC'],
    datos_clave:
      'Conferencia tech global de Miami con foco en finanzas, fintech, IA y venture. 20.000+ asistentes de 60+ países.',
    posiciona_por: ['eMerge Americas', 'eMerge Americas 2026', 'tech conference Miami'],
    published: true
  },
  {
    slug: 'web-summit-rio',
    nombre: 'Web Summit Rio',
    hook: 'El gigante tecnológico de Sudamérica: 40.000+ asistentes y casi 700 inversionistas buscando el próximo unicornio.',
    category: 'capital-privado-vc-pe',
    donde: 'Río de Janeiro, Brasil',
    cuando: '8–11 jun 2026',
    asset_classes: ['Tech', 'VC', 'Startups'],
    datos_clave:
      'El mayor evento tech de Sudamérica: 40.287 asistentes, 688 inversionistas, 1.572 startups. Fondos como Kaszek, Monashees y SoftBank.',
    posiciona_por: ['Web Summit Rio', 'Web Summit Rio 2026', 'tech conference Brazil'],
    published: true
  },
  {
    slug: 'south-summit-brazil',
    nombre: 'South Summit Brazil',
    hook: 'El puente startup entre Latam y Europa, con matchmaking directo entre founders e inversionistas.',
    category: 'capital-privado-vc-pe',
    donde: 'Porto Alegre, Brasil',
    cuando: 'variable 2026',
    asset_classes: ['Startups', 'VC', 'Innovación'],
    datos_clave:
      'Plataforma de startups y matchmaking con inversionistas; conexión Latam–Europa.',
    posiciona_por: ['South Summit Brazil', 'South Summit Brasil 2026'],
    published: true
  },
  {
    slug: 'endeavor-investor-network',
    nombre: 'Endeavor Investor Network / High Impact Night',
    hook: 'El espacio donde se aprende a levantar capital e invertir bien, de la mano de quienes ya hicieron exits.',
    category: 'capital-privado-vc-pe',
    donde: 'Bogotá · Medellín, Colombia',
    cuando: 'variable 2026',
    asset_classes: ['VC', 'Angels', 'Emprendimiento'],
    datos_clave:
      'Conecta inversionistas y emprendedores; técnicas de levantamiento de capital y corporate venture. 270+ por edición.',
    posiciona_por: [
      'Endeavor Investor Network',
      'High Impact Night Endeavor',
      'Endeavor inversionistas'
    ],
    published: true
  },
  {
    slug: 'experiencia-endeavor',
    nombre: 'Experiencia Endeavor',
    hook: 'El espacio Endeavor que reúne a la comunidad de emprendedores de alto impacto en Colombia.',
    category: 'ecosistema-startup',
    donde: 'Bogotá · Medellín, Colombia',
    cuando: 'variable 2026',
    asset_classes: ['Emprendimiento', 'VC', 'Comunidad'],
    datos_clave:
      'Encuentro de la red Endeavor en Colombia: founders, mentores y comunidad de inversionistas.',
    posiciona_por: ['Experiencia Endeavor', 'Endeavor Colombia', 'evento emprendedores Colombia'],
    published: true
  },
  {
    slug: 'colombia-family-office-summit',
    nombre: 'Colombia Family Office & Investors Summit (Black Bull)',
    hook: 'El escenario premium, privado y confidencial donde los family offices colombianos hacen coinversión y descubren activos alternativos.',
    category: 'family-office-wealth',
    donde: 'Bogotá, Colombia',
    cuando: '25–26 feb 2026',
    asset_classes: ['Family Offices', 'Wealth', 'Alternativos'],
    datos_clave:
      'Encuentro privado de familias empresarias, family offices, UHNWIs y fondos. Reuniones 1:1, gobernanza familiar e inversión alternativa.',
    posiciona_por: [
      'Colombia Family Office Summit',
      'family office Colombia',
      'Black Bull investors summit'
    ],
    published: true
  },
  {
    slug: 'black-bull-summits',
    nombre: 'Black Bull Family Office & Investors Summits (serie regional)',
    hook: 'El circuito que conecta a los family offices de Latam ciudad por ciudad: capital inteligente, networking de alto nivel y coinversión.',
    category: 'family-office-wealth',
    donde: 'CDMX · Lima · Panamá · Santiago · Bogotá',
    cuando: 'varias fechas 2026',
    asset_classes: ['Family Offices', 'Wealth'],
    datos_clave:
      'Serie de cumbres privadas para single & multifamily offices, asset managers y fondos en toda Latam.',
    posiciona_por: ['Black Bull Investors', 'family office Latam', 'family office investors summit'],
    published: true
  },
  {
    slug: 'gri-real-estate-latam',
    nombre: 'Summit Latin America GRI Real Estate',
    hook: 'Donde el capital inmobiliario institucional de Latam negocia sin micrófonos: multifamily, build-to-rent y vehículos cross-border.',
    category: 'real-estate',
    donde: 'Latam (rotativo)',
    cuando: 'variable 2026',
    asset_classes: ['Real Estate institucional'],
    datos_clave:
      'Debates a puerta cerrada y matchmaking entre desarrolladores, fondos e inversionistas inmobiliarios de Latam (GRI Club).',
    posiciona_por: [
      'GRI Real Estate Latin America',
      'real estate summit Latin America',
      'GRI Club Latam'
    ],
    published: true
  },
  {
    slug: 'finnosummit',
    nombre: 'FINNOSUMMIT',
    hook: 'El epicentro fintech de Latam: banca, retail, pagos e IA financiera cruzando una sola conversación.',
    category: 'fintech',
    donde: 'CDMX, México',
    cuando: '23–24 sep 2026',
    asset_classes: ['Fintech', 'Pagos', 'IA financiera'],
    datos_clave:
      'La cumbre fintech más influyente de Latam (10ª edición). 2.000+ asistentes de 20 países. Organiza Finnovista.',
    posiciona_por: ['FINNOSUMMIT', 'Finnosummit 2026', 'fintech summit Latam'],
    published: true
  },
  {
    slug: 'mexico-fintech-week',
    nombre: 'Mexico Fintech Week',
    hook: 'Una semana entera donde el ecosistema fintech mexicano se vuelve la puerta natural de entrada a la innovación financiera de Latam.',
    category: 'fintech',
    donde: 'CDMX, México',
    cuando: '23–27 feb 2026',
    asset_classes: ['Fintech', 'Activos digitales', 'IA'],
    datos_clave:
      'Celebración descentralizada con 50+ eventos comunitarios; 2.500+ profesionales. Puerta de entrada al fintech de Latam.',
    posiciona_por: ['Mexico Fintech Week', 'fintech week México', 'semana fintech México'],
    published: true
  },
  {
    slug: 'fintech-americas-miami',
    nombre: 'Fintech Americas Miami',
    hook: 'Donde el C-suite financiero de Latam y EE.UU. define el rumbo de la banca digital de la región.',
    category: 'fintech',
    donde: 'Miami, EE.UU.',
    cuando: 'variable 2026',
    asset_classes: ['Fintech', 'Banca', 'Pagos'],
    datos_clave:
      'La convención bancaria/fintech más importante para Latam desde EE.UU. 1.750 líderes. Hoy parte de Money20/20.',
    posiciona_por: ['Fintech Americas', 'Fintech Americas Miami', 'convención bancaria Latam'],
    published: true
  },
  {
    slug: 'fintech-mexico-festival',
    nombre: 'Fintech México Festival',
    hook: 'El festival que junta a startups fintech y reguladores para destrabar la próxima ola de innovación financiera.',
    category: 'fintech',
    donde: 'CDMX, México',
    cuando: '26 feb 2026',
    asset_classes: ['Fintech', 'Innovación financiera'],
    datos_clave:
      'Tendencias de innovación financiera; 2.500+ líderes. Networking startups–reguladores.',
    posiciona_por: ['Fintech México Festival', 'festival fintech México'],
    published: true
  },
  {
    slug: 'finnosummit-connect',
    nombre: 'FINNOSUMMIT Connect',
    hook: 'La edición curada de Finnovista: menos escala, más profundidad. Networking ejecutivo fintech en formato tipo resort en Cancún.',
    category: 'fintech',
    donde: 'Cancún, México',
    cuando: 'marzo 2026 (por confirmar)',
    asset_classes: ['Fintech', 'Networking ejecutivo'],
    datos_clave:
      'Edición de Finnovista enfocada en relacionamiento ejecutivo de alto nivel del ecosistema fintech latinoamericano. Formato íntimo frente a la escala del FINNOSUMMIT principal.',
    posiciona_por: [
      'FINNOSUMMIT Connect',
      'Finnosummit Connect Cancún',
      'fintech Latam networking',
      'evento fintech ejecutivo'
    ],
    published: true
  },
  {
    slug: 'paytech-conf',
    nombre: 'Paytech Conf',
    hook: 'La cita especializada en pagos digitales, el motor silencioso de la inclusión financiera en Latam.',
    category: 'fintech',
    donde: 'Latam (rotativo)',
    cuando: 'variable 2026',
    asset_classes: ['Pagos digitales', 'Fintech'],
    datos_clave:
      'Uno de los encuentros más relevantes de pagos digitales en Latam (Latam Fintech Hub).',
    posiciona_por: ['Paytech Conf', 'Latam Fintech Hub', 'pagos digitales Latam'],
    published: true
  },
  {
    slug: 'labitconf',
    nombre: 'LABITCONF',
    hook: 'La conferencia de Bitcoin más veterana de Latam: cultura, soberanía financiera y adopción real en un solo lugar.',
    category: 'cripto',
    donde: 'Latam (itinerante)',
    cuando: 'nov 2026',
    asset_classes: ['Cripto', 'Bitcoin', 'Blockchain'],
    datos_clave:
      'La conferencia cripto más antigua (desde 2013) y culturalmente influyente de Latam. Cientos de speakers.',
    posiciona_por: [
      'LABITCONF',
      'bitcoin conference Latin America',
      'conferencia bitcoin Latinoamérica'
    ],
    published: true
  },
  {
    slug: 'blockchain-rio',
    nombre: 'Blockchain.RIO',
    hook: 'El evento blockchain más grande de Latam, donde la tokenización de activos reales deja de ser teoría.',
    category: 'cripto',
    donde: 'Río de Janeiro, Brasil',
    cuando: '12–13 ago 2026',
    asset_classes: ['Cripto', 'Tokenización', 'CBDCs'],
    datos_clave:
      'El mayor evento blockchain de Latam: 15.000+ asistentes, 400+ speakers. Tokenización, DREX/CBDCs, regulación.',
    posiciona_por: ['Blockchain.RIO', 'Blockchain Rio 2026', 'blockchain event Brazil'],
    published: true
  },
  {
    slug: 'blockchain-summit-latam',
    nombre: 'Blockchain Summit Latam',
    hook: 'El evento serio e institucional del blockchain regional: menos especulación, más estrategia. Identidad digital, CBDCs y adopción empresarial.',
    category: 'cripto',
    donde: 'Latam (sede rotativa)',
    cuando: '2026 (por confirmar)',
    asset_classes: ['Blockchain', 'CBDCs', 'Regulación'],
    datos_clave:
      'Summit con foco institucional y regulatorio: identidad digital, CBDCs y adopción empresarial. Acceso poco común al sector público regional.',
    posiciona_por: [
      'Blockchain Summit Latam',
      'blockchain Latinoamérica',
      'CBDC Latam',
      'regulación cripto'
    ],
    published: true
  },
  {
    slug: 'consensus-miami',
    nombre: 'Consensus Miami',
    hook: 'La convención cripto que reúne a Wall Street y al mundo on-chain en el hub de capital de Miami.',
    category: 'cripto',
    donde: 'Miami, EE.UU.',
    cuando: '5–7 may 2026',
    asset_classes: ['Cripto', 'Activos digitales'],
    datos_clave:
      'Evento insignia de CoinDesk: 20.000+ asistentes. Activos digitales, IA y finanzas institucionales.',
    posiciona_por: ['Consensus', 'Consensus Miami 2026', 'CoinDesk Consensus'],
    published: true
  },
  {
    slug: 'stablecoin-conference-bitso',
    nombre: 'Stablecoin Conference (Bitso)',
    hook: 'Dos días dedicados al corredor de stablecoins más activo de Latam, donde TradFi y DeFi por fin convergen.',
    category: 'cripto',
    donde: 'CDMX, México',
    cuando: '15–16 jun 2026',
    asset_classes: ['Cripto', 'Stablecoins', 'Pagos'],
    datos_clave:
      'El principal evento de stablecoins de Latam: pagos, regulación y transferencias cross-border. Organiza Bitso.',
    posiciona_por: [
      'Stablecoin Conference',
      'Bitso stablecoin conference',
      'stablecoin event Latam'
    ],
    published: true
  },
  {
    slug: 'eth-latam',
    nombre: 'ETH Latam (Bogotá · CDMX · São Paulo)',
    hook: 'El circuito técnico de Ethereum en Latam: donde se construye la infraestructura de las finanzas descentralizadas.',
    category: 'cripto',
    donde: 'Latam (rotativo)',
    cuando: 'variable 2026',
    asset_classes: ['Cripto', 'Ethereum', 'DeFi'],
    datos_clave:
      'Workshops y hackathons técnicos de clase mundial de la comunidad Ethereum en Latam.',
    posiciona_por: ['ETH Latam', 'ETH Bogotá', 'Ethereum Latam conference'],
    published: true
  },
  {
    slug: 'gofest',
    nombre: 'GoFest',
    hook: 'El punto de reunión de founders y comunidad emprendedora que late dentro de la semana tech colombiana.',
    category: 'ecosistema-startup',
    donde: 'Colombia (ecosistema Tech Week)',
    cuando: 'ago 2026',
    asset_classes: ['Startups', 'Comunidad', 'Inversión'],
    datos_clave: 'Encuentro de startups y comunidad dentro del circuito de la Colombia Tech Week.',
    posiciona_por: ['GoFest', 'GoFest Colombia', 'startup gathering Colombia'],
    published: true
  },
  {
    slug: 'moneycon',
    nombre: 'MoneyCon (Mis Propias Finanzas)',
    hook: 'El festival que volvió accesible la inversión: bolsa, real estate, alternativos y cripto explicados para el inversionista natural.',
    category: 'educacion-financiera-retail',
    donde: 'Bogotá, Colombia (Uniandes)',
    cuando: '17–18 ene 2026',
    asset_classes: ['Educación financiera', 'Inversión retail'],
    datos_clave:
      'El primer festival de finanzas, inversión y productividad de Colombia y Latam. 5.000+ asistentes, 120+ expertos. Concepto edutainment.',
    posiciona_por: ['MoneyCon', 'MoneyCon 2026', 'Mis Propias Finanzas evento'],
    published: true
  }
];

/** Eventos agrupados por categoría, en el orden de `CATEGORY_ORDER`. */
export function eventsByCategory(): Array<{
  category: DirectoryCategory;
  title: string;
  events: DirectoryEvent[];
}> {
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    title: DIRECTORY_CATEGORIES[cat],
    events: DIRECTORY_EVENTS.filter((e) => e.category === cat)
  })).filter((g) => g.events.length > 0);
}

export function getEventBySlug(slug: string): DirectoryEvent | undefined {
  return DIRECTORY_EVENTS.find((e) => e.slug === slug);
}

export const DIRECTORY_BASE_PATH = '/directorio';

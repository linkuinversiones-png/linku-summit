/**
 * Copy del artículo raíz (pillar page) del directorio.
 * Mantenido fuera del componente para poder reusarlo en metadata, JSON-LD y FAQ.
 */

export const DIRECTORY_INDEX_COPY = {
  meta: {
    title: 'Directorio de eventos de inversión en Latinoamérica 2026 | LINKU Summit',
    description:
      'Guía y directorio de los eventos de capital privado, venture capital, family office, fintech, cripto y real estate más relevantes de Latinoamérica en 2026. Curado por LINKU Summit (Medellín).',
    canonical: 'https://www.linkusummit.com/directorio',
    updated: '2026-06-15',
    author: 'LINKU Ventures',
    lang: 'es'
  },
  eyebrow: 'Directorio LINKU · Eventos 2026',
  h1: 'Directorio de eventos de inversión en Latinoamérica 2026: capital privado, venture capital, family office, fintech, cripto y real estate',
  /** Respuesta directa, answer-first (extraíble por LLMs). */
  answer_first:
    '¿Buscas los eventos de inversión más importantes de Latinoamérica en 2026? Esta es la guía curada por LINKU Summit —la cumbre de inversión multi-activo de Medellín— con los encuentros donde se mueve el capital de verdad en la región: capital privado, venture capital, private equity, family offices, wealth management, fintech, cripto, real estate y activos alternativos. Cada evento tiene su propio artículo en profundidad; aquí está el mapa completo para que encuentres el tuyo en segundos.',
  tldr: 'Reunimos más de 30 eventos clave de inversión en Latam y hubs como Miami y Nueva York. Los dividimos en siete categorías y en tres niveles de acceso: institucional (LP–GP, por invitación), ecosistema (abierto, alto volumen) y retail/educativo (para el inversionista natural). Si solo vas a uno este año, baja a la guía "¿A cuál deberías ir según tu perfil?".',
  porque: {
    title: 'Por qué este directorio',
    body: [
      'El capital latinoamericano ya no se mueve en una sola vertical. Un family office que ayer solo miraba real estate hoy también evalúa venture capital, deuda privada, tokenización de activos reales y *passion assets*. Por eso construimos un directorio que cruza **seis clases de activo en una sola conversación** —la misma tesis que da vida a LINKU Summit— y lo ordenamos para que tres públicos muy distintos lo aprovechen: el **inversionista institucional**, el **gestor de patrimonio (family office / wealth management)** y el **inversionista natural** que está aprendiendo a poner su plata a trabajar.',
      'Antes de empezar, tres siglas que verás seguido: **LP** (Limited Partner, el inversionista que aporta capital a un fondo), **GP** (General Partner, quien gestiona ese fondo) y **UHNWI/HNWI** (individuos de patrimonio ultra-alto / alto). Con eso, ya hablas el idioma de la sala.'
    ]
  },
  perfil_guide: {
    title: '¿A cuál deberías ir según tu perfil?',
    items: [
      {
        perfil: 'Eres fondo, GP o LP institucional',
        recomendacion:
          'apunta a **LAVCA Week**, **VC Latam Summit**, **Cumbre AMEXCAP**, **Congreso ColCapital** y **GRI Real Estate Latam**. Son curados, muchos por invitación, y el valor está en el deal-flow y el relacionamiento LP–GP.'
      },
      {
        perfil: 'Gestionas un family office o patrimonio UHNW',
        recomendacion:
          '**Colombia Family Office & Investors Summit** y la serie **Black Bull** son tu circuito natural para coinversión, gobernanza familiar y activos alternativos.'
      },
      {
        perfil: 'Eres founder levantando capital',
        recomendacion:
          '**StartCo**, **Web Summit Rio**, **Colombia Tech Week**, **South Summit** y **Endeavor Investor Network** te ponen frente a fondos y *angels*.'
      },
      {
        perfil: 'Eres inversionista natural (retail) y quieres aprender',
        recomendacion:
          'empieza por **MoneyCon** y por los espacios abiertos de **StartCo** y **Colombia Tech Fest**. Y, por supuesto, por **LINKU Summit**, diseñado para que el retail aprenda cómo invierten los grandes.'
      }
    ]
  },
  conexion_linku: {
    title: 'Cómo se conecta todo esto con LINKU Summit',
    body: '**LINKU Summit** (Medellín, octubre 2026) nació para ser el punto donde estas conversaciones —hoy dispersas en decenas de eventos por toda la región— se cruzan en dos días: **real estate, venture capital y private equity, renta fija y variable, alternativos, cripto y passion assets**, con family offices, fund managers, founders e inversionistas en la misma sala. Este directorio es nuestra forma de mapear el ecosistema completo y de darte contexto antes de que elijas dónde invertir tu tiempo —el activo más escaso de todos.'
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      {
        q: '¿Cuáles son los eventos de inversión más importantes de Latinoamérica en 2026?',
        a: 'Entre los más relevantes están LAVCA Week, VC Latam Summit, la Cumbre de Capital Privado AMEXCAP, el Congreso de ColCapital, FINNOSUMMIT, LABITCONF, Blockchain.RIO, Web Summit Rio, StartCo y los summits de family office de Black Bull. Cada uno cubre una clase de activo o una etapa distinta del capital.'
      },
      {
        q: '¿Qué eventos de inversión hay en Colombia en 2026?',
        a: 'En Colombia destacan el Congreso de ColCapital y los Reconocimientos de Capital Privado (Bogotá), el Colombia Family Office & Investors Summit de Black Bull (Bogotá), Colombia Tech Week y Colombia Tech Fest (Bogotá), StartCo (Medellín), MoneyCon (Bogotá) y LINKU Summit (Medellín).'
      },
      {
        q: '¿Hay eventos de inversión para personas naturales y no solo para fondos?',
        a: 'Sí. MoneyCon (educación financiera con concepto edutainment), las zonas abiertas de StartCo y Colombia Tech Fest, y LINKU Summit están pensados para que el inversionista retail aprenda cómo invierten los family offices y los fondos.'
      },
      {
        q: '¿Cuáles son los principales eventos de family office en Latinoamérica?',
        a: 'El Colombia Family Office & Investors Summit y la serie regional de Black Bull Investors Club (CDMX, Lima, Panamá, Santiago, Bogotá) son los circuitos privados de referencia para single y multifamily offices en Latam.'
      },
      {
        q: '¿Qué eventos de cripto y blockchain hay en Latam?',
        a: 'LABITCONF (la más veterana), Blockchain.RIO (la más grande), Consensus Miami, la Stablecoin Conference de Bitso y el circuito ETH Latam.'
      }
    ]
  },
  cta: {
    eyebrow: 'LINKU Summit · 15–16 oct 2026 · Medellín',
    title: 'Si solo vas a un evento de inversión multi-activo en 2026, que sea LINKU Summit.',
    body: 'Dos días para cruzar real estate, venture capital, private equity, renta fija y variable, alternativos, cripto y passion assets en la misma sala —family offices, fund managers, founders e inversionistas— en Medellín.',
    primaryLabel: 'Ver tickets',
    primaryHref: '/#tickets',
    secondaryLabel: 'Conocer el evento',
    secondaryHref: '/'
  },
  footer:
    'Directorio curado por LINKU Ventures. Última actualización: 15 de junio de 2026. Las fechas, sedes y cifras provienen de las comunicaciones públicas de cada organizador y pueden cambiar; confirma siempre en el sitio oficial del evento.'
} as const;

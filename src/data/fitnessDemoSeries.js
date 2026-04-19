/**
 * Catálogo demo alinhado aos 5 blocos da home (sem métricas / metas / lembretes no catálogo).
 */
import { DEMO_VIDEO_MP4 } from '@/constants/demoVideo';

const COVERS = [
  '/imagens/banners/poster-tile-b.svg',
  '/imagens/banners/poster-tile-c.svg',
  '/imagens/banners/poster-comedy.svg',
  '/imagens/banners/poster-movie.svg',
  '/imagens/banners/hero-slide-1.svg',
  '/imagens/banners/hero-slide-2.svg',
];

/** Quantidade de episódios demo por série (seed local). */
export const FITNESS_DEMO_EPISODES_PER_SERIES = 25;

/** Capa estável por id — evita rodar um contador global a cada `buildMockSeed()` (isso trocava URLs no seed e quebrava o merge com o localStorage). */
function stableCoverForSeriesId(id) {
  let h = 5381;
  const s = String(id);
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h, 33) ^ s.charCodeAt(i);
  }
  return COVERS[Math.abs(h) % COVERS.length];
}

function pushPair(seriesOut, episodesOut, { id, title, description, highlighted_home_section, total_views, premium_unlock_price }) {
  seriesOut.push({
    id,
    title,
    description,
    category: '',
    year: undefined,
    age_rating: '',
    featured: false,
    highlighted_home_section,
    total_views,
    published: true,
    cover_url: stableCoverForSeriesId(id),
    content_type: 'series',
    banner_object_position: 'center center',
    ...(premium_unlock_price ? { premium_unlock_price: String(premium_unlock_price).trim() } : {}),
  });
  for (let n = 1; n <= FITNESS_DEMO_EPISODES_PER_SERIES; n += 1) {
    episodesOut.push({
      id: `ep-${id}-${n}`,
      series_id: id,
      title: `Episódio ${n}`,
      season: 1,
      number: n,
      description: '',
      video_url: DEMO_VIDEO_MP4,
      duration: 540 + ((n * 37) % 480),
      thumbnail_url: '',
    });
  }
}

/**
 * @returns {{ series: object[], episodes: object[] }}
 */
export function buildFitnessDemoCatalog() {
  const series = [];
  const episodes = [];
  let v = 8000;

  const add = (slug, items) => {
    items.forEach((entry, i) => {
      const [idSuffix, title, desc, extra] = entry;
      const premium_unlock_price =
        extra && typeof extra === 'object' && extra.premium_unlock_price != null
          ? String(extra.premium_unlock_price)
          : undefined;
      const highlighted_home_section =
        extra && typeof extra === 'object' && extra.highlighted_home_section != null
          ? String(extra.highlighted_home_section).trim()
          : slug;
      v = 7600 - i * 80 - items.length * 2;
      pushPair(series, episodes, {
        id: `fit-${slug}-${idSuffix}`,
        title,
        description: desc,
        highlighted_home_section,
        total_views: Math.max(500, v),
        premium_unlock_price,
      });
    });
  };

  add('comecar_rapido', [
    ['a', 'Começar já — 12 min', 'Entrada rápida: aquece, dança um pouco e termina com energia.'],
    ['b', 'Express 10 — full body', 'Dez minutos que mexem em tudo — ideal para encaixar no dia.'],
    ['c', 'Manhã — energia em 5 min', 'Acorda o corpo sem complicação — começa o hábito hoje.'],
  ]);

  add('treinos_principais', [
    ['a', 'HIIT em casa — 20 min', 'Intervalos fortes, sem equipamento — queima e condicionamento.'],
    ['b', 'Cardio low impact', 'Suave para articulações, eficaz para o coração.'],
    ['c', 'Treino metabolismo ativo', 'Sequência para manter o gasto energético alto.'],
    ['d', 'Corpo inteiro', 'Membros e core no mesmo bloco — treino completo.'],
    ['e', 'Core / Abdômen', 'Foco no centro — força e estabilidade.'],
    ['f', 'Pernas', 'Treino focado em pernas e glúteos — força e resistência.'],
  ]);

  add('danca', [
    ['a', 'Funk fitness', 'Ritmo, quadril e cardio com atitude.'],
    ['b', 'Sertanejo fitness', 'Dois tempos, muito movimento e diversão.'],
    ['c', 'Axé / Pagode / Pop', 'Mix brasileiro e hits para dançar em casa.'],
    ['d', 'Dança cardio', 'Playlist alta energia — suei com sorriso.'],
  ]);

  add('programas_desafios', [
    [
      'b7',
      'Bloqueador por 7 Dias',
      'Nos primeiros 7 dias o acesso fica restrito; pode desbloquear antes (demo).',
      { premium_unlock_price: 'R$ 7,90' },
    ],
    [
      'p0',
      'Protocolo Barriga Chapada — 7 dias',
      'Programa guiado dia a dia — compromisso com o resultado.',
      { highlighted_home_section: 'extras' },
    ],
    ['d1', 'Dia 1: treino leve', 'Primeiro dia: base técnica e aquecimento.'],
    ['d2', 'Dia 2: dança intensa', 'Cardio e coreografias sem parar.'],
    ['d3', 'Dia 3: foco barriga', 'Core e cintura no centro do treino.'],
    ['d4', 'Dia 4: descanso ativo', 'Mobilidade e respiração — recupera sem parar.'],
    ['d5', 'Dia 5: treino completo', 'Corpo inteiro em blocos curtos.'],
    ['d6', 'Dia 6: dança + cardio', 'Mix explosivo antes do último dia.'],
    ['d7', 'Dia 7: recuperação', 'Alongamento e fecho do protocolo.'],
    ['b1', 'Treino Secreto Bumbum', 'Série exclusiva — técnica, musicalidade e glúteos.'],
  ]);

  add('extras', [
    [
      'e1',
      'Receitas queima gordura',
      'Ideias de refeições que combinam com o teu plano.',
      { premium_unlock_price: 'R$ 12,90' },
    ],
    [
      'e2',
      'Manual da autoestima',
      'Conteúdo para fortalecer a cabeça junto com o corpo.',
      { premium_unlock_price: 'R$ 19,90' },
    ],
    ['e3', 'TPM / Hormonal — dança suave', 'Aulas pensadas para conforto nos dias mais sensíveis.'],
    ['e4', 'Guia anti-idade', 'Rotinas leves para disposição e vitalidade.'],
  ]);

  return { series, episodes };
}

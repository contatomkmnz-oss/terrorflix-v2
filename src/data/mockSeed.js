/**
 * Dados iniciais do catálogo em modo local (primeira carga ou após limpar localStorage).
 * Filmes: catálogo central `movieCatalog.js` com `categories[]`.
 */
import { profileAvatarsSeed } from '@/data/profileAvatars';
import { buildSeriesRowsFromMovieCatalog, buildEpisodesForMovieCatalogSeries } from '@/data/movieCatalog';
import { buildFitnessDemoCatalog } from '@/data/fitnessDemoSeries';

export function buildMockSeed() {
  const now = new Date().toISOString();

  const catalogSeries = buildSeriesRowsFromMovieCatalog();
  const { series: fitnessSeries, episodes: fitnessEpisodes } = buildFitnessDemoCatalog();

  return {
    User: [
      {
        id: 'user-demo-1',
        email: 'demo@local.dev',
        role: 'admin',
        activated: true,
        created_date: now,
      },
    ],
    Series: [...catalogSeries, ...fitnessSeries],
    Episode: [...fitnessEpisodes, ...buildEpisodesForMovieCatalogSeries()],
    FeaturedBanner: [
      { id: 'fb-1', series_id: 'movie-o-exorcista-1974', order: 0, active: true },
      { id: 'fb-2', series_id: 'movie-halloween-1978', order: 1, active: true },
    ],
    Avatar: [...profileAvatarsSeed.map((a) => ({ ...a }))],
    AccessCode: [
      {
        id: 'code-demo-1',
        code: 'DESENHOS-DEMO01',
        active: true,
        used_by: null,
        used_date: null,
        created_date: now,
      },
    ],
    SearchTerm: [],
    Profile: [],
    MyList: [],
    WatchHistory: [],
    ContentProposal: [],
    Subscription: [],
    Notification: [],
  };
}

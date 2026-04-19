/**
 * Seed idempotente: categorias, filmes/séries do catálogo, episódios demo, hero, admin.
 * Executar: `npx prisma db seed` (requer DATABASE_URL).
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  MOVIE_CATALOG,
  coverForCatalogEntry,
  bannerForCatalogEntry,
} from '../src/data/movieCatalog.js';
import { DEMO_VIDEO_MP4 } from '../src/constants/demoVideo.js';

const prisma = new PrismaClient();

function slugifyName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'categoria';
}

function slugFromCatalogId(id) {
  return String(id).replace(/^(movie|series)-/, '') || String(id);
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@localhost.dev').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-in-production';
  const hash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, passwordHash: hash, role: 'admin' },
    update: { passwordHash: hash },
  });

  const labelSet = new Set();
  for (const e of MOVIE_CATALOG) {
    for (const c of e.categories) labelSet.add(c);
  }
  const categoryByName = new Map();
  for (const name of labelSet) {
    const slug = slugifyName(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      create: { name, slug, type: 'both' },
      update: { name },
    });
    categoryByName.set(name, cat.id);
  }

  for (const [i, entry] of MOVIE_CATALOG.entries()) {
    const slug = slugFromCatalogId(entry.id);
    const posterImg = coverForCatalogEntry(entry, i);
    const bannerImg = bannerForCatalogEntry(entry, i);
    if (entry.kind === 'movie') {
      await prisma.movie.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          title: entry.title,
          slug,
          description: entry.description,
          year: entry.year,
          rating: entry.age_rating || '16',
          posterImage: posterImg,
          bannerImage: bannerImg,
          movieUrl: entry.movie_url || DEMO_VIDEO_MP4,
          isFeatured: true,
          isPublished: true,
          totalViews: entry.total_views ?? 5000,
          bannerObjectPosition: '50% center',
          highlightedHomeSection: '',
        },
        update: {
          title: entry.title,
          description: entry.description,
          year: entry.year,
          rating: entry.age_rating || '16',
          totalViews: entry.total_views ?? 5000,
          posterImage: posterImg,
          bannerImage: bannerImg,
          movieUrl: entry.movie_url || DEMO_VIDEO_MP4,
        },
      });
      await prisma.movieCategory.deleteMany({ where: { movieId: entry.id } });
      for (const catName of entry.categories) {
        const cid = categoryByName.get(catName);
        if (!cid) continue;
        await prisma.movieCategory.create({
          data: { movieId: entry.id, categoryId: cid },
        });
      }
    } else {
      await prisma.series.upsert({
        where: { id: entry.id },
        create: {
          id: entry.id,
          title: entry.title,
          slug,
          description: entry.description,
          year: entry.year,
          rating: entry.age_rating || '16',
          posterImage: posterImg,
          bannerImage: bannerImg,
          isFeatured: true,
          isPublished: true,
          totalViews: entry.total_views ?? 5000,
          bannerObjectPosition: '50% center',
          highlightedHomeSection: '',
        },
        update: {
          title: entry.title,
          description: entry.description,
          posterImage: posterImg,
          bannerImage: bannerImg,
        },
      });
      await prisma.seriesCategory.deleteMany({ where: { seriesId: entry.id } });
      for (const catName of entry.categories) {
        const cid = categoryByName.get(catName);
        if (!cid) continue;
        await prisma.seriesCategory.create({
          data: { seriesId: entry.id, categoryId: cid },
        });
      }
    }
  }

  await prisma.series.upsert({
    where: { id: 'series-3' },
    create: {
      id: 'series-3',
      title: 'Comédias Animadas',
      slug: 'comedias-animadas',
      description: 'Risadas garantidas.',
      year: 2012,
      rating: '10',
      posterImage: '/imagens/banners/poster-comedy.svg',
      bannerImage: '/imagens/banners/poster-comedy.svg',
      isFeatured: true,
      isPublished: true,
      totalViews: 6500,
    },
    update: {},
  });

  await prisma.series.upsert({
    where: { id: 'series-saga-1' },
    create: {
      id: 'series-saga-1',
      title: 'Maratona: Mistérios da Mansão',
      slug: 'maratona-misterios-da-mansao',
      description:
        'Saga completa — todos os episódios em sequência para assistir de uma vez.',
      year: 2020,
      rating: '16',
      posterImage: '/imagens/banners/hero-slide-1.svg',
      bannerImage: '/imagens/banners/hero-slide-1.svg',
      isFeatured: true,
      isPublished: true,
      totalViews: 4200,
    },
    update: {},
  });

  const episodes = [
    {
      id: 'ep-it-1990-1',
      seriesId: 'series-it-a-coisa-1990',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Parte 1',
      description: 'Derry e o palhaço.',
      videoUrl: DEMO_VIDEO_MP4,
      duration: 596,
      thumbnail: null,
    },
    {
      id: 'ep-it-1990-2',
      seriesId: 'series-it-a-coisa-1990',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Parte 2',
      description: '',
      videoUrl: DEMO_VIDEO_MP4,
      duration: 596,
    },
    {
      id: 'ep-saga-1',
      seriesId: 'series-saga-1',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Episódio 1 — O convite',
      description: 'Início da saga (demo).',
      videoUrl: DEMO_VIDEO_MP4,
      duration: 596,
      thumbnail: null,
    },
    {
      id: 'ep-saga-2',
      seriesId: 'series-saga-1',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'Episódio 2 — Portas fechadas',
      description: '',
      videoUrl: DEMO_VIDEO_MP4,
      duration: 596,
    },
  ];

  for (const ep of episodes) {
    const row = {
      ...ep,
      thumbnail: ep.thumbnail === '' || ep.thumbnail == null ? null : ep.thumbnail,
    };
    await prisma.episode.upsert({
      where: { id: row.id },
      create: row,
      update: {
        videoUrl: row.videoUrl,
        title: row.title,
        duration: row.duration,
      },
    });
  }

  const countHb = await prisma.heroBanner.count();
  if (countHb === 0) {
    const m1 = await prisma.movie.findUnique({ where: { id: 'movie-o-exorcista-1974' } });
    const m2 = await prisma.movie.findUnique({ where: { id: 'movie-halloween-1978' } });
    if (m1) {
      await prisma.heroBanner.create({
        data: {
          title: m1.title,
          image: m1.posterImage,
          linkedMovieId: m1.id,
          sortOrder: 0,
          isActive: true,
        },
      });
    }
    if (m2) {
      await prisma.heroBanner.create({
        data: {
          title: m2.title,
          image: m2.posterImage,
          linkedMovieId: m2.id,
          sortOrder: 1,
          isActive: true,
        },
      });
    }
  }

  console.log('Seed concluído. Admin:', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

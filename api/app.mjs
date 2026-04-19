import { Hono } from 'hono';
import { prisma } from './lib/prisma.mjs';
import {
  mergeSeriesLists,
  movieToSeriesRow,
  seriesToSeriesRow,
  episodeToRow,
  heroToFeaturedBanner,
} from './lib/mappers.mjs';
import {
  hashPassword,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
  buildSessionCookie,
  clearSessionCookie,
  getTokenFromCookie,
} from './lib/auth.mjs';
import {
  getBunnyStreamConfig,
  listBunnyVideos,
  createBunnyVideo,
  getBunnyVideo,
  bunnyStreamEmbedUrl,
} from './lib/bunnyStream.mjs';
import { z } from 'zod';

function slugify(input) {
  const s = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'item';
}

function newId(prefix) {
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${slugify('new')}-${r}`;
}

function sortMerged(rows, sortField) {
  let field = sortField || '-created_date';
  let desc = true;
  if (field.startsWith('-')) {
    desc = true;
    field = field.slice(1);
  } else {
    desc = false;
  }
  const key =
    field === 'created_date' ? 'created_date' : field === 'title' ? 'title' : 'created_date';
  return [...rows].sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    if (va === vb) return 0;
    const cmp = va < vb ? -1 : 1;
    return desc ? -cmp : cmp;
  });
}

function matchesSeriesRow(row, query) {
  if (!query || Object.keys(query).length === 0) return true;
  return Object.entries(query).every(([k, v]) => {
    if (v === undefined) return true;
    if (k === 'published' && v === true) return row[k] !== false;
    if (k === 'published' && v === false) return row[k] === false;
    const a = row[k];
    return a == v || String(a) === String(v);
  });
}

async function requireAdmin(c) {
  const token = getTokenFromCookie(c.req.header('cookie') || '');
  const payload = await verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    return c.json({ error: 'Não autorizado' }, 401);
  }
  return null;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function createApp() {
  const app = new Hono().basePath('/api');

  app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

  app.post('/auth/login', async (c) => {
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Dados inválidos' }, 400);
    const { email, password } = parsed.data;
    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return c.json({ error: 'Email ou senha incorretos' }, 401);
    }
    const token = await signAdminToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
    return c.json(
      { ok: true, user: { id: admin.id, email: admin.email, role: admin.role } },
      200,
      { 'Set-Cookie': buildSessionCookie(token) }
    );
  });

  app.post('/auth/logout', async (c) => {
    return c.json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
  });

  app.get('/auth/me', async (c) => {
    const token = getTokenFromCookie(c.req.header('cookie') || '');
    const payload = await verifyAdminToken(token);
    if (payload?.role === 'admin') {
      return c.json({
        id: payload.sub,
        email: payload.email,
        role: 'admin',
        activated: true,
      });
    }
    return c.json({
      id: 'guest-viewer',
      email: 'viewer@local',
      role: 'user',
      activated: true,
    });
  });

  /** Catálogo público: filme + série no formato legado `Series` */
  app.get('/catalog/series', async (c) => {
    const id = c.req.query('id');
    const published = c.req.query('published');
    const contentType = c.req.query('content_type');
    const sortField = c.req.query('sort') || '-created_date';
    const limit = c.req.query('limit') ? Number(c.req.query('limit')) : undefined;

    const movieWhere = {};
    const seriesWhere = {};
    if (published === 'true') {
      movieWhere.isPublished = true;
      seriesWhere.isPublished = true;
    } else if (published === 'false') {
      movieWhere.isPublished = false;
      seriesWhere.isPublished = false;
    }

    const [movies, seriesList] = await Promise.all([
      prisma.movie.findMany({
        where: id ? { id } : movieWhere,
        include: { categories: { include: { category: true } } },
      }),
      prisma.series.findMany({
        where: id ? { id } : seriesWhere,
        include: { categories: { include: { category: true } } },
      }),
    ]);

    let merged = mergeSeriesLists(movies, seriesList);
    if (id) {
      merged = merged.filter((r) => r.id === id);
    }
    if (contentType) {
      merged = merged.filter((r) => r.content_type === contentType);
    }

    const query = {};
    if (published === 'true') query.published = true;
    if (published === 'false') query.published = false;
    if (contentType) query.content_type = contentType;
    merged = merged.filter((r) => matchesSeriesRow(r, query));

    merged = sortMerged(merged, sortField);
    if (typeof limit === 'number' && limit > 0) merged = merged.slice(0, limit);
    return c.json(merged);
  });

  app.get('/catalog/episodes', async (c) => {
    const seriesId = c.req.query('series_id');
    const where = seriesId ? { seriesId } : {};
    const eps = await prisma.episode.findMany({
      where,
      orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }],
    });
    return c.json(eps.map(episodeToRow));
  });

  app.get('/catalog/banners', async (c) => {
    const active = c.req.query('active');
    const where =
      active === 'true' ? { isActive: true } : active === 'false' ? { isActive: false } : {};
    const list = await prisma.heroBanner.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return c.json(list.map(heroToFeaturedBanner));
  });

  app.get('/catalog/categories', async (c) => {
    const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return c.json(cats);
  });

  /** Admin */
  app.post('/admin/series', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const isMovie = body.content_type === 'movie';
    const title = String(body.title || '').trim();
    if (!title) return c.json({ error: 'Título obrigatório' }, 400);

    const slug = slugify(body.slug || title);
    const id = body.id?.trim() || (isMovie ? `movie-${slug}` : `series-${slug}`);

    const categoryLabels = Array.isArray(body.categories)
      ? body.categories.map((x) => String(x).trim()).filter(Boolean)
      : String(body.category || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

    if (isMovie) {
      const existing = await prisma.movie.findUnique({ where: { id } });
      if (existing) return c.json({ error: 'ID já existe' }, 409);

      const movie = await prisma.$transaction(async (tx) => {
        const catLinks = [];
        for (const name of categoryLabels) {
          const slugCat = slugify(name);
          const cat = await tx.category.upsert({
            where: { slug: slugCat },
            create: {
              name,
              slug: slugCat,
              type: 'movie',
            },
            update: { name },
          });
          catLinks.push(cat.id);
        }
        const m = await tx.movie.create({
          data: {
            id,
            title,
            slug: body.slug?.trim() || slug,
            description: String(body.description || ''),
            year: Number(body.year) || new Date().getFullYear(),
            rating: String(body.age_rating || body.rating || '16'),
            duration: body.duration != null ? Number(body.duration) : null,
            posterImage: String(body.cover_url || ''),
            bannerImage: String(body.banner_url || body.cover_url || ''),
            movieUrl: String(body.movie_url || '').trim() || null,
            trailerUrl: body.trailer_url ? String(body.trailer_url) : null,
            isFeatured: !!body.featured,
            isPublished: body.published !== false,
            totalViews: Number(body.total_views) || 0,
            bannerObjectPosition: body.banner_object_position || '50% center',
            highlightedHomeSection: body.highlighted_home_section || '',
            categories: {
              create: catLinks.map((cid) => ({
                category: { connect: { id: cid } },
              })),
            },
          },
          include: { categories: { include: { category: true } } },
        });
        return m;
      });
      return c.json(movieToSeriesRow(movie));
    }

    const existing = await prisma.series.findUnique({ where: { id } });
    if (existing) return c.json({ error: 'ID já existe' }, 409);

    const series = await prisma.$transaction(async (tx) => {
      const catLinks = [];
      for (const name of categoryLabels) {
        const slugCat = slugify(name);
        const cat = await tx.category.upsert({
          where: { slug: slugCat },
          create: { name, slug: slugCat, type: 'series' },
          update: { name },
        });
        catLinks.push(cat.id);
      }
      const s = await tx.series.create({
        data: {
          id,
          title,
          slug: body.slug?.trim() || slug,
          description: String(body.description || ''),
          year: Number(body.year) || new Date().getFullYear(),
          rating: String(body.age_rating || body.rating || '16'),
          posterImage: String(body.cover_url || ''),
          bannerImage: String(body.banner_url || body.cover_url || ''),
          isFeatured: !!body.featured,
          isPublished: body.published !== false,
          totalViews: Number(body.total_views) || 0,
          bannerObjectPosition: body.banner_object_position || '50% center',
          highlightedHomeSection: body.highlighted_home_section || '',
          categories: {
            create: catLinks.map((cid) => ({
              category: { connect: { id: cid } },
            })),
          },
        },
        include: { categories: { include: { category: true } } },
      });
      return s;
    });
    return c.json(seriesToSeriesRow(series));
  });

  app.patch('/admin/series/:id', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const rawId = c.req.param('id');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }

    const movie = await prisma.movie.findUnique({
      where: { id: rawId },
      include: { categories: true },
    });
    if (movie) {
      const categoryLabels = Array.isArray(body.categories)
        ? body.categories.map((x) => String(x).trim()).filter(Boolean)
        : undefined;

      await prisma.$transaction(async (tx) => {
        await tx.movie.update({
          where: { id: rawId },
          data: {
            title: body.title != null ? String(body.title) : undefined,
            slug: body.slug != null ? String(body.slug) : undefined,
            description: body.description != null ? String(body.description) : undefined,
            year: body.year != null ? Number(body.year) : undefined,
            rating: body.age_rating != null || body.rating != null ? String(body.age_rating || body.rating) : undefined,
            duration: body.duration !== undefined ? (body.duration != null ? Number(body.duration) : null) : undefined,
            posterImage: body.cover_url !== undefined ? String(body.cover_url || '') : undefined,
            bannerImage: body.banner_url !== undefined ? String(body.banner_url || '') : undefined,
            movieUrl: body.movie_url !== undefined ? String(body.movie_url || '').trim() || null : undefined,
            trailerUrl: body.trailer_url !== undefined ? body.trailer_url : undefined,
            isFeatured: body.featured !== undefined ? !!body.featured : undefined,
            isPublished: body.published !== undefined ? body.published !== false : undefined,
            totalViews: body.total_views != null ? Number(body.total_views) : undefined,
            bannerObjectPosition: body.banner_object_position,
            highlightedHomeSection: body.highlighted_home_section,
          },
        });
        if (categoryLabels) {
          await tx.movieCategory.deleteMany({ where: { movieId: rawId } });
          for (const name of categoryLabels) {
            const slugCat = slugify(name);
            const cat = await tx.category.upsert({
              where: { slug: slugCat },
              create: { name, slug: slugCat, type: 'movie' },
              update: { name },
            });
            await tx.movieCategory.create({
              data: { movieId: rawId, categoryId: cat.id },
            });
          }
        }
      });
      const updated = await prisma.movie.findUnique({
        where: { id: rawId },
        include: { categories: { include: { category: true } } },
      });
      return c.json(movieToSeriesRow(updated));
    }

    const series = await prisma.series.findUnique({ where: { id: rawId } });
    if (!series) return c.json({ error: 'Não encontrado' }, 404);

    const categoryLabels = Array.isArray(body.categories)
      ? body.categories.map((x) => String(x).trim()).filter(Boolean)
      : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.series.update({
        where: { id: rawId },
        data: {
          title: body.title != null ? String(body.title) : undefined,
          slug: body.slug != null ? String(body.slug) : undefined,
          description: body.description != null ? String(body.description) : undefined,
          year: body.year != null ? Number(body.year) : undefined,
          rating: body.age_rating != null || body.rating != null ? String(body.age_rating || body.rating) : undefined,
          posterImage: body.cover_url !== undefined ? String(body.cover_url || '') : undefined,
          bannerImage: body.banner_url !== undefined ? String(body.banner_url || '') : undefined,
          isFeatured: body.featured !== undefined ? !!body.featured : undefined,
          isPublished: body.published !== undefined ? body.published !== false : undefined,
          totalViews: body.total_views != null ? Number(body.total_views) : undefined,
          bannerObjectPosition: body.banner_object_position,
          highlightedHomeSection: body.highlighted_home_section,
        },
      });
      if (categoryLabels) {
        await tx.seriesCategory.deleteMany({ where: { seriesId: rawId } });
        for (const name of categoryLabels) {
          const slugCat = slugify(name);
          const cat = await tx.category.upsert({
            where: { slug: slugCat },
            create: { name, slug: slugCat, type: 'series' },
            update: { name },
          });
          await tx.seriesCategory.create({
            data: { seriesId: rawId, categoryId: cat.id },
          });
        }
      }
    });
    const updated = await prisma.series.findUnique({
      where: { id: rawId },
      include: { categories: { include: { category: true } } },
    });
    return c.json(seriesToSeriesRow(updated));
  });

  app.delete('/admin/series/:id', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const rawId = c.req.param('id');
    const m = await prisma.movie.findUnique({ where: { id: rawId } });
    if (m) {
      await prisma.movie.delete({ where: { id: rawId } });
      return c.json({ ok: true });
    }
    const s = await prisma.series.findUnique({ where: { id: rawId } });
    if (s) {
      await prisma.series.delete({ where: { id: rawId } });
      return c.json({ ok: true });
    }
    return c.json({ error: 'Não encontrado' }, 404);
  });

  app.post('/admin/episodes', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const seriesId = String(body.series_id || '').trim();
    if (!seriesId) return c.json({ error: 'series_id obrigatório' }, 400);
    const epId = body.id?.trim() || newId('ep');
    const ep = await prisma.episode.create({
      data: {
        id: epId,
        seriesId,
        seasonNumber: Number(body.season) || 1,
        episodeNumber: Number(body.number) || 1,
        title: String(body.title || ''),
        description: body.description ? String(body.description) : null,
        videoUrl: String(body.video_url || ''),
        thumbnail: body.thumbnail_url ? String(body.thumbnail_url) : null,
        duration: body.duration != null ? Number(body.duration) : null,
      },
    });
    return c.json(episodeToRow(ep));
  });

  app.patch('/admin/episodes/:id', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const id = c.req.param('id');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const ep = await prisma.episode.update({
      where: { id },
      data: {
        seasonNumber: body.season != null ? Number(body.season) : undefined,
        episodeNumber: body.number != null ? Number(body.number) : undefined,
        title: body.title != null ? String(body.title) : undefined,
        description: body.description !== undefined ? body.description : undefined,
        videoUrl: body.video_url !== undefined ? String(body.video_url || '') : undefined,
        thumbnail: body.thumbnail_url !== undefined ? body.thumbnail_url : undefined,
        duration: body.duration !== undefined ? Number(body.duration) : undefined,
      },
    });
    return c.json(episodeToRow(ep));
  });

  app.delete('/admin/episodes/:id', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const id = c.req.param('id');
    await prisma.episode.delete({ where: { id } });
    return c.json({ ok: true });
  });

  app.post('/admin/hero-banners', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const linkedId = String(body.series_id || '').trim();
    let linkedMovieId = null;
    let linkedSeriesId = null;
    if (linkedId) {
      const mv = await prisma.movie.findUnique({ where: { id: linkedId } });
      if (mv) linkedMovieId = mv.id;
      else {
        const sv = await prisma.series.findUnique({ where: { id: linkedId } });
        if (sv) linkedSeriesId = sv.id;
      }
    }
    let title = String(body.title || '').trim();
    let image = String(body.image || '').trim();
    if (linkedMovieId || linkedSeriesId) {
      const mv = linkedMovieId
        ? await prisma.movie.findUnique({ where: { id: linkedMovieId } })
        : null;
      const sv = linkedSeriesId
        ? await prisma.series.findUnique({ where: { id: linkedSeriesId } })
        : null;
      const row = mv || sv;
      if (row) {
        if (!title) title = row.title;
        if (!image) image = row.posterImage || row.bannerImage || '';
      }
    }
    if (!title) title = 'Destaque';

    const hb = await prisma.heroBanner.create({
      data: {
        title,
        subtitle: body.subtitle || null,
        description: body.description || null,
        image: image || '/imagens/banners/poster-movie.svg',
        linkedMovieId,
        linkedSeriesId,
        customUrl: body.custom_url || null,
        detailUrl: body.detail_url ? String(body.detail_url) : null,
        bannerObjectPosition: body.banner_object_position
          ? String(body.banner_object_position)
          : null,
        heroYear: body.hero_year != null ? String(body.hero_year) : null,
        heroRating: body.hero_rating != null ? String(body.hero_rating) : null,
        heroCategory: body.hero_category != null ? String(body.hero_category) : null,
        sortOrder: body.order != null ? Number(body.order) : 0,
        isActive: body.active !== false,
      },
    });
    return c.json(heroToFeaturedBanner(hb));
  });

  app.patch('/admin/hero-banners/:id', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const id = c.req.param('id');
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const data = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.subtitle !== undefined) data.subtitle = body.subtitle;
    if (body.description !== undefined) data.description = body.description;
    if (body.image !== undefined) data.image = String(body.image);
    if (body.order !== undefined) data.sortOrder = Number(body.order);
    if (body.active !== undefined) data.isActive = !!body.active;
    if (body.custom_url !== undefined) data.customUrl = body.custom_url;
    if (body.detail_url !== undefined) data.detailUrl = body.detail_url || null;
    if (body.banner_object_position !== undefined)
      data.bannerObjectPosition = body.banner_object_position || null;
    if (body.hero_year !== undefined) data.heroYear = body.hero_year || null;
    if (body.hero_rating !== undefined) data.heroRating = body.hero_rating || null;
    if (body.hero_category !== undefined) data.heroCategory = body.hero_category || null;
    if (body.series_id !== undefined) {
      const linkedId = String(body.series_id || '').trim();
      data.linkedMovieId = null;
      data.linkedSeriesId = null;
      if (linkedId) {
        const mv = await prisma.movie.findUnique({ where: { id: linkedId } });
        if (mv) data.linkedMovieId = mv.id;
        else {
          const sv = await prisma.series.findUnique({ where: { id: linkedId } });
          if (sv) data.linkedSeriesId = sv.id;
        }
      }
    }
    const hb = await prisma.heroBanner.update({ where: { id }, data });
    return c.json(heroToFeaturedBanner(hb));
  });

  app.delete('/admin/hero-banners/:id', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const id = c.req.param('id');
    await prisma.heroBanner.delete({ where: { id } });
    return c.json({ ok: true });
  });

  /** Bunny Stream: listar vídeos da biblioteca (admin; chave só no servidor). */
  app.get('/admin/bunny/videos', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const cfg = getBunnyStreamConfig();
    if (!cfg) {
      return c.json(
        {
          error:
            'Bunny Stream não configurado. Defina BUNNY_STREAM_LIBRARY_ID e BUNNY_STREAM_API_KEY no .env (ver .env.example).',
        },
        503
      );
    }
    const page = Math.max(1, Number(c.req.query('page') || 1));
    const itemsPerPage = Math.min(100, Math.max(1, Number(c.req.query('itemsPerPage') || 50)));
    const collection =
      String(c.req.query('collection') || c.req.query('collectionId') || '').trim() ||
      String(process.env.BUNNY_STREAM_COLLECTION_ID || '').trim();
    const search = String(c.req.query('search') || '').trim();
    const orderBy = String(c.req.query('orderBy') || '').trim();
    try {
      const data = await listBunnyVideos(cfg, {
        page,
        itemsPerPage,
        collection: collection || undefined,
        search: search || undefined,
        orderBy: orderBy || undefined,
      });
      const lib = cfg.libraryId;
      const enriched =
        data && Array.isArray(data.items)
          ? {
              ...data,
              items: data.items.map((it) => {
                const guid = it?.guid || it?.Guid;
                return guid
                  ? { ...it, embedUrl: bunnyStreamEmbedUrl(lib, guid) }
                  : it;
              }),
            }
          : data;
      return c.json(enriched);
    } catch (e) {
      const status = Number(e.status) >= 400 ? Number(e.status) : 502;
      return c.json({ error: String(e.message || e) }, status);
    }
  });

  app.get('/admin/bunny/videos/:videoId', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const cfg = getBunnyStreamConfig();
    if (!cfg) return c.json({ error: 'Bunny Stream não configurado.' }, 503);
    const videoId = c.req.param('videoId');
    try {
      const data = await getBunnyVideo(cfg, videoId);
      const embedUrl = bunnyStreamEmbedUrl(cfg.libraryId, videoId);
      return c.json({ ...data, embedUrl });
    } catch (e) {
      const status = Number(e.status) >= 400 ? Number(e.status) : 502;
      return c.json({ error: String(e.message || e) }, status);
    }
  });

  app.post('/admin/bunny/videos', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;
    const cfg = getBunnyStreamConfig();
    if (!cfg) return c.json({ error: 'Bunny Stream não configurado.' }, 503);
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'JSON inválido' }, 400);
    }
    const title = String(body?.title || 'Novo vídeo').trim() || 'Novo vídeo';
    try {
      const created = await createBunnyVideo(cfg, { title });
      const guid = created?.guid || created?.Guid;
      const embedUrl = guid ? bunnyStreamEmbedUrl(cfg.libraryId, guid) : null;
      return c.json({ ...created, embedUrl });
    } catch (e) {
      const status = Number(e.status) >= 400 ? Number(e.status) : 502;
      return c.json({ error: String(e.message || e) }, status);
    }
  });

  /** Resolver slug → id (filme ou série) */
  app.get('/catalog/resolve/:slug', async (c) => {
    const slug = c.req.param('slug');
    const movie = await prisma.movie.findUnique({ where: { slug } });
    if (movie) return c.json({ type: 'movie', id: movie.id, slug: movie.slug });
    const series = await prisma.series.findUnique({ where: { slug } });
    if (series) return c.json({ type: 'series', id: series.id, slug: series.slug });
    return c.json({ error: 'Não encontrado' }, 404);
  });

  return app;
}

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Support both direct call and entity automation payload
    const episodeData = body.data || body;
    const episodeId = episodeData?.id || body?.event?.entity_id;
    const seriesId = episodeData?.series_id;

    if (!seriesId) {
      return Response.json({ error: 'Missing series_id' }, { status: 400 });
    }

    // Fetch the series info
    const seriesList = await base44.asServiceRole.entities.Series.filter({ id: seriesId });
    const series = seriesList[0];
    if (!series) {
      return Response.json({ error: 'Series not found' }, { status: 404 });
    }

    // Get episode details (use data from payload or fetch)
    let episode = episodeData;
    if (!episode?.title && episodeId) {
      const epList = await base44.asServiceRole.entities.Episode.filter({ id: episodeId });
      episode = epList[0];
    }

    // Find all MyList entries for this series
    const myListEntries = await base44.asServiceRole.entities.MyList.filter({ series_id: seriesId });
    if (!myListEntries || myListEntries.length === 0) {
      return Response.json({ message: 'No users have this series in their list', notified: 0 });
    }

    // Get unique profile IDs
    const profileIds = [...new Set(myListEntries.map(m => m.profile_id))];

    // Fetch profiles to get user emails
    const profiles = await Promise.all(
      profileIds.map(pid => base44.asServiceRole.entities.Profile.filter({ id: pid }).then(r => r[0]).catch(() => null))
    );

    // Get unique user emails from profiles
    const userEmails = [...new Set(profiles.filter(Boolean).map(p => p.user_email).filter(Boolean))];

    if (userEmails.length === 0) {
      return Response.json({ message: 'No user emails found', notified: 0 });
    }

    // Send email to each user
    const episodeLabel = episode?.title
      ? `"${episode.title}"${episode.number ? ` (Ep. ${episode.number})` : ''}`
      : 'Novo episódio';

    const seasonLabel = episode?.season ? ` - Temporada ${episode.season}` : '';

    await Promise.all(
      userEmails.map(email =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `🎬 Novo episódio de ${series.title} no DesenhosFlix!`,
          body: `
            <div style="font-family: Arial, sans-serif; background: #0F0F0F; color: #fff; padding: 32px; max-width: 600px; margin: 0 auto; border-radius: 12px;">
              <h1 style="color: #E50914; font-size: 28px; margin-bottom: 8px;">DesenhosFlix</h1>
              <h2 style="font-size: 22px; margin-bottom: 16px;">Novo episódio disponível! 🎉</h2>
              ${series.cover_url ? `<img src="${series.cover_url}" alt="${series.title}" style="width: 100%; border-radius: 8px; margin-bottom: 16px;" />` : ''}
              <p style="font-size: 18px; color: #FFC107; font-weight: bold;">${series.title}${seasonLabel}</p>
              <p style="font-size: 16px; color: #ccc; margin-bottom: 24px;">${episodeLabel} já está disponível para assistir!</p>
              <a href="https://desenhos-flix.base44.app/SeriesDetail?id=${seriesId}" 
                 style="display: inline-block; background: #E50914; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                ▶ Assistir Agora
              </a>
              <p style="margin-top: 24px; font-size: 12px; color: #555;">Você recebeu este email porque esta série está na sua lista no DesenhosFlix.</p>
            </div>
          `
        })
      )
    );

    return Response.json({ 
      message: 'Notifications sent successfully', 
      series: series.title,
      episode: episode?.title,
      notified: userEmails.length 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
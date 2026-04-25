import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user?.role || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const BUNNY_STREAM_API_KEY = Deno.env.get("BUNNY_STREAM_API_KEY");
        const libraryId = "625261";
        const CDN_HOSTNAME = "vz-51bdfa4b-2a1.b-cdn.net";

        if (!BUNNY_STREAM_API_KEY) {
            return Response.json({ error: 'BUNNY_STREAM_API_KEY not set' }, { status: 500 });
        }

        // Fetch all collections
        const collectionsRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections`, {
            headers: { 'AccessKey': BUNNY_STREAM_API_KEY }
        });

        if (!collectionsRes.ok) {
            return Response.json({ error: `Failed to fetch collections: ${collectionsRes.status}` }, { status: 500 });
        }

        const collectionsData = await collectionsRes.json();
        const collections = collectionsData.items || [];

        // Fetch all series
        const series = await base44.asServiceRole.entities.Series.list('-created_date', 500);

        let syncedSeries = 0;
        const results = [];

        // For each collection, find matching series and sync videos
        for (const collection of collections) {
            const collectionName = collection.name.toLowerCase().trim();
            const matchingSeries = series.find(s => s.title.toLowerCase().trim() === collectionName);

            if (matchingSeries) {
                // Fetch videos for this collection
                const videosRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
                    headers: { 'AccessKey': BUNNY_STREAM_API_KEY }
                });

                if (!videosRes.ok) continue;

                const videosData = await videosRes.json();
                const allVideos = videosData.items || [];
                const videos = allVideos.filter(v => v.collectionId === collection.guid || v.collection?.id === collection.guid);

                // Fetch episodes for this series
                const episodes = await base44.asServiceRole.entities.Episode.filter({ 
                    series_id: matchingSeries.id 
                });

                let seriesSyncedCount = 0;

                // Match and update episodes with Bunny videos
                for (const video of videos) {
                    const matchingEpisode = episodes.find(e => {
                        const videoTitle = video.title.toLowerCase().trim();
                        const episodeTitle = e.title.toLowerCase().trim();
                        return videoTitle.includes(episodeTitle) || episodeTitle.includes(videoTitle);
                    });

                    if (matchingEpisode) {
                        const videoUrl = `https://${CDN_HOSTNAME}/${video.guid}/playlist.m3u8`;
                        await base44.asServiceRole.entities.Episode.update(matchingEpisode.id, {
                            video_url: videoUrl,
                            thumbnail_url: video.thumbnail || null
                        });
                        seriesSyncedCount++;
                    }
                }

                if (seriesSyncedCount > 0) {
                    syncedSeries++;
                    results.push({
                        series: matchingSeries.title,
                        episodesSynced: seriesSyncedCount,
                        totalVideos: videos.length
                    });
                }
            }
        }

        return Response.json({ 
            message: 'Auto-sync completed',
            seriesSynced: syncedSeries,
            totalCollections: collections.length,
            details: results
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
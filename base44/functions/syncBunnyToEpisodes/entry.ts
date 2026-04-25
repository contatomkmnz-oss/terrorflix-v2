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

        if (!BUNNY_STREAM_API_KEY) {
            return Response.json({ error: 'BUNNY_STREAM_API_KEY not set' }, { status: 500 });
        }

        // Fetch all collections
        const collectionsRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections`, {
            headers: {
                'AccessKey': BUNNY_STREAM_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!collectionsRes.ok) {
            return Response.json({ error: 'Failed to fetch collections' }, { status: 500 });
        }

        const collections = await collectionsRes.json();
        let syncedCount = 0;

        // For each collection, try to match with series and update episodes
        for (const collection of collections.items || []) {
            // Find matching series by name
            const seriesList = await base44.asServiceRole.entities.Series.list();
            const matchingSeries = seriesList.find(s => 
                s.title.toLowerCase().includes(collection.name.toLowerCase()) ||
                collection.name.toLowerCase().includes(s.title.toLowerCase())
            );

            if (!matchingSeries) continue;

            // Fetch videos from collection
            const videosRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collection.guid}/videos`, {
                headers: {
                    'AccessKey': BUNNY_STREAM_API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (!videosRes.ok) continue;

            const videosData = await videosRes.json();
            const videos = videosData.items || [];

            // Update episodes with Bunny video URLs
            for (const video of videos) {
                const episodes = await base44.asServiceRole.entities.Episode.filter({ 
                    series_id: matchingSeries.id 
                });

                // Try to match episode by title or number
                const matchingEpisode = episodes.find(e => {
                    const videoTitle = video.title.toLowerCase();
                    const episodeTitle = e.title.toLowerCase();
                    return videoTitle.includes(episodeTitle) || episodeTitle.includes(videoTitle);
                });

                if (matchingEpisode) {
                    await base44.asServiceRole.entities.Episode.update(matchingEpisode.id, {
                        video_url: `https://${video.videoLibraryId}.b-cdn.net/${video.guid}/playlist.m3u8`,
                        thumbnail_url: video.thumbnail
                    });
                    syncedCount++;
                }
            }
        }

        return Response.json({ 
            message: 'Sync completed',
            syncedEpisodes: syncedCount,
            collectionsProcessed: collections.items?.length || 0
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user?.role || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { collectionId, seriesId } = body;

        if (!collectionId || !seriesId) {
            return Response.json({ error: 'collectionId and seriesId are required' }, { status: 400 });
        }

        const BUNNY_STREAM_API_KEY = Deno.env.get("BUNNY_STREAM_API_KEY");
        const libraryId = "625261";
        const CDN_HOSTNAME = "vz-51bdfa4b-2a1.b-cdn.net";

        if (!BUNNY_STREAM_API_KEY) {
            return Response.json({ error: 'BUNNY_STREAM_API_KEY not set' }, { status: 500 });
        }

        // Fetch all videos and filter by collection
        const videosRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
            headers: {
                'AccessKey': BUNNY_STREAM_API_KEY
            }
        });

        if (!videosRes.ok) {
            return Response.json({ error: `Failed to fetch videos: ${videosRes.status}` }, { status: 500 });
        }

        const videosData = await videosRes.json();
        const allVideos = videosData.items || [];
        
        // Filter videos by collection ID
        const videos = allVideos.filter(v => v.collectionId === collectionId || v.collection?.id === collectionId);

        // Fetch episodes from series
        const episodes = await base44.asServiceRole.entities.Episode.filter({ 
            series_id: seriesId 
        });

        let syncedCount = 0;

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
                syncedCount++;
            }
        }

        return Response.json({ 
            message: 'Sync completed',
            syncedEpisodes: syncedCount,
            totalVideos: videos.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
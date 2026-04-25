import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { collectionId } = body;

        if (!collectionId) {
            return Response.json({ error: 'collectionId is required' }, { status: 400 });
        }

        const BUNNY_STREAM_API_KEY = Deno.env.get("BUNNY_STREAM_API_KEY");
        const libraryId = "625261";

        if (!BUNNY_STREAM_API_KEY) {
            return Response.json({ error: 'BUNNY_STREAM_API_KEY not set' }, { status: 500 });
        }

        const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/collections/${collectionId}/videos`, {
            headers: {
                'AccessKey': BUNNY_STREAM_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return Response.json({ error: `Bunny.net API error: ${response.status} - ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return Response.json({ videos: data });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
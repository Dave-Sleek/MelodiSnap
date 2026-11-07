export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const artist = url.searchParams.get('artist');
  const album = url.searchParams.get('album');
  const duration = url.searchParams.get('duration');

  if (!title || !artist) {
    return new Response(
      JSON.stringify({ error: 'Title and artist query parameters are required.' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  const cleanTitle = title.trim().replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*\[.*?\]\s*/g, ' ').trim();
  const cleanArtist = artist.trim();

  try {
    // 1. Direct query on LRCLIB
    try {
      const lrclibUrl = new URL('https://lrclib.net/api/get');
      lrclibUrl.searchParams.append('artist_name', cleanArtist);
      lrclibUrl.searchParams.append('track_name', cleanTitle);
      if (album) lrclibUrl.searchParams.append('album_name', album.trim());
      if (duration) lrclibUrl.searchParams.append('duration', duration);

      const lrclibRes = await fetch(lrclibUrl.toString(), {
        headers: { 'User-Agent': 'melodisnap/1.0 (https://melodisnap.vercel.app)' },
      });

      if (lrclibRes.ok) {
        const data = await lrclibRes.json();
        if (data && (data.syncedLyrics || data.plainLyrics)) {
          return new Response(
            JSON.stringify({
              status: 'success',
              source: 'lrclib',
              title: data.trackName || title,
              artist: data.artistName || artist,
              syncedLyrics: data.syncedLyrics || null,
              plainLyrics: data.plainLyrics || null,
              instrumental: Boolean(data.instrumental),
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
      }
    } catch {
      // Fallback
    }

    // 2. Fuzzy search query on LRCLIB
    try {
      const searchUrl = new URL('https://lrclib.net/api/search');
      searchUrl.searchParams.append('q', `${cleanTitle} ${cleanArtist}`);

      const searchRes = await fetch(searchUrl.toString(), {
        headers: { 'User-Agent': 'melodisnap/1.0 (https://melodisnap.vercel.app)' },
      });

      if (searchRes.ok) {
        const searchList = await searchRes.json();
        if (Array.isArray(searchList) && searchList.length > 0) {
          const match = searchList.find((item: any) => item.syncedLyrics || item.plainLyrics) || searchList[0];
          if (match && (match.syncedLyrics || match.plainLyrics)) {
            return new Response(
              JSON.stringify({
                status: 'success',
                source: 'lrclib-search',
                title: match.trackName || title,
                artist: match.artistName || artist,
                syncedLyrics: match.syncedLyrics || null,
                plainLyrics: match.plainLyrics || null,
                instrumental: Boolean(match.instrumental),
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  ...corsHeaders,
                },
              }
            );
          }
        }
      }
    } catch {
      // Fallback
    }

    // 3. AudD Lyrics Fallback
    const apiToken = process.env.AUDD_API_TOKEN;
    if (apiToken) {
      try {
        const auddUrl = new URL('https://api.audd.io/findLyrics/');
        auddUrl.searchParams.append('api_token', apiToken);
        auddUrl.searchParams.append('q', `${cleanArtist} ${cleanTitle}`);

        const auddRes = await fetch(auddUrl.toString());
        if (auddRes.ok) {
          const auddData = await auddRes.json();
          if (auddData?.status === 'success' && auddData.result?.lyrics) {
            return new Response(
              JSON.stringify({
                status: 'success',
                source: 'audd',
                title: auddData.result.title || title,
                artist: auddData.result.artist || artist,
                syncedLyrics: null,
                plainLyrics: auddData.result.lyrics,
                instrumental: false,
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  ...corsHeaders,
                },
              }
            );
          }
        }
      } catch {
        // Fallback finished
      }
    }

    return new Response(
      JSON.stringify({
        status: 'not_found',
        error: 'Lyrics not found for this track in public archives.',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve lyrics for this song.' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

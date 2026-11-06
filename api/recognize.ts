export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: `Method ${request.method} not allowed` }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const apiToken = process.env.AUDD_API_TOKEN;
    if (!apiToken) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'AudD API token is missing on Vercel.',
          detail: 'Please configure AUDD_API_TOKEN in your Vercel Project Settings > Environment Variables, then redeploy.',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const formData = await request.formData();
    const audioEntry = formData.get('audio') || formData.get('file');

    if (!audioEntry || !(audioEntry instanceof Blob)) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'No audio file provided in the request.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const arrayBuffer = await audioEntry.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Audio recording was empty. Please check your microphone and try again.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const bytes = new Uint8Array(arrayBuffer);

    // Detect actual container format from file magic bytes for 100% reliable decoding
    let extension = 'webm';
    let mime = audioEntry.type || 'audio/webm';

    if (bytes.length >= 4) {
      // WebM / Matroska (0x1A 0x45 0xDF 0xA3)
      if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
        extension = 'webm';
        mime = 'audio/webm';
      } else if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
        // OggS
        extension = 'ogg';
        mime = 'audio/ogg';
      } else if (bytes.length >= 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
        // ftyp -> MP4
        extension = 'mp4';
        mime = 'audio/mp4';
      } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        // RIFF -> WAV
        extension = 'wav';
        mime = 'audio/wav';
      } else if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        // ID3 -> MP3
        extension = 'mp3';
        mime = 'audio/mpeg';
      } else if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
        // MPEG frame sync -> MP3
        extension = 'mp3';
        mime = 'audio/mpeg';
      } else if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
        // fLaC
        extension = 'flac';
        mime = 'audio/flac';
      } else if (audioEntry.type?.includes('mp3') || audioEntry.type?.includes('mpeg')) {
        extension = 'mp3';
        mime = 'audio/mpeg';
      } else if (audioEntry.type?.includes('mp4') || audioEntry.type?.includes('m4a') || audioEntry.type?.includes('aac')) {
        extension = 'm4a';
        mime = 'audio/mp4';
      } else if (audioEntry.type?.includes('flac')) {
        extension = 'flac';
        mime = 'audio/flac';
      } else if (audioEntry.type?.includes('wav')) {
        extension = 'wav';
        mime = 'audio/wav';
      } else if (audioEntry.type?.includes('webm')) {
        extension = 'webm';
        mime = 'audio/webm';
      } else if (audioEntry.type?.includes('ogg')) {
        extension = 'ogg';
        mime = 'audio/ogg';
      }
    }

    const forwardData = new FormData();
    forwardData.append(
      'file',
      new Blob([arrayBuffer], { type: mime }),
      `recording.${extension}`
    );
    forwardData.append('api_token', apiToken);
    forwardData.append('return', 'spotify,apple_music');

    const auddResponse = await fetch('https://api.audd.io/', {
      method: 'POST',
      body: forwardData,
    });

    if (!auddResponse.ok) {
      const errText = await auddResponse.text();
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'AudD recognition service connection failed.',
          detail: errText,
        }),
        {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const auddData = await auddResponse.json();

    if (auddData.status === 'error') {
      const isAcousticFail = auddData.error?.error_code === 300;
      return new Response(
        JSON.stringify({
          status: 'error',
          error: isAcousticFail
            ? "Could not hear the song clearly. Please hold your device closer to the music, let it listen for at least 5-8 seconds, and try again."
            : (auddData.error?.error_message || 'Recognition service returned an error.'),
          detail: auddData.error?.error_message,
          code: auddData.error?.error_code,
        }),
        {
          status: isAcousticFail ? 422 : 502,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(JSON.stringify(auddData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message || 'Internal recognition error',
      }),
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

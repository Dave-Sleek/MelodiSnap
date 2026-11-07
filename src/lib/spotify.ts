/**
 * Spotify OAuth 2.0 with PKCE
 * Uses SPOTIFY_CLIENT_ID (without VITE_ prefix)
 */

export const getSpotifyRedirectUri = () => {
  return `${window.location.origin}/callback`;
};

// Fetches SPOTIFY_CLIENT_ID from build environment or runtime edge/server endpoint
export const getSpotifyClientId = async (): Promise<string> => {
  // 1. Direct from build-time / Vite environment
  const envId = (import.meta as any).env?.SPOTIFY_CLIENT_ID || (process as any).env?.SPOTIFY_CLIENT_ID;
  if (envId) return envId;

  // 2. Check cached in localStorage
  const cached = localStorage.getItem('spotify_client_id_cached');
  if (cached) return cached;

  // 3. Runtime fetch from /api/spotify-config (serves Vercel/Node runtime process.env.SPOTIFY_CLIENT_ID)
  try {
    const res = await fetch('/api/spotify-config');
    if (res.ok) {
      const data = await res.json();
      if (data.clientId) {
        localStorage.setItem('spotify_client_id_cached', data.clientId);
        return data.clientId;
      }
    }
  } catch {
    // fallback
  }

  return '';
};

const SCOPES = [
  'user-library-modify',
  'user-library-read',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-private',
  'user-read-email'
];

export const generateCodeVerifier = (length: number) => {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const generateCodeChallenge = async (codeVerifier: string) => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const loginWithSpotify = async () => {
  const clientId = await getSpotifyClientId();
  if (!clientId) {
    throw new Error('Spotify Client ID is not set. Please set SPOTIFY_CLIENT_ID in your environment variables.');
  }

  const codeVerifier = generateCodeVerifier(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const redirectUri = getSpotifyRedirectUri();
  
  localStorage.setItem('spotify_code_verifier', codeVerifier);
  localStorage.setItem('spotify_redirect_uri', redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPES.join(' '),
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getSpotifyToken = async (code: string) => {
  const clientId = await getSpotifyClientId();
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  const redirectUri = localStorage.getItem('spotify_redirect_uri') || getSpotifyRedirectUri();

  if (!clientId) {
    throw new Error('Spotify Client ID is missing. Please set SPOTIFY_CLIENT_ID in your environment.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier || '',
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  if (data.access_token) {
    localStorage.setItem('spotify_access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
    localStorage.setItem('spotify_token_expiry', (Date.now() + data.expires_in * 1000).toString());
    localStorage.removeItem('spotify_code_verifier');
  }
  return data;
};

export const refreshSpotifyToken = async () => {
  const clientId = await getSpotifyClientId();
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (!refreshToken || !clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem('spotify_access_token', data.access_token);
    localStorage.setItem('spotify_token_expiry', (Date.now() + data.expires_in * 1000).toString());
    if (data.refresh_token) {
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
    }
  }
  return data.access_token;
};

export const getValidSpotifyToken = async () => {
  const token = localStorage.getItem('spotify_access_token');
  const expiry = localStorage.getItem('spotify_token_expiry');

  if (!token || !expiry) return null;

  if (Date.now() > parseInt(expiry) - 60000) {
    return await refreshSpotifyToken();
  }

  return token;
};

export const isSpotifyConnected = () => {
  return Boolean(localStorage.getItem('spotify_access_token'));
};

export const saveTracksToSpotify = async (spotifyTrackIds: string[]) => {
  const token = await getValidSpotifyToken();
  if (!token) throw new Error('Not connected to Spotify. Please connect in the Connect tab.');

  const validIds = spotifyTrackIds.filter(Boolean).slice(0, 50);
  if (validIds.length === 0) return { count: 0 };

  const res = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${validIds.join(',')}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to save tracks to Spotify');
  }

  return { count: validIds.length };
};

/**
 * Spotify OAuth 2.0 with PKCE
 */

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback/spotify`;
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
  const codeVerifier = generateCodeVerifier(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPES.join(' '),
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getSpotifyToken = async (code: string) => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier!,
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
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
    localStorage.setItem('spotify_token_expiry', (Date.now() + data.expires_in * 1000).toString());
  }
  return data;
};

export const refreshSpotifyToken = async () => {
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (!refreshToken) return null;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
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

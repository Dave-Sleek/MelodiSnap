import express from 'express';
import http from 'http';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import FormData from 'form-data';
import cors from 'cors';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = 3000;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Multer Setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

/**
 * API ROUTER
 */
const apiRouter = express.Router();

// Health/Config Check
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    config: {
      audd: !!process.env.AUDD_API_TOKEN,
      spotify: !!process.env.VITE_SPOTIFY_CLIENT_ID,
      apple: !!process.env.APPLE_TEAM_ID && !!process.env.APPLE_KEY_ID
    }
  });
});

// Test route
apiRouter.get('/test', (req, res) => {
  res.json({ message: 'API Router is successfully receiving requests' });
});

// Recognition Endpoint
apiRouter.post('/recognize', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided in the request.' });
    }

    const apiToken = process.env.AUDD_API_TOKEN;
    if (!apiToken) {
      return res.status(503).json({ 
        error: 'AudD API Token is missing.',
        message: 'Please add AUDD_API_TOKEN to your AI Studio Secrets.'
      });
    }

    console.log(`[Proxy] Received ${req.file.size} bytes (${req.file.mimetype}) audio payload`);

    // Detect actual container format from file magic bytes for 100% reliable decoding
    let extension = 'webm';
    let mime = req.file.mimetype || 'audio/webm';

    if (req.file.buffer.length >= 4) {
      // WebM / Matroska (0x1A 0x45 0xDF 0xA3)
      if (req.file.buffer[0] === 0x1a && req.file.buffer[1] === 0x45 && req.file.buffer[2] === 0xdf && req.file.buffer[3] === 0xa3) {
        extension = 'webm';
        mime = 'audio/webm';
      } else if (req.file.buffer.slice(0, 4).toString('ascii') === 'OggS') {
        extension = 'ogg';
        mime = 'audio/ogg';
      } else if (req.file.buffer.length >= 8 && req.file.buffer.slice(4, 8).toString('ascii') === 'ftyp') {
        extension = 'mp4';
        mime = 'audio/mp4';
      } else if (req.file.buffer.slice(0, 4).toString('ascii') === 'RIFF') {
        extension = 'wav';
        mime = 'audio/wav';
      } else if (req.file.mimetype?.includes('webm')) {
        extension = 'webm';
        mime = 'audio/webm';
      } else if (req.file.mimetype?.includes('ogg')) {
        extension = 'ogg';
        mime = 'audio/ogg';
      } else if (req.file.mimetype?.includes('mp4')) {
        extension = 'mp4';
        mime = 'audio/mp4';
      }
    }

    console.log(`[Proxy] Detected audio container: .${extension} (${mime}), forwarding to AudD API...`);

    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: `recording.${extension}`,
      contentType: mime,
    });
    form.append('api_token', apiToken);
    form.append('return', 'spotify,apple_music');

    const response = await axios.post('https://api.audd.io/', form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    if (response.data.status === 'error') {
      console.error('[AudD] API Error Response:', JSON.stringify(response.data.error, null, 2));
      const isAcousticFail = response.data.error?.error_code === 300;
      return res.status(isAcousticFail ? 422 : 502).json({ 
        error: isAcousticFail 
          ? "Could not hear the song clearly. Please hold your device closer to the music, let it listen for at least 5-8 seconds, and try again."
          : 'Recognition service returned an error.',
        detail: response.data.error?.error_message,
        code: response.data.error?.error_code
      });
    }

    res.json(response.data);
  } catch (error: any) {
    console.error('[Proxy] Recognition catch error:', error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message || 'Internal proxy error';
    res.status(status).json({ error: message });
  }
});

// Spotify Search Proxy
apiRouter.get('/music/spotify/search', async (req, res) => {
  const { q, type = 'track' } = req.query;
  const accessToken = req.headers.authorization;
  if (!accessToken) return res.status(401).json({ error: 'Spotify access token required' });

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: { q, type, limit: 1 },
      headers: { Authorization: accessToken },
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Spotify search failed' });
  }
});

// Apple Music Token Generator
apiRouter.get('/apple/developer-token', (req, res) => {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!teamId || !keyId || !privateKey) {
    return res.status(503).json({ error: 'Apple Music credentials missing.' });
  }

  try {
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: teamId,
      header: { alg: 'ES256', kid: keyId },
    });
    res.json({ token });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate developer token' });
  }
});

/**
 * MOUNT API ROUTER
 */
app.use('/api', apiRouter);

// Specific API 404 handler to ensure JSON is returned for all /api/* misses
app.use('/api', (req, res) => {
  console.warn(`[404] API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'API endpoint not found', 
    method: req.method, 
    url: req.originalUrl 
  });
});

/**
 * VITE / STATIC HANDLER
 */
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  try {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } catch (viteError: any) {
    console.error('[Fatal] Failed to create Vite server:', viteError);
    process.exit(1);
  }
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Fatal] Uncaught server error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

server.listen(port, () => {
  console.log(`[melodisnap] Server fully active on port ${port}`);
});

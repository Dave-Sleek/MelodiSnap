import app from '../server';

// Disable default body parser on Vercel so multer can handle multipart audio stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;

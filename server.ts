import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parsing
  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Pulse — Smart Market Watchlist',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

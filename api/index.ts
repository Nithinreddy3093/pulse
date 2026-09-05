import express from 'express';
import { apiRouter } from '../server/routes/api';

const app = express();

app.use(express.json());

// Mount the core Pulse API router at both /api and / to handle rewrite prefix variations
app.use('/api', apiRouter);
app.use('/', apiRouter);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Pulse — Smart Market Watchlist',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Pulse — Smart Market Watchlist',
    timestamp: new Date().toISOString(),
  });
});

export default app;

import express from 'express';
import { apiRouter } from '../server/routes/api';

const app = express();

app.use(express.json());

// Restore original URL if Vercel rewrite or proxy normalized it
app.use((req, _res, next) => {
  const matched = (req.headers['x-matched-path'] as string) || (req.headers['x-forwarded-uri'] as string);
  if (matched && (req.url === '/' || req.url === '/api' || req.url === '' || req.url.startsWith('/api?')) && matched !== '/' && matched !== '/api') {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    req.url = matched.includes('?') ? matched : `${matched}${queryString}`;
  }
  next();
});

// Immediate health endpoints
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

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Pulse — Smart Market Watchlist API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Pulse — Smart Market Watchlist API',
    timestamp: new Date().toISOString(),
  });
});

// Mount the core Pulse API router at both /api and / to handle any URL structure
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;

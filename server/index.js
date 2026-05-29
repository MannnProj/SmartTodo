import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://smarttodo.sudoman.my.id',
    process.env.CORS_ORIGIN,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Serve React static files (from Docker build or local dev)
const staticDir = path.resolve(__dirname, '../client/dist');
app.use(express.static(staticDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback — serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

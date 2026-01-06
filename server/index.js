import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import invitationRoutes from './routes/invitations.js';
import ticketRoutes from './routes/tickets.js';
import adminRoutes from './routes/admin.js';
import botRoutes from './routes/bot.js';
import postgres from 'postgres';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { enableQueryMonitoring, getCacheStatus } from './monitoring.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5001;

const PgStore = connectPgSimple(session);
const connectionString = `postgres://${process.env.DB_USER || 'eventuser'}:${process.env.DB_PASSWORD || 'eventpass'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'eventpyramide'}`;
const pgClient = postgres(connectionString);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5001',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new PgStore({
    conString: connectionString,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'event-pyramide-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000
  }
}));

app.use('/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bot', botRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Performance monitoring endpoint
app.get('/api/admin/diagnostics', async (req, res) => {
  try {
    const cacheStatus = await getCacheStatus();
    res.json({
      cache: cacheStatus,
      timestamp: new Date().toISOString(),
      info: 'Slow queries logged to postgres logs. Check with: docker exec event_pyramide_db tail -f /var/log/postgresql/postgresql.log'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from Vite dist in production, or fallback SPA route
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(join(__dirname, '../dist/index.html'));
  } else {
    // In dev, just return a message (Vite dev server handles the UI)
    res.status(404).json({ error: 'Not found. Run client separately with npm run dev:client' });
  }
});

app.listen(PORT, () => {
  enableQueryMonitoring();
});

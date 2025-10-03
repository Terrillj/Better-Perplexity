import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import searchRouter from './routes/search.js';
import answerRouter from './routes/answer.js';
import eventsRouter from './routes/events.js';
import preferencesRouter from './routes/preferences.js';

// Load environment variables from parent directory
config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.WEB_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/search', searchRouter);
app.use('/api/answer', answerRouter);
app.use('/api/events', eventsRouter);
app.use('/api/preferences', preferencesRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});


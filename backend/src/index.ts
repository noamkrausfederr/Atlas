import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import tripsRoutes from './routes/trips.js';

const app = express();
const port = process.env.PORT ?? 5000;

app.use(cors({ origin: 'http://localhost:4173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'TripBoard API' });
});

app.listen(port, () => {
  console.log(`TripBoard backend listening on http://localhost:${port}`);
});

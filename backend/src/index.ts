import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import tripsRoutes from './routes/trips.js';
import recommendationsRoutes from './routes/recommendations.js';
import geocodeRoutes from './routes/geocode.js';
import {
  getRecommendationProviderMode,
  hasProviderKey,
  isRecommendationProviderAllowed,
  reportEnvSetup
} from './config/env.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(currentDir, '../.env') });

const app = express();
const port = process.env.PORT ?? 5005;

const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : undefined));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Dest: ${req.body?.destination} - Query: ${req.body?.query}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/geocode', geocodeRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'TripBoard API',
    recommendationProviderMode: getRecommendationProviderMode(),
    providers: {
      wikipedia: {
        allowed: isRecommendationProviderAllowed('wikipedia'),
        configured: hasProviderKey('wikipedia')
      },
      opentripmap: {
        allowed: isRecommendationProviderAllowed('opentripmap'),
        configured: hasProviderKey('opentripmap')
      },
      foursquare: {
        allowed: isRecommendationProviderAllowed('foursquare'),
        configured: hasProviderKey('foursquare')
      },
      geoapify: {
        allowed: isRecommendationProviderAllowed('geoapify'),
        configured: hasProviderKey('geoapify')
      },
      ticketmaster: {
        allowed: isRecommendationProviderAllowed('ticketmaster'),
        configured: hasProviderKey('ticketmaster')
      },
      google: {
        allowed: isRecommendationProviderAllowed('google'),
        configured: hasProviderKey('google')
      },
      tripadvisor: {
        allowed: isRecommendationProviderAllowed('tripadvisor'),
        configured: hasProviderKey('tripadvisor')
      },
      yelp: {
        allowed: isRecommendationProviderAllowed('yelp'),
        configured: hasProviderKey('yelp')
      }
    }
  });
});

app.listen(port, () => {
  reportEnvSetup();
  console.log(`TripBoard backend listening on http://localhost:${port}`);
});

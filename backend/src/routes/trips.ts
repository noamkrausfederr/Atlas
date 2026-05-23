import { Router } from 'express';

const router = Router();

const sampleBoards = [
  {
    id: 'board-1',
    title: 'Japan 2026',
    description: 'Sakura, ramen, temples, and city adventures.',
    cover: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c'
  },
  {
    id: 'board-2',
    title: 'Italy Food Trip',
    description: 'Pizza, espresso, coastal villages, and hidden trattorie.',
    cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
  }
];

router.get('/', (_req, res) => {
  res.json(sampleBoards);
});

export default router;

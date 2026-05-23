import { Router } from 'express';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({ provider: 'google', authenticated: false });
});

router.get('/google', (_req, res) => {
  res.json({ message: 'Google login flow will be implemented here.' });
});

export default router;

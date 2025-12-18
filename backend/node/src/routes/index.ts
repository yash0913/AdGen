import { Router, Request, Response } from 'express';

const router = Router();

// Base API router placeholder
router.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'API root' });
});

export default router;

import { Router, Request, Response } from 'express';
import authRouter from './auth';
import eventsRouter from './events';

const router = Router();

// Base API router placeholder
router.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'API root' });
});

router.use('/auth', authRouter);
router.use('/events', eventsRouter);

export default router;

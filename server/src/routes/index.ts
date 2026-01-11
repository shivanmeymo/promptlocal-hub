import { Router } from 'express';
import eventsRouter from './events.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NowInTown API',
  });
});

// Mount route modules
router.use('/events', eventsRouter);

export default router;

import { Router } from 'express';
import { UserEventSchema } from '../types/contracts.js';
import { logEvent } from '../events/store.js';

const router = Router();

// POST /api/events
// Body: UserEvent
// Returns: { success: boolean }
router.post('/', async (req, res) => {
  try {
    const event = UserEventSchema.parse(req.body);
    logEvent(event);

    res.json({ success: true });
  } catch (error) {
    console.error('Event logging error:', error);
    res.status(400).json({
      error: 'Event logging failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


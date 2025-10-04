import { Router } from 'express';
import { UserEventSchema } from '../types/contracts.js';
import { logEvent, getUserEvents } from '../events/store.js';

const router = Router();

// GET /api/events?userId=<userId>
// Returns: UserEvent[]
router.get('/', async (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  try {
    const events = getUserEvents(userId);
    res.json(events);
  } catch (error) {
    console.error('Event fetching error:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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


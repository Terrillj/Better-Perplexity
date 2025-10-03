import { Router } from 'express';
import { getUserBandit, getUserEvents, clearUserData } from '../events/store.js';

const router = Router();

/**
 * GET /api/preferences?userId=<userId>
 * Returns user's top 5 arm scores from Thompson Sampling bandit
 */
router.get('/', (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  try {
    const bandit = getUserBandit(userId);
    const armScores = bandit.getArmScores();
    
    // Count total interactions (SOURCE_CLICKED events)
    const events = getUserEvents(userId);
    const totalInteractions = events.filter(e => e.eventType === 'SOURCE_CLICKED').length;

    // Get top 5 arms sorted by score
    const topArms = Array.from(armScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([arm, score]) => ({ arm, score }));

    res.json({
      topArms,
      totalInteractions,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * DELETE /api/preferences?userId=<userId>
 * Clears user's bandit data and event history (useful for demo resets)
 */
router.delete('/', (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).json({ error: 'userId query parameter is required' });
  }

  try {
    clearUserData(userId);
    console.log(`[RESET] Cleared all data for user: ${userId}`);
    
    res.json({
      message: 'User data cleared successfully',
      userId,
    });
  } catch (error) {
    console.error('Error clearing user data:', error);
    res.status(500).json({ error: 'Failed to clear user data' });
  }
});

export default router;


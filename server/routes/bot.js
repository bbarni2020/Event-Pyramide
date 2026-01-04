import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import instagramBot from '../services/instagramBot.js';

const router = express.Router();

router.post('/send-update', requireAdmin, async (req, res) => {
  try {
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'User ID and content are required' });
    }

    await instagramBot.sendEventUpdate(userId, content);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send update' });
  }
});

router.post('/broadcast', requireAdmin, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const results = await instagramBot.broadcastUpdate(content);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to broadcast update' });
  }
});

export default router;

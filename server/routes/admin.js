import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAllUsers, banUser } from '../models/user.js';
import { getAllInvitations } from '../models/invitation.js';
import { getAllTickets } from '../models/ticket.js';
import { getEventConfig, updateEventConfig } from '../models/event.js';

const router = express.Router();

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users/:userId/ban', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await banUser(userId, true);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:userId/unban', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await banUser(userId, false);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

router.get('/invitations', requireAdmin, async (req, res) => {
  try {
    const invitations = await getAllInvitations();
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

router.get('/tickets', requireAdmin, async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.get('/config', async (req, res) => {
  try {
    const config = await getEventConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event config' });
  }
});

router.put('/config', requireAdmin, async (req, res) => {
  try {
    const config = await updateEventConfig(req.body);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event config' });
  }
});

export default router;

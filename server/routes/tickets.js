import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTicketByUserId, createTicket } from '../models/ticket.js';
import { getEventConfig } from '../models/event.js';

const router = express.Router();

router.get('/my-ticket', requireAuth, async (req, res) => {
  try {
    const ticket = await getTicketByUserId(req.user.id);
    res.json(ticket || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

router.post('/generate', requireAuth, async (req, res) => {
  try {
    const existingTicket = await getTicketByUserId(req.user.id);
    if (existingTicket) {
      return res.status(400).json({ error: 'Ticket already generated' });
    }

    const config = await getEventConfig();
    const tier = 'tier1';
    const price = config.ticketPriceTier1;

    const ticket = await createTicket(req.user.id, price, tier);
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
});

export default router;

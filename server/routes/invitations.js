import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getUserInvitationCount, isBannedUser } from '../models/user.js';
import { createInvitation, getUserInvitations } from '../models/invitation.js';
import { getEventConfig } from '../models/event.js';
import db from '../database/pool.js';
import { users } from '../database/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const invitations = await getUserInvitations(req.user.id);
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { instagram_id, username } = req.body;

    if (!instagram_id || !username) {
      return res.status(400).json({ error: 'Instagram ID and username are required' });
    }

    // Check if inviter is banned
    const inviterBanned = await isBannedUser(req.user.id);
    if (inviterBanned) {
      return res.status(403).json({ error: 'Your account is banned and cannot send invitations' });
    }

    const invitationCount = await getUserInvitationCount(req.user.id);
    const config = await getEventConfig();
    const maxInvitations = req.user.isAdmin ? Infinity : (config?.maxInvitesPerUser || 5);

    if (invitationCount >= maxInvitations) {
      return res.status(400).json({ error: `Maximum invitation limit reached (${maxInvitations})` });
    }

    const invitation = await createInvitation(req.user.id, instagram_id, username);
    
    // Create user record immediately as invited but not registered (attending: null)
    // Check if user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.instagramId, instagram_id));
    
    if (!existingUser) {
      await db.insert(users).values({
        instagramId: instagram_id,
        username: username.toLowerCase(),
        invitedBy: req.user.id,
        attending: null, // invited but not registered yet
        isAdmin: false
      });
      console.log(`Created invited user: ${username} (not registered yet)`);
    }
    
    res.status(201).json(invitation);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User already invited' });
    }
    console.error('Failed to create invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
});

export default router;

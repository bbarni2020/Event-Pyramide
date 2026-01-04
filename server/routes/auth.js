import express from 'express';
import db from '../database/pool.js';
import { users, invitations } from '../database/schema.js';
import { eq, or } from 'drizzle-orm';
import { InstagramBot } from '../services/instagramBot.js';
import { setAttendanceStatus } from '../models/user.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const bot = new InstagramBot();

// Store OTP codes temporarily (in production, use Redis)
const otpStore = new Map();

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Instagram username required' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store OTP
    otpStore.set(username.toLowerCase(), { otp, expiresAt });

    // Send OTP via Instagram bot
    try {
      const message = `Event Pyramide\n\nYour verification code: ${otp}\n\nValid for 10 minutes.`;
      await bot.sendMessageByUsername(username, message);
      
      res.json({ success: true, message: 'Code sent to your Instagram' });
    } catch (error) {
      // If bot fails, still return the OTP in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`DEV MODE - OTP for ${username}: ${otp}`);
        res.json({ success: true, message: 'Code sent (check console in dev mode)', devOtp: otp });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('OTP request failed:', error);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { username, otp } = req.body;
    
    if (!username || !otp) {
      return res.status(400).json({ error: 'Username and code required' });
    }

    const normalizedUsername = username.toLowerCase();
    const storedData = otpStore.get(normalizedUsername);

    if (!storedData) {
      return res.status(400).json({ error: 'No code requested or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedUsername);
      return res.status(400).json({ error: 'Code expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // OTP verified, clear it
    otpStore.delete(normalizedUsername);

    // Check if user exists
    let [user] = await db.select().from(users).where(eq(users.username, normalizedUsername));

    if (!user) {
      // Check if user has invitation or is admin
      const adminUsernames = (process.env.ADMIN_INSTAGRAM_USERNAMES || '').split(',').map(u => u.trim().toLowerCase());
      const isAdmin = adminUsernames.includes(normalizedUsername);

      const [invitation] = await db.select().from(invitations)
        .where(eq(invitations.inviteeUsername, normalizedUsername));

      if (!isAdmin && !invitation) {
        return res.status(403).json({ error: 'No invitation found. Access denied.' });
      }

      // Create new user
      const [newUser] = await db.insert(users).values({
        username: normalizedUsername,
        instagramId: normalizedUsername, // Using username as ID for now
        isAdmin
      }).returning();

      // Mark invitation as accepted
      if (invitation) {
        await db.update(invitations)
          .set({ status: 'accepted', acceptedAt: new Date() })
          .where(eq(invitations.id, invitation.id));
      }

      user = newUser;
    } else {
      // User exists, mark their invitation as accepted if they have one
      const [invitation] = await db.select().from(invitations)
        .where(eq(invitations.inviteeUsername, normalizedUsername));
      
      if (invitation && invitation.status === 'pending') {
        await db.update(invitations)
          .set({ status: 'accepted', acceptedAt: new Date() })
          .where(eq(invitations.id, invitation.id));
      }
    }

    // Create session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session creation failed' });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (error) {
    console.error('OTP verification failed:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

router.get('/status', async (req, res) => {
  if (req.session.userId) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      
      if (user) {
        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            profilePicture: user.profilePicture,
            attending: user.attending
          }
        });
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  }
  
  res.json({ authenticated: false });
});
router.post('/set-attendance', requireAuth, async (req, res) => {
  try {
    const { attending } = req.body;
    
    if (typeof attending !== 'boolean') {
      return res.status(400).json({ error: 'Attendance status required (true/false)' });
    }

    await setAttendanceStatus(req.user.id, attending);
    res.json({ success: true, attending });
  } catch (error) {
    console.error('Failed to set attendance:', error);
    res.status(500).json({ error: 'Failed to update attendance status' });
  }
});

export default router;

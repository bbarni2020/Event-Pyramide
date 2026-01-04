import db from '../database/pool.js';
import { users } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export const requireAuth = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
    }
  }
  res.status(401).json({ error: 'Unauthorized' });
};

export const requireAdmin = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (user && user.isAdmin) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('Admin middleware error:', error);
    }
  }
  res.status(403).json({ error: 'Forbidden: Admin access required' });
};

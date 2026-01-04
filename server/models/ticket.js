import db from '../database/pool.js';
import { tickets, users } from '../database/schema.js';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const createTicket = async (userId, price, tier) => {
  const ticketCode = crypto.randomBytes(16).toString('hex').toUpperCase();
  const [ticket] = await db.insert(tickets).values({
    userId,
    ticketCode,
    price,
    tier,
  }).returning();
  return ticket;
};

export const getTicketByUserId = async (userId) => {
  const [ticket] = await db.select()
    .from(tickets)
    .where(eq(tickets.userId, userId));
  return ticket;
};

export const getAllTickets = async () => {
  return await db.select({
    id: tickets.id,
    userId: tickets.userId,
    ticketCode: tickets.ticketCode,
    price: tickets.price,
    tier: tickets.tier,
    issuedAt: tickets.issuedAt,
    username: users.username,
    instagramId: users.instagramId,
  })
  .from(tickets)
  .innerJoin(users, eq(users.id, tickets.userId))
  .orderBy(sql`${tickets.issuedAt} DESC`);
};

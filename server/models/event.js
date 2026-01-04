import db from '../database/pool.js';
import { eventConfig } from '../database/schema.js';
import { eq, sql } from 'drizzle-orm';

export const getEventConfig = async () => {
  const [config] = await db.select().from(eventConfig).limit(1);
  return config;
};

export const updateEventConfig = async (config) => {
  const { event_date, max_participants, member_count_release_date, ticket_price_tier1, ticket_price_tier2, ticket_price_tier3, ticket_price, currency, max_invites_per_user, max_discount_percent } = config;
  const [updated] = await db.update(eventConfig)
    .set({
      eventDate: event_date,
      maxParticipants: max_participants,
      memberCountReleaseDate: member_count_release_date,
      ticketPriceTier1: ticket_price_tier1,
      ticketPriceTier2: ticket_price_tier2,
      ticketPriceTier3: ticket_price_tier3,
      ticketPrice: ticket_price,
      currency: currency,
      maxInvitesPerUser: max_invites_per_user,
      maxDiscountPercent: max_discount_percent,
      updatedAt: new Date(),
    })
    .where(eq(eventConfig.id, 1))
    .returning();
  return updated;
};

export const incrementParticipants = async () => {
  const [updated] = await db.update(eventConfig)
    .set({
      currentParticipants: sql`${eventConfig.currentParticipants} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(eventConfig.id, 1))
    .returning();
  return updated;
};

export const getCurrentParticipantCount = async () => {
  const [result] = await db.select({
    currentParticipants: eventConfig.currentParticipants,
    maxParticipants: eventConfig.maxParticipants,
  })
  .from(eventConfig)
  .where(eq(eventConfig.id, 1));
  return result;
};

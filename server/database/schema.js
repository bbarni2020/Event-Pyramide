import { pgTable, serial, varchar, boolean, integer, timestamp, decimal, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  instagramId: varchar('instagram_id', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  profilePicture: text('profile_picture'),
  isAdmin: boolean('is_admin').default(false),
  isBanned: boolean('is_banned').default(false),
  attending: boolean('attending').default(null),
  invitedBy: integer('invited_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  inviterId: integer('inviter_id').notNull().references(() => users.id),
  inviteeInstagramId: varchar('invitee_instagram_id', { length: 255 }).notNull().unique(),
  inviteeUsername: varchar('invitee_username', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  acceptedAt: timestamp('accepted_at'),
});

export const eventConfig = pgTable('event_config', {
  id: serial('id').primaryKey(),
  eventDate: timestamp('event_date').notNull(),
  maxParticipants: integer('max_participants').notNull(),
  memberCountReleaseDate: timestamp('member_count_release_date').notNull(),
  ticketPriceTier1: decimal('ticket_price_tier1', { precision: 10, scale: 2 }),
  ticketPriceTier2: decimal('ticket_price_tier2', { precision: 10, scale: 2 }),
  ticketPriceTier3: decimal('ticket_price_tier3', { precision: 10, scale: 2 }),
  ticketPrice: decimal('ticket_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 10 }).default('USD'),
  maxInvitesPerUser: integer('max_invites_per_user').default(5),
  maxDiscountPercent: decimal('max_discount_percent', { precision: 5, scale: 2 }).default('0.00'),
  currentParticipants: integer('current_participants').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  ticketCode: varchar('ticket_code', { length: 255 }).notNull().unique(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  tier: varchar('tier', { length: 50 }).notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});

export const botMessages = pgTable('bot_messages', {
  id: serial('id').primaryKey(),
  messageType: varchar('message_type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  sentToUserId: integer('sent_to_user_id').references(() => users.id),
  sentAt: timestamp('sent_at').defaultNow(),
  status: varchar('status', { length: 50 }).default('pending'),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  inviter: one(users, {
    fields: [users.invitedBy],
    references: [users.id],
  }),
  sentInvitations: many(invitations),
  tickets: many(tickets),
  messages: many(botMessages),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
}));

export const botMessagesRelations = relations(botMessages, ({ one }) => ({
  user: one(users, {
    fields: [botMessages.sentToUserId],
    references: [users.id],
  }),
}));

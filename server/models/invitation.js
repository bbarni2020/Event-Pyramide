import db from '../database/pool.js';
import { invitations, users } from '../database/schema.js';
import { eq, sql } from 'drizzle-orm';

export const createInvitation = async (inviterId, inviteeInstagramId, inviteeUsername) => {
  const [invitation] = await db.insert(invitations).values({
    inviterId,
    inviteeInstagramId,
    inviteeUsername,
  }).returning();
  return invitation;
};

export const getInvitationByInstagramId = async (instagramId) => {
  const [invitation] = await db.select()
    .from(invitations)
    .where(eq(invitations.inviteeInstagramId, instagramId));
  return invitation;
};

export const acceptInvitation = async (instagramId) => {
  const [invitation] = await db.update(invitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(invitations.inviteeInstagramId, instagramId))
    .returning();
  return invitation;
};

export const getUserInvitations = async (userId) => {
  return await db.select({
    id: invitations.id,
    inviterId: invitations.inviterId,
    inviteeInstagramId: invitations.inviteeInstagramId,
    inviteeUsername: invitations.inviteeUsername,
    status: invitations.status,
    createdAt: invitations.createdAt,
    acceptedAt: invitations.acceptedAt,
    inviteeUser: users.username,
  })
  .from(invitations)
  .leftJoin(users, eq(users.instagramId, invitations.inviteeInstagramId))
  .where(eq(invitations.inviterId, userId))
  .orderBy(sql`${invitations.createdAt} DESC`);
};

export const getAllInvitations = async () => {
  return await db.select({
    id: invitations.id,
    inviterId: invitations.inviterId,
    inviteeInstagramId: invitations.inviteeInstagramId,
    inviteeUsername: invitations.inviteeUsername,
    status: invitations.status,
    createdAt: invitations.createdAt,
    acceptedAt: invitations.acceptedAt,
    inviterUsername: sql`u1.username`.as('inviter_username'),
    inviteeUser: sql`u2.username`.as('invitee_user'),
  })
  .from(invitations)
  .innerJoin(sql`users u1`, sql`u1.id = ${invitations.inviterId}`)
  .leftJoin(sql`users u2`, sql`u2.instagram_id = ${invitations.inviteeInstagramId}`)
  .orderBy(sql`${invitations.createdAt} DESC`);
};

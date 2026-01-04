import db from '../database/pool.js';
import { users, invitations } from '../database/schema.js';
import { eq, sql } from 'drizzle-orm';

export const createUser = async (instagramData, invitedBy = null) => {
  const { id, username, full_name, profile_picture } = instagramData;
  const [user] = await db.insert(users).values({
    instagramId: id,
    username,
    fullName: full_name,
    profilePicture: profile_picture,
    invitedBy,
  }).returning();
  return user;
};

export const getUserByInstagramId = async (instagramId) => {
  const [user] = await db.select().from(users).where(eq(users.instagramId, instagramId));
  return user;
};

export const getUserById = async (id) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};

export const setUserAdmin = async (instagramId, isAdmin) => {
  const [user] = await db.update(users)
    .set({ isAdmin, updatedAt: new Date() })
    .where(eq(users.instagramId, instagramId))
    .returning();
  return user;
};

export const banUser = async (userId, banned = true) => {
  const [user] = await db.update(users)
    .set({ isBanned: banned, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
};

export const isBannedUser = async (userId) => {
  const [user] = await db.select({ isBanned: users.isBanned })
    .from(users)
    .where(eq(users.id, userId));
  return user?.isBanned || false;
};

export const setAttendanceStatus = async (userId, attending) => {
  const [user] = await db.update(users)
    .set({ attending, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
};

export const getAllUsers = async () => {
  return await db.select({
    id: users.id,
    instagramId: users.instagramId,
    username: users.username,
    isAdmin: users.isAdmin,
    isBanned: users.isBanned,
    createdAt: users.createdAt,
  }).from(users).orderBy(sql`${users.createdAt} DESC`);
};

export const getUserInvitationCount = async (userId) => {
  const [result] = await db.select({ count: sql`count(*)` })
    .from(invitations)
    .where(eq(invitations.inviterId, userId));
  return parseInt(result.count);
};

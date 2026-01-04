import axios from 'axios';
import db from '../database/pool.js';
import { botMessages, users } from '../database/schema.js';
import { eq } from 'drizzle-orm';

class InstagramBot {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_BOT_ACCESS_TOKEN;
    this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  }

  async sendMessage(instagramId, message) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.businessAccountId}/messages`,
        {
          recipient: { id: instagramId },
          message: { text: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to send Instagram message:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendMessageByUsername(username, message) {
    try {
      // First, get the Instagram ID from username
      const userResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${this.businessAccountId}`,
        {
          params: {
            fields: 'username',
            access_token: this.accessToken
          }
        }
      );

      // Search for conversations or send directly
      // Note: Instagram API requires the user to have messaged the business first
      // For OTP, you might need to use Instagram's messaging API differently
      // This is a simplified version - in production, you may need to handle this differently
      
      return await this.sendMessage(username, message);
    } catch (error) {
      console.error('Failed to send message by username:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendEventUpdate(userId, content) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error('User not found');
      }

      await this.sendMessage(user.instagramId, content);

      await db.insert(botMessages).values({
        messageType: 'update',
        content,
        sentToUserId: userId,
        status: 'sent'
      });

      return { success: true };
    } catch (error) {
      await db.insert(botMessages).values({
        messageType: 'update',
        content,
        sentToUserId: userId,
        status: 'failed'
      });
      throw error;
    }
  }

  async sendTicket(userId, ticketCode, price) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error('User not found');
      }

      const message = `🎟️ Your Event Ticket\n\nTicket Code: ${ticketCode}\nPrice: $${price}\n\nSee you at the event!`;
      
      await this.sendMessage(user.instagramId, message);

      await db.insert(botMessages).values({
        messageType: 'ticket',
        content: message,
        sentToUserId: userId,
        status: 'sent'
      });

      return { success: true };
    } catch (error) {
      await db.insert(botMessages).values({
        messageType: 'ticket',
        content: `Ticket: ${ticketCode}`,
        sentToUserId: userId,
        status: 'failed'
      });
      throw error;
    }
  }

  async broadcastUpdate(content) {
    try {
      const allUsers = await db.select().from(users);
      const results = [];

      for (const user of allUsers) {
        try {
          await this.sendEventUpdate(user.id, content);
          results.push({ userId: user.id, success: true });
        } catch (error) {
          results.push({ userId: user.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Broadcast failed:', error);
      throw error;
    }
  }
}

export { InstagramBot };
export default new InstagramBot();

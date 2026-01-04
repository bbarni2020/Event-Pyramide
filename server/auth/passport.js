import passport from 'passport';
import { Strategy as InstagramStrategy } from 'passport-instagram';
import dotenv from 'dotenv';
import { getUserByInstagramId, createUser, setUserAdmin } from '../models/user.js';
import { getInvitationByInstagramId, acceptInvitation } from '../models/invitation.js';
import { incrementParticipants, getCurrentParticipantCount } from '../models/event.js';

dotenv.config();

const adminUsernames = process.env.ADMIN_INSTAGRAM_USERNAMES?.split(',') || [];

passport.use(new InstagramStrategy({
  clientID: process.env.INSTAGRAM_CLIENT_ID,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
  callbackURL: process.env.INSTAGRAM_CALLBACK_URL || 'http://localhost:5000/auth/instagram/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await getUserByInstagramId(profile.id);
    
    if (user) {
      return done(null, user);
    }

    const invitation = await getInvitationByInstagramId(profile.id);
    const isAdmin = adminUsernames.includes(profile.username);
    
    if (!invitation && !isAdmin) {
      return done(null, false, { message: 'No invitation found. You must be invited to join.' });
    }

    const participantCount = await getCurrentParticipantCount();
    if (participantCount.currentParticipants >= participantCount.maxParticipants && !isAdmin) {
      return done(null, false, { message: 'Event has reached maximum capacity.' });
    }

    user = await createUser({
      id: profile.id,
      username: profile.username,
      full_name: profile.displayName,
      profile_picture: profile._json?.profile_picture
    }, invitation?.inviterId);

    if (isAdmin) {
      user = await setUserAdmin(profile.id, true);
    }

    if (invitation) {
      await acceptInvitation(profile.id);
    }

    await incrementParticipants();

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserByInstagramId(id.toString());
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;

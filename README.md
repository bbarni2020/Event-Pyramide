# Event Pyramide

A modern, invite-only event management platform with OTP authentication via Instagram bot messaging. Users log in with verification codes sent directly to their Instagram DMs, manage their event invitations, and admins control ticket pricing, discounts, and invite limits.

## Features

- **OTP Authentication**: Users log in with 6-digit codes sent via Instagram bot
- **Invitation System**: Grant access to specific Instagram users with invite-based registration
- **Admin Dashboard**: Full control over event config, user management, and invitations
- **User Banning**: Admins can ban users to prevent participation
- **Dynamic Pricing**: Set ticket price, currency, and maximum discount for fully accepted invite chains
- **Invite Limits**: Control max invites per user (scales with event needs)
- **Industrial UI**: Dark theme with minimal, system-like interface
- **Session-Based Auth**: Secure PostgreSQL-backed sessions instead of OAuth

## Tech Stack

- **Frontend**: Svelte 4.2.8 + Vite 5.0.8
- **Backend**: Express.js 4.x
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with OTP via Instagram Graph API
- **Bot Integration**: Instagram Graph API for DM messaging

## Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- Instagram Business Account (for bot messaging)

### Installation

```bash
# Clone and install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Instagram bot credentials
```

### Environment Variables

```env
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:5001

DB_HOST=localhost
DB_PORT=5432
DB_USER=eventuser
DB_PASSWORD=eventpass
DB_NAME=eventpyramide

SESSION_SECRET=your-random-secret-here

INSTAGRAM_BOT_ACCESS_TOKEN=IGAA...your_long_lived_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=123456789

ADMIN_INSTAGRAM_USERNAMES=admin_username

VITE_API_URL=http://localhost:5001
```

### Start Development Server

```bash
npm run dev
```

Both frontend and backend run on `http://localhost:5001`.

## Authentication Flow

1. User enters Instagram username
2. Server generates 6-digit OTP code
3. Instagram bot sends code via DM to user
4. User enters code to complete login
5. Session created in PostgreSQL

**Note**: Instagram API only allows messaging users who have messaged your account first. For production, users should DM your bot account before attempting login.

## Admin Features

Access the admin dashboard at `/admin` (requires admin role).

### Sections

- **USERS**: View all registered users, ban/unban accounts
- **GRANTS**: Monitor invitation status and acceptance
- **CONFIG**: 
  - Event date and capacity
  - Ticket pricing and currency
  - Max invites per user
  - Max discount % when all invites accepted
- **BROADCAST**: Send system-wide messages to all users

## Instagram Bot Setup

See [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md) for complete setup guide including:

- Creating a Meta app
- Connecting Instagram Business account
- Generating access tokens
- Getting your Business Account ID
- Testing locally
- Going live with app review

TL;DR: Get a long-lived access token from Graph API Explorer, set `INSTAGRAM_BOT_ACCESS_TOKEN` in `.env`, restart server.

## Database Setup

### Fresh Database

```bash
# PostgreSQL will run migrations on first boot via init.sql
npm run dev
```

### Existing Database

If you have an existing Event Pyramide database, run the migration:

```bash
psql -U eventuser -d eventpyramide -f server/database/migrations.sql
```

This adds:
- `is_banned` column to users
- `ticket_price`, `currency`, `max_invites_per_user`, `max_discount_percent` to event_config

## API Endpoints

### Auth

- `POST /auth/request-otp` - Request OTP for username
- `POST /auth/verify-otp` - Verify code and create session
- `GET /auth/status` - Check login status
- `POST /auth/logout` - Destroy session

### Invitations

- `GET /api/invitations` - Get my invitations
- `POST /api/invitations` - Send invitation to user

### Admin

- `GET /api/admin/users` - List all users
- `POST /api/admin/users/:userId/ban` - Ban user
- `POST /api/admin/users/:userId/unban` - Restore user
- `GET /api/admin/config` - Get event config
- `PUT /api/admin/config` - Update event config
- `GET /api/admin/invitations` - Get all invitations
- `POST /api/bot/broadcast` - Send broadcast message

## Project Structure

```
├── src/                          # Frontend (Svelte)
│   ├── components/
│   │   ├── App.svelte           # Main layout & nav
│   │   ├── Login.svelte         # OTP login form
│   │   ├── Dashboard.svelte     # User invitations
│   │   └── AdminPanel.svelte    # Admin interface
│   ├── stores/
│   │   └── auth.js              # Auth state store
│   ├── services/
│   │   └── api.js               # API client setup
│   └── main.js
│
├── server/                       # Backend (Express)
│   ├── index.js                 # Server entry point
│   ├── database/
│   │   ├── pool.js              # Database connection
│   │   ├── schema.js            # Drizzle schema definitions
│   │   ├── init.sql             # Initial schema
│   │   └── migrations.sql       # Schema updates
│   ├── middleware/
│   │   └── auth.js              # Session & auth checks
│   ├── models/                  # Database query functions
│   │   ├── user.js
│   │   ├── invitation.js
│   │   ├── event.js
│   │   └── ticket.js
│   ├── routes/
│   │   ├── auth.js              # OTP endpoints
│   │   ├── invitations.js       # Invitation endpoints
│   │   ├── admin.js             # Admin endpoints
│   │   └── bot.js               # Bot messaging endpoints
│   └── services/
│       └── instagramBot.js      # Instagram Graph API wrapper
│
├── vite.config.js              # Frontend build config
├── docker-compose.yml          # PostgreSQL container setup
└── README.md
```

## Development Notes

- OTP codes expire after 10 minutes
- Sessions last 30 days (configurable via `cookie.maxAge`)
- In-memory OTP storage (use Redis for production)
- Instagram tokens expire after 60 days (manual refresh required)
- All timestamps in UTC

## Known Limitations

1. **Instagram Messaging**: Users must message your bot account first before receiving OTP codes
2. **Token Expiry**: Long-lived tokens last 60 days and require manual refresh
3. **In-Memory OTP**: Not suitable for scaled deployment without Redis
4. **Single Admin List**: Admins defined by username list in `ADMIN_INSTAGRAM_USERNAMES`

## Production Deployment

Before going live:

1. Generate new `SESSION_SECRET` (use strong random string)
2. Get Instagram app approved for `instagram_manage_messages` permission
3. Switch app from Development to Live mode
4. Implement token refresh automation
5. Set up Redis for OTP storage
6. Configure HTTPS/SSL
7. Use environment-specific `.env` files
8. Set `NODE_ENV=production`

## License

MIT

## Support

For issues with Instagram bot setup, see [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md).

For token errors in logs, ensure `INSTAGRAM_BOT_ACCESS_TOKEN` is set and hasn't expired.


# Event Pyramide

Invite-only event management platform with OTP authentication via Instagram bot messaging. Users log in with verification codes sent via Instagram DMs, manage invitations, and admins control tickets and user access.

## Features

- **OTP Authentication**: Users log in with 6-digit codes sent via Instagram bot
- **Invitation System**: Grant access to specific Instagram users  
- **Admin Dashboard**: Manage users, invitations, tickets, and event configuration
- **User Banning**: Admins can restrict participation
- **Dynamic Pricing**: Configure ticket price and tiers
- **Invite Limits**: Control max invites per user
- **Session-Based Auth**: PostgreSQL-backed sessions

## Tech Stack

- **Frontend**: Plain HTML/JavaScript with Jinja2 templates
- **Backend**: Python Flask
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis
- **Authentication**: Session-based with OTP via Instagram

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 12+
- Redis
- Instagram Business Account (for bot messaging)

### Installation

```bash
git clone <repo>
cd Event-Pyramide

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your Instagram credentials
```

### Running Locally

```bash
python app.py
```

Visit `http://localhost:5001`

### Docker

```bash
docker-compose up -d
```

## Environment Variables

```env
FLASK_ENV=development
PORT=5001

APP_LANGUAGE=en

DB_USER=eventuser
DB_PASSWORD=eventpass
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventpyramide

REDIS_HOST=localhost
REDIS_PORT=6379

SESSION_SECRET=your-secret-key

ADMIN_INSTAGRAM_USERNAMES=admin1,admin2
INSTAGRAM_API_URL=https://api.instagram.com/v1
INSTAGRAM_ACCESS_TOKEN=token
```

## Language Support

The application supports multiple languages. The default is English; you can change the startup language in the `.env` file:

```bash
APP_LANGUAGE=en
```

A language selector is also available in the frontend navbar once you log in. The dropdown is populated from the server and will honour the `APP_LANGUAGE` default. Changing the value sends a request to the API and reloads the UI so that any future translated text is rendered correctly.

Users can also change language programmatically via the API:

```bash
curl -X POST http://localhost:5001/api/language/set/en
```

To add a new language later, drop a JSON file in the root `languages/` folder and update `AVAILABLE_LANGUAGES` in `languages/__init__.py`.

## API Endpoints

### Authentication
- `POST /auth/request-otp` - Request verification code
- `POST /auth/verify-otp` - Verify and login
- `GET /auth/check-status` - Check auth status
- `POST /auth/logout` - Logout

### User Features
- `GET /api/invitations/` - List sent invitations
- `POST /api/invitations/` - Send invitation
- `GET /api/tickets/my-ticket` - Get user's ticket
- `POST /api/tickets/generate` - Generate ticket

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users/{id}/ban` - Ban user
- `POST /api/admin/users/{id}/unban` - Unban user
- `GET /api/admin/invitations` - List all invitations
- `GET /api/admin/tickets` - List all tickets
- `GET /api/admin/config` - Get event config
- `PUT /api/admin/config` - Update event config

### Bot
- `POST /api/bot/send-update` - Send DM to user
- `POST /api/bot/broadcast` - Send DM to all users

## Database Schema

**users** - User accounts
**invitations** - Invitation records
**event_config** - Event settings
**tickets** - Generated tickets
**bot_messages** - Sent messages log

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


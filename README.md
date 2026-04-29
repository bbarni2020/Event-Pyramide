# Event Pyramide

Manage exclusive events the way people actually use social media. Send OTP codes via Instagram DMs, let people RSVP without creating another account, and keep control of who gets in. It's like a VIP list, but make it digital.

## What This Does

- **Invite folks via Instagram** — Guests get a 6-digit code texted to their DMs. No email signups, no separate accounts.
- **Admin dashboard** — Manage attendees, ban people if they're being weird, set ticket prices, control how many invites each person gets.
- **Tickets that work** — Generate actual tickets once people RSVP. Works offline if needed.
- **Session-based auth** — Runs on PostgreSQL, so your data isn't going anywhere.

## Stack

- Python Flask (backend keeps it simple)
- PostgreSQL (reliable)
- Redis (for caching, optional but recommended)
- Plain HTML/JS frontend with Jinja2 (no framework bloat)
- Instagram Graph API (for DMs)

## Get It Running

### Prerequisites

- Python 3.11+
- PostgreSQL 12+
- Redis (optional, but useful)
- Instagram Business Account with Graph API access

### Setup

```bash
git clone https://github.com/bbarni2020/Event-Pyramide
cd Event-Pyramide

python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your actual credentials (see below)
```

### .env Setup

Grab these from your Instagram app and Meta dashboard:

```env
FLASK_ENV=production
HOST=0.0.0.0
PORT=5002
APP_LANGUAGE=en

# Frontend / server wiring
# Leave VITE_API_URL empty if the frontend and API are served from the same origin.
# Add VITE_HMR_* only when you're exposing Vite through a reverse proxy on another host.
VITE_DEV_HOST=0.0.0.0
VITE_DEV_PORT=5001
VITE_ALLOWED_HOSTS=localhost,127.0.0.1,event.bbarni.hackclub.app
VITE_API_URL=
VITE_HMR_HOST=
VITE_HMR_PROTOCOL=wss
VITE_HMR_CLIENT_PORT=443

# If your frontend is on a different origin, list it here.
CORS_ALLOWED_ORIGINS=https://event.bbarni.hackclub.app

FRONTEND_HOST=event.bbarni.hackclub.app
API_HOST=api.event.bbarni.hackclub.app
CADDY_PORT=8080

# Database
DB_USER=eventuser
DB_PASSWORD=eventpass
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=eventpyramide

# Cache (skip if you don't need it initially)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Auth
SESSION_SECRET=pick-something-random-and-long
SESSION_COOKIE_SECURE=true

# Instagram stuff
ADMIN_INSTAGRAM_USERNAMES=your_ig_handle,other_admin
INSTAGRAM_BOT_ACCESS_TOKEN=IGAA...your_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=123456789
```

### Run It

**Local development:**
```bash
python app.py
```

Hit `http://localhost:5001` in your browser.

**Docker:**
```bash
docker compose up --build -d
```

### One-Container Deploy

The Docker setup now runs PostgreSQL, Redis, the Flask backend, and the built frontend in one container. Caddy is the only thing exposed to the outside world, and it listens on a single port.

Point both public hostnames at the same container port in your server proxy:

- `event.bbarni.hackclub.app` -> container port `8080`
- `api.event.bbarni.hackclub.app` -> container port `8080`

The frontend uses the same origin for API calls, so it works from the public domain without extra host-specific config.

## How It Actually Works

1. Guest enters their Instagram username
2. System generates a random 6-digit code
3. Your bot sends it via Instagram DM (they'll see it right away)
4. Guest pastes the code back, boom — they're logged in
5. Admin sees them in the dashboard, can ban them if needed

**Important:** People need to message your bot account first. Instagram won't let you initiate conversations with random users — it's a spam prevention thing. For testing, just DM yourself.

## Admin Panel

Go to `/admin` once you're logged in as an admin.

### What You Can Do

**USERS**
- See everyone who's signed up
- Ban/unban people (no questions asked by the system, but you make the call)

**GRANTS**
- Track who invited who
- See acceptance status

**CONFIG**
- Event date, capacity limits
- Ticket price and currency
- Max invites per person
- Max discount if people use all their invites

**BROADCAST**
- Send a message to everyone at once (use sparingly)

## Language Support

The app supports multiple languages. Default is English. Change it in `.env`:

```env
APP_LANGUAGE=en
```

Or let people pick via the navbar dropdown once they log in. Adding a new language is straightforward — drop a JSON file in `languages/` and update `AVAILABLE_LANGUAGES` in `languages/__init__.py`.

You can also flip languages via API:
```bash
curl -X POST http://localhost:5001/api/language/set/fr
```

## API Endpoints

### Auth
- `POST /auth/request-otp` — Get a code sent to your DMs
- `POST /auth/verify-otp` — Verify the code, create session
- `GET /auth/check-status` — See if you're logged in
- `POST /auth/logout` — Peace out

### User Stuff
- `GET /api/invitations/` — List who you've invited
- `POST /api/invitations/` — Send an invite
- `GET /api/tickets/my-ticket` — Get your ticket
- `POST /api/tickets/generate` — Make a ticket

### Admin Endpoints
- `GET /api/admin/users` — Everyone
- `POST /api/admin/users/{id}/ban` — Block someone
- `POST /api/admin/users/{id}/unban` — Unblock them
- `GET /api/admin/config` — Event settings
- `PUT /api/admin/config` — Update settings
- `GET /api/admin/invitations` — All invitation activity
- `GET /api/admin/tickets` — All tickets
- `POST /api/bot/broadcast` — Send to everyone

## Database Schema

Nothing fancy. Five tables:

- `users` — Sign-up records
- `invitations` — Who invited who
- `event_config` — Event details, pricing, limits
- `tickets` — Generated tickets for attendees
- `bot_messages` — Log of what the bot sent (for debugging)

Fresh database? It'll auto-migrate on first boot. If you're upgrading from an old version, check `migrations/` for what changed.

## Instagram Bot Setup

The bot setup is its own thing. See [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md) for the full walkthrough — includes Meta app creation, getting tokens, all that.

TL;DR: Get a long-lived token from Graph API Explorer, paste it in `.env`, restart. Done.

## What Actually Works, What Doesn't

**Works Great**
- Sending OTP codes via DM
- Multi-language UI
- Banning people
- Simple ticket generation

**Known Quirks**
- Instagram only lets you message people who've messaged you first (not our rule, blame Meta)
- Long-lived tokens expire after 60 days (you'll need to manually refresh via Graph API)
- OTP codes are in-memory by default (fine for small events, use Redis if you're scaling)
- Single admin list (defined by Instagram usernames in `.env`)

**Doesn't Work (Yet)**
- Multi-event management (it's one event per deployment)
- Email fallback if Instagram is down
- Scheduled broadcasts

## Production Checklist

Before you go live:

- [ ] Generate a new `SESSION_SECRET` (something cryptographically random)
- [ ] Get your Instagram app approved for `instagram_manage_messages` permission
- [ ] Switch Meta app from Development to Live mode
- [ ] Set up Redis for OTP storage (in-memory isn't production-ready)
- [ ] Configure HTTPS/SSL (your users' DMs aren't going over HTTP)
- [ ] Use a `.env.production` file, don't hardcode secrets
- [ ] Set `FLASK_ENV=production`
- [ ] Implement token refresh automation (tokens expire every 60 days)

## Troubleshooting

**Bot isn't sending messages**
- Check your `INSTAGRAM_BOT_ACCESS_TOKEN` — expired tokens are the #1 culprit
- Make sure your app is in Live mode, not Development
- User must have messaged your bot account first

**OTP codes never arrive**
- Same as above — token probably expired
- Check Instagram app permissions are approved
- Look at `bot_messages` table to see what the bot attempted

**Database won't connect**
- Verify PostgreSQL is running: `psql -U eventuser -d eventpyramide`
- Check `DB_HOST`, `DB_PORT`, credentials in `.env`
- Migrations might be failing — check logs

**Sessions keep expiring**
- Increase `cookie.maxAge` in the session config (it's in seconds)
- Make sure Redis is running if you're using it

## Development Notes

- OTP codes time out after 10 minutes (configurable)
- Sessions last 30 days by default
- All timestamps are UTC
- The frontend is plain HTML/JS — no build step needed unless you're modifying templates

## License

MIT. Do what you want with it.

---

Need help with Instagram setup? See [INSTAGRAM_SETUP.md](INSTAGRAM_SETUP.md).  
Found a bug? Open an issue or PR.


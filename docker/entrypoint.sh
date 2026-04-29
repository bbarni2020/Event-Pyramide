#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/lib/postgresql/15/bin:/opt/venv/bin:$PATH"
export PGDATA="${PGDATA:-/var/lib/postgresql/data}"
export DB_USER="${DB_USER:-eventuser}"
export DB_PASSWORD="${DB_PASSWORD:-eventpass}"
export DB_NAME="${DB_NAME:-eventpyramide}"
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-5432}"
export REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-5002}"
export APP_MODE="${APP_MODE:-dev}"
export CADDY_PORT="${CADDY_PORT:-5001}"
export VITE_DEV_HOST="${VITE_DEV_HOST:-127.0.0.1}"
export VITE_DEV_PORT="${VITE_DEV_PORT:-5173}"
export FRONTEND_HOST="${FRONTEND_HOST:-event.bbarni.hackclub.app}"
export API_HOST="${API_HOST:-api.event.bbarni.hackclub.app}"

mkdir -p "$PGDATA" /var/lib/redis
chown -R postgres:postgres /var/lib/postgresql /var/lib/redis

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  su postgres -s /bin/bash -c "initdb -D '$PGDATA' --auth=trust --encoding=UTF8"
fi

su postgres -s /bin/bash -c "pg_ctl -D '$PGDATA' -o \"-c listen_addresses=127.0.0.1 -c port=${DB_PORT}\" -w start"

su postgres -s /bin/bash -c "psql -d postgres -tAc \"SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'\"" | grep -q 1 || \
  su postgres -s /bin/bash -c "createuser --no-superuser --no-createdb --no-createrole '${DB_USER}'"

su postgres -s /bin/bash -c "psql -d postgres -c \"ALTER ROLE \\\"${DB_USER}\\\" WITH PASSWORD '${DB_PASSWORD}'\""

su postgres -s /bin/bash -c "psql -d postgres -tAc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\"" | grep -q 1 || \
  su postgres -s /bin/bash -c "createdb -O '${DB_USER}' '${DB_NAME}'"

if ! redis-cli -p "$REDIS_PORT" ping >/dev/null 2>&1; then
  redis-server --daemonize yes --bind 127.0.0.1 --port "$REDIS_PORT" --dir /var/lib/redis --save "" --appendonly no
fi

echo "Running database migrations..."
python run_all_migrations.py

python app.py &
backend_pid=$!

npm run dev -- --host "$VITE_DEV_HOST" --port "$VITE_DEV_PORT" &
frontend_pid=$!

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
caddy_pid=$!

cleanup() {
  set +e
  kill "$backend_pid" "$frontend_pid" "$caddy_pid" 2>/dev/null || true
  redis-cli -p "$REDIS_PORT" shutdown >/dev/null 2>&1 || true
  su postgres -s /bin/bash -c "pg_ctl -D '$PGDATA' -m fast stop" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

wait -n "$backend_pid" "$frontend_pid" "$caddy_pid"
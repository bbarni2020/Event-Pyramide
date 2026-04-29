FROM node:20-bookworm-slim AS frontend-build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM python:3.11-slim-bookworm AS python-deps
WORKDIR /build
COPY requirements.txt ./
RUN python -m venv /opt/venv \
	&& . /opt/venv/bin/activate \
	&& pip install --no-cache-dir --upgrade pip \
	&& pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
		PYTHONDONTWRITEBYTECODE=1 \
		PYTHONUNBUFFERED=1 \
		PATH=/opt/venv/bin:$PATH

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		bash \
		caddy \
		postgresql-15 \
		redis-server \
		tini \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=python-deps /opt/venv /opt/venv
COPY . /app
COPY --from=frontend-build /src/dist /srv/frontend/dist
COPY Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
	&& mkdir -p /var/lib/postgresql/data /var/lib/redis \
	&& chown -R postgres:postgres /var/lib/postgresql /var/lib/redis

EXPOSE 8080

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]

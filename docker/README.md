# TwirChat Docker Compose - Production

This directory contains Docker Compose configuration for production deployment.

## Files

- `docker-compose.yml` - Main production compose file
- `Caddyfile.prod` - Caddy reverse proxy configuration

## Quick Start

1. **Clone repository and navigate to project root**

2. **Create environment file**

```bash
cp .env.example .env
# Edit .env with production values
```

3. **Start services**

```bash
docker compose -f docker/docker-compose.yml up -d
```

4. **View logs**

```bash
docker compose -f docker/docker-compose.yml logs -f
```

## Services

### Backend

- Image: `ghcr.io/twirchat/backend:latest` (or build locally)
- Port: 3000 (internal only)
- Environment: Production
- Auto-restart: always

### Caddy

- Image: `caddy:2-alpine`
- Ports: 80, 443
- Handles: SSL/TLS, compression, WebSocket proxying
- Domain: chat.twir.app

## SSL/TLS

Caddy automatically obtains and renews Let's Encrypt certificates.

For testing, uncomment the staging CA line in Caddyfile.prod:

```
ca https://acme-staging-v02.api.letsencrypt.org/directory
```

## Updating

Pull latest images and restart:

```bash
docker compose -f docker/docker-compose.yml pull
docker compose -f docker/docker-compose.yml up -d
```

## Backup

Database is stored in Docker volume. To backup:

```bash
docker run --rm -v twirchat_data:/data -v $(pwd):/backup alpine tar czf /backup/twirchat-backup-$(date +%Y%m%d).tar.gz -C /data .
```

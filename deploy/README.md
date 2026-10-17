# Deploy BTN with Docker

## What to use

Use **Docker Compose** on the server. It builds two images (`btn-api`, `btn-web`) and runs Postgres.

You do **not** need GitHub for this. Copy the project to the server, then build.

```
Your PC or server folder
        │
        ▼
  docker compose build     ← this creates the images from Dockerfiles
        │
        ▼
  docker compose up -d     ← this starts postgres + api + website
```

Later, if you push to GitHub, `.github/workflows/docker.yml` only **builds** images in CI. It does not deploy by itself. Deploy still happens when you run compose on the server (or add a deploy step later).

## First time on the server

1. Install Docker Engine + Docker Compose plugin.
2. Copy this repo (USB, `scp`, `rsync`, or `git clone` — any method).
3. Copy env file and edit secrets:

```bash
cp .env.example .env
# set POSTGRES_PASSWORD, JWT_SECRET, PUBLIC_URL (your real http/https site URL)
```

4. Build and start:

```bash
# Linux
bash deploy/rebuild.sh

# Windows (PowerShell)
.\deploy\rebuild.ps1
```

Open `http://SERVER:8080` (or the `WEB_PORT` you set).

Admin login is still the seeded account from the API seeder.

## Update without GitHub

Whenever you change code:

1. Copy the new files onto the server (overwrite the project folder).
2. Run `bash deploy/rebuild.sh` or `.\deploy\rebuild.ps1`.

That **rebuilds images from the current files** and restarts containers. Postgres data stays in the `btn_pgdata` volume.

## Update with Git on the server

```bash
git pull
bash deploy/rebuild.sh
```

Same image generation: Compose reads the Dockerfiles and builds.

## Future: GitHub push builds images

Already added: `.github/workflows/docker.yml` runs `docker compose build` on push.

To also **publish** images (GHCR/Docker Hub) and pull on the server, add a registry login + `docker push` step later. Until then, building on the server is enough.

## Notes

- Frontend talks to `/api` on the same host (nginx proxies to the API). Empty `VITE_API_URL` at image build time is correct.
- Set `PUBLIC_URL` in `.env` to the URL people use in the browser (CORS).
- TLS (https) should sit in front (nginx/Caddy on the host, or a cloud load balancer). This compose stack is HTTP inside Docker.

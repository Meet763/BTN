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

<<<<<<< HEAD
## GitHub Actions deployment from `alpha`

`.github/workflows/docker.yml` builds the API and web images on GitHub Actions, pushes them to GHCR, then connects to the VM over SSH. Pushes and merges into `alpha` trigger a deployment. The VM pulls the images and restarts Compose without building them locally.

Before enabling this workflow:

1. Clone the repository's `alpha` branch on the VM and create the server-only `.env` as described above.
2. Add these Actions repository secrets under **Settings > Secrets and variables > Actions**:
   - `VM_HOST`: VM external IP address.
   - `VM_USER`: Linux username used for SSH.
   - `VM_SSH_KEY`: private SSH key; install its matching public key in the VM user's `~/.ssh/authorized_keys`.
   - `VM_KNOWN_HOSTS`: verified SSH host key line for the VM.
   - `VM_APP_DIR`: absolute path to the cloned BTN folder, such as `/home/VM_USER/BTN`.
   - `GHCR_USERNAME`: GitHub username that owns the pull token.
   - `GHCR_PULL_TOKEN`: a personal access token (classic) with the `read:packages` scope.
3. Ensure the PAT owner can read both GHCR packages. The workflow uses `GITHUB_TOKEN` to publish them.

Do not add `.env`, private keys, or tokens to the repository. The VM must have Docker and the `docker-compose` command installed. Initial VM setup also needs the workflow's updated Compose file; clone or pull the latest `alpha` branch before the first Actions deployment.
=======
## Future: GitHub push builds images

Already added: `.github/workflows/docker.yml` runs `docker compose build` on push.

To also **publish** images (GHCR/Docker Hub) and pull on the server, add a registry login + `docker push` step later. Until then, building on the server is enough.
>>>>>>> 54d49b9b884bbd1e917038b4774211b3e8111ead

## Notes

- Frontend talks to `/api` on the same host (nginx proxies to the API). Empty `VITE_API_URL` at image build time is correct.
- Set `PUBLIC_URL` in `.env` to the URL people use in the browser (CORS).
- TLS (https) should sit in front (nginx/Caddy on the host, or a cloud load balancer). This compose stack is HTTP inside Docker.

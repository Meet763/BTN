# Deploy BTN with Docker

Read the [BTN Deployment Learning Guide](../docs/DEPLOYMENT_LEARNING_GUIDE.md) for explanations of every command, where to run it, and how the deployment parts fit together.

## Current automatic deployment

1. Push or merge a change into GitHub's `alpha` branch.
2. [`.github/workflows/docker.yml`](../.github/workflows/docker.yml) builds and publishes the API and web images to GHCR.
3. The VM's cron job runs [`pull-and-run.sh`](pull-and-run.sh) every five minutes. It pulls the `alpha` branch and the published images, then starts Compose with `--no-build`.

GitHub Actions does not SSH into the VM in the current setup. The VM initiates its own pulls, so the workflow does not build images on the VM.

## VM setup checklist

- Install Docker and the Compose command used by `pull-and-run.sh` (`docker-compose`).
- Clone this repository on branch `alpha` into the VM app directory.
- Create the server-only `.env` from `.env.example`; replace example passwords and secrets with strong, private values. Do not commit `.env`.
- If the GHCR packages are private, run `docker login ghcr.io -u Meet763` on the VM and enter a GitHub PAT (classic) with `read:packages` at the password prompt.
- Install and start cron: `sudo apt update`, `sudo apt install -y cron`, then `sudo systemctl enable --now cron`.
- Run `crontab -e` and add this line, changing the path if the checkout is elsewhere:

  ```cron
  */5 * * * * /bin/bash /home/gru68212/BTN/deploy/pull-and-run.sh >> /home/gru68212/BTN/deploy/deploy.log 2>&1
  ```

- Run the script once to deploy immediately: `bash ~/BTN/deploy/pull-and-run.sh`.

## Manual build on the VM

For learning or troubleshooting, `docker-compose up -d --build` builds images from the checked-out source and starts the services on the VM. The automatic workflow uses prebuilt GHCR images instead, via `docker-compose pull` followed by `docker-compose up -d --no-build`.

PostgreSQL data is stored in the named volume `btn_pgdata`. Avoid `docker-compose down -v`; `-v` removes volumes and can erase the database.

The website is published on the host port in `WEB_PORT` (default `8080`). Set `PUBLIC_URL` to the address users open in their browser. The current Compose setup does not configure HTTPS by itself.

# BTN Deployment Learning Guide

This guide explains the commands and deployment steps used for BTN in this repository. It is written for learning: it says **where** to type each command, what the pieces mean, what should happen, and what to check when something goes wrong.

## The deployment in one picture

```text
Your computer                         GitHub                         Google Cloud VM
--------------                         ------                         --------------
Edit code on branch alpha  --push-->  GitHub Actions builds images
                                      and publishes them to GHCR
                                                                      cron checks every 5 min
                                                                      pulls latest images
                                                                      Compose starts containers
```

The current GitHub Actions workflow builds and publishes the API and website images. It does **not** SSH into the VM. A cron job on the VM runs `deploy/pull-and-run.sh` every five minutes. That script pulls the latest source and images, then tells Docker Compose to start the services using the published images.

The VM runs three main services:

- **web**: the website, reachable on the VM's port configured by `WEB_PORT` (currently `8080` by default).
- **api**: the .NET backend. The website's Nginx forwards `/api` requests to it inside Docker.
- **postgres**: the database. Its data is kept in the Docker volume `btn_pgdata`.

## Where commands go

The same-looking command can behave differently depending on where it is run. Use these labels throughout the guide:

- **Local PowerShell**: a PowerShell window on your Windows computer, usually in `D:\btn`.
- **VM terminal**: the Linux terminal after SSH-ing into the Google Cloud VM, usually as `gru68212`.
- **Crontab editor**: the text editor opened by `crontab -e` on the VM. The schedule line is text for this editor, not a command to run at the shell prompt.
- **GitHub website / Google Cloud Console**: settings entered in those web pages, not in a terminal.

## A few shell basics

In a Linux command, `~` means the current Linux user's home directory. For `gru68212`, that is usually `/home/gru68212`. In Windows PowerShell, `$env:USERPROFILE` means your Windows user folder, such as `C:\Users\HP`.

Spaces separate command arguments. For example, in `git switch alpha`, `git` is the program, `switch` is the action, and `alpha` is the branch name. A leading `sudo` asks Linux to run the command with administrator privileges; only use it for system-level work.

`&&` means “run the next command only if the previous command succeeded.” A pipe `|` sends one command's output into another command. These symbols are shell syntax; they are not part of the command names.

## Connect to the VM with SSH

### From Windows PowerShell

```powershell
ssh -i "$env:USERPROFILE\.ssh\btn_actions" gru68212@35.255.133.69
```

- `ssh` opens a secure terminal session to another computer.
- `-i` selects the **private key** file to prove your identity. Keep that private file on your computer and never paste it into a public place.
- `gru68212` is the Linux account on the VM.
- `35.255.133.69` is the VM's external IP. Use the current IP shown in Google Cloud if it changes.
- `user@address` tells SSH which account and machine to connect to.

When SSH says the host is unknown, it is asking whether to trust the VM's **host key**. That key identifies the server to your computer; it is different from your personal SSH login key. Verify the server identity before accepting it. If verification fails, stop and resolve the mismatch instead of repeatedly accepting new keys.

### The VM's SSH key files

On the VM, `~/.ssh/authorized_keys` contains **public** keys allowed to log in as the current Linux user. Add a new public key on its own line; preserve any Google-managed or existing lines.

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

- `mkdir` creates a directory; `-p` also creates missing parent directories and does not complain if the directory already exists.
- `nano` opens a text editor. Paste the public key (the `.pub` file contents), save with **Ctrl+O**, press **Enter**, and exit with **Ctrl+X**.
- `chmod` changes file permissions. `700` means only you can list/read/change the `.ssh` directory; `600` means only you can read/write `authorized_keys`.
- These commands are run in the **VM terminal**, not in PowerShell.

If `authorized_keys` did not exist, opening it in `nano` creates it when you save. The `.ssh` directory may exist and look empty; `ls -a ~/.ssh` includes hidden files, while plain `ls` does not.

To check a saved server key from PowerShell:

```powershell
ssh-keygen -F 35.255.133.69 -f "$env:USERPROFILE\.ssh\known_hosts"
```

`ssh-keygen -F` searches the local `known_hosts` file for that server. It does not show your private login key.

## Install and understand Docker on Debian

On the VM, package names depend on the Debian release and configured package sources. A typical installation command is:

```bash
sudo apt update
sudo apt install -y docker.io git
```

- `apt update` refreshes the list of packages available from configured repositories. It does not upgrade the whole system.
- `apt install` installs packages. `-y` answers “yes” to the package manager's confirmation prompt.
- `docker.io` is Debian's Docker package; `git` is needed for the VM deployment script to pull the repository.

Compose is the tool that reads `docker-compose.yml` and coordinates the web, API, and database containers. Depending on how Compose was installed, its command is either the modern plugin form or the standalone form:

```bash
docker compose version
docker-compose version
```

The current `deploy/pull-and-run.sh` uses the standalone spelling, `docker-compose`. The space in `docker compose` is not interchangeable on every installation. If you see `docker: 'compose' is not a docker command`, that installation does not have the Compose plugin under that spelling. If `docker-compose: command not found`, the standalone command is missing. Check which form is installed before changing commands or packages.

Check Docker itself with:

```bash
docker --version
sudo systemctl status docker
```

### What the Docker group command means

```bash
sudo usermod -aG docker "$USER"
```

- `usermod` changes a Linux account.
- `-aG docker` appends the account to the `docker` group. `-a` is important: without it, other group memberships can be replaced.
- `"$USER"` expands to the current Linux username.

This lets that account run Docker commands without prefixing each one with `sudo`. Docker access is powerful, so only trusted accounts should be in this group. Log out of the VM and SSH in again before expecting the new group membership to work.

## Repository, branch, and code updates

The project has `alpha` and `beta` branches. In the repository, `alpha` is the default branch and the deployment workflow listens to pushes on `alpha`.

On the VM, these commands inspect or update the checkout:

```bash
cd ~/BTN
git status --short
git branch --show-current
git branch -a
git log --oneline -5
git pull --ff-only origin alpha
```

- `cd ~/BTN` changes the current directory to the VM's project folder.
- `git status --short` shows local file changes in a compact form.
- `git branch --show-current` tells you which branch is checked out.
- `git branch -a` lists local and remote branches.
- `git log --oneline -5` shows the five latest commits in a compact format.
- `git pull --ff-only origin alpha` downloads and applies changes from the remote repository's `alpha` branch. `--ff-only` stops if the VM's branch has diverged instead of creating a surprise merge.

For a public repository, cloning normally does not require a GitHub password:

```bash
git clone https://github.com/Meet763/BTN.git
cd BTN
git switch alpha
```

`git clone` makes a local copy; `git switch alpha` checks out that branch. If GitHub asks for a password for a public clone, cancel and check the URL or credential setup. GitHub account passwords are not used for Git over HTTPS. A token is only needed for operations that require authentication, such as pulling a private package or writing to a private repository.

On your computer, a normal code update looks like:

```powershell
git status --short
git add path\to\changed-file
git commit -m "Describe the change"
git push origin alpha
```

- `git add` stages selected changes for the next commit.
- `git commit` records staged changes in your local Git history.
- `git push origin alpha` uploads commits to GitHub's `alpha` branch. The push is what starts the GitHub Actions workflow.

Merging a pull request into `alpha` also creates a push to `alpha`, so it triggers the workflow. Pushing only to `beta` does not trigger this workflow.

## GitHub Actions and Docker images

The workflow is [`.github/workflows/docker.yml`](../.github/workflows/docker.yml). Its trigger is:

```yaml
on:
  push:
    branches: [alpha]
```

This means GitHub starts the workflow after a push to `alpha`. `workflow_dispatch` also allows a person to start it manually from the GitHub Actions page.

The workflow builds two Docker images on a GitHub-hosted runner:

- `ghcr.io/meet763/btn-api` from `deploy/docker/api.Dockerfile`.
- `ghcr.io/meet763/btn-web` from `deploy/docker/web.Dockerfile`.

It publishes two tags for each image: `latest` and the Git commit's full SHA. `latest` is the moving “most recently built” tag; the SHA tag identifies the exact code version used for that image.

The workflow logs in to **GHCR**, GitHub Container Registry, using the temporary `GITHUB_TOKEN` provided to that workflow. `packages: write` lets that workflow publish packages. This is separate from the VM's ability to download private images.

### What `read:packages` is for

If the GHCR packages are private, the VM needs a GitHub **personal access token (classic)** with `read:packages` to download them. Enter it as the password when `docker login` prompts you; do not put the token directly in a command, commit it, or paste it into chat.

```bash
docker login ghcr.io -u Meet763
```

The username is the GitHub account that can access the package. At the password prompt, paste the token. A token's secret value is shown only when it is created. If it is lost, create a replacement and update the saved login. For public packages, authentication may not be required to pull; package visibility determines that.

The workflow's `GITHUB_TOKEN` publishes the images. It does **not** automatically log the VM into GHCR. These are two different machines and two different permissions.

## VM environment settings (`.env`)

The Compose file reads values from a `.env` file in the project directory. `.env.example` is a sample; `.env` contains the actual server values and should stay on the VM, private, and out of Git.

The main settings are:

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: database account and database name used by the PostgreSQL container.
- `JWT_SECRET`: secret used to sign login tokens. Set a long, random, private value in production.
- `PUBLIC_URL`: browser-facing site origin used for CORS. It must match the site's real address, including scheme and port where relevant.
- `WEB_PORT`: host port where the website is published. The default in this project is `8080`.

The Compose file uses `:?` checks for `POSTGRES_PASSWORD` and `JWT_SECRET`. If either is missing, Compose stops and tells you to set it. Do not use example or development secrets on a public server. Do not paste secret values into logs, GitHub issues, screenshots, or chat.

## Starting, updating, and stopping Compose

Run these from the **VM terminal**, inside `~/BTN`, unless the command includes a path to the Compose file.

```bash
docker-compose ps
docker-compose logs --tail=50
docker-compose logs -f api
docker-compose logs -f web
docker-compose stop
docker-compose start
```

- `ps` shows service/container status.
- `logs --tail=50` shows the latest 50 log lines. `-f` follows new lines live; press **Ctrl+C** to stop following logs (the containers keep running).
- `stop` stops the containers but keeps them and their data. `start` starts stopped containers again.

Other Compose commands have different effects:

```bash
docker-compose build
docker-compose up -d --build
docker-compose pull
docker-compose up -d --no-build
docker-compose down
```

- `build` creates images from the local files and Dockerfiles on the machine where it runs.
- `up -d --build` builds images if needed and starts containers in the background (`-d`).
- `pull` downloads the images named in the Compose file from the registry.
- `up -d --no-build` starts or recreates containers using images already present locally and refuses to build on that machine.
- `down` stops and removes the Compose containers and network. A named volume normally remains.
- **Do not add `-v` to `down` casually.** `docker-compose down -v` also removes Compose-managed volumes, including this project's PostgreSQL data volume, and can erase the database.

The VM's timed deploy script runs `pull`, then `up -d --no-build`. So it **does not rebuild the application images on the VM**. GitHub Actions builds them; the VM downloads them.

## The five-minute cron job

Cron is Linux's scheduler. It runs a command at a set time even when you are not watching the terminal.

Install/start the cron service on the VM if needed:

```bash
sudo apt update
sudo apt install -y cron
sudo systemctl enable --now cron
```

- `systemctl` manages Linux services.
- `enable` configures a service to start automatically after a reboot.
- `--now` starts it immediately too.

Open your Linux user's scheduled jobs:

```bash
crontab -e
```

Paste this **one schedule line into the editor** (adjust the path only if your repository is in a different folder):

```cron
*/5 * * * * /bin/bash /home/gru68212/BTN/deploy/pull-and-run.sh >> /home/gru68212/BTN/deploy/deploy.log 2>&1
```

The five time columns are minute, hour, day of month, month, and day of week. `*/5` in the minute column means every five minutes; the four `*` values mean every hour, every day of the month, every month, and every day of the week.

The rest of the line means:

- `/bin/bash` explicitly runs the script with Bash.
- `/home/gru68212/BTN/deploy/pull-and-run.sh` is the script path.
- `>> .../deploy.log` appends normal output to the log file. Two `>` characters mean append; one `>` would replace the file each run.
- `2>&1` sends error output (file descriptor 2) to the same place as normal output (file descriptor 1), so both go into `deploy.log`.

In **nano**, save with **Ctrl+O**, press **Enter**, then exit with **Ctrl+X**. In **vi/vim**, press **Esc**, type `:wq`, and press **Enter**. Seeing another blank line after pressing Enter is normal: the editor is ready for another line. The crontab is active after you save and exit.

Check that it was saved:

```bash
crontab -l
```

`-l` means list. Confirm the schedule line appears. The shell creates `deploy.log` the first time cron starts the scheduled command, even if the script prints nothing. “No such file” immediately after saving is normal before that first scheduled run.

After waiting at least five minutes, inspect the most recent output:

```bash
tail -n 50 /home/gru68212/BTN/deploy/deploy.log
```

`tail` reads the end of a file; `-n 50` asks for 50 lines. If the log is still missing or has an error, check the saved schedule (`crontab -l`), cron service (`sudo systemctl status cron`), and run the script manually:

```bash
cd ~/BTN
bash deploy/pull-and-run.sh
```

The manual command shows output in the terminal. To also append that manual run to the log, use:

```bash
bash deploy/pull-and-run.sh >> deploy/deploy.log 2>&1
```

## What the deployment script does

The current script is [`deploy/pull-and-run.sh`](../deploy/pull-and-run.sh). In order, it:

1. Stops on most command errors (`set -euo pipefail`). This is safer than continuing with half a deployment.
2. Finds the project folder based on the script's own location, so it can run from cron without assuming the shell started in `~/BTN`.
3. Creates a lock file and uses `flock` to avoid two deployments overlapping if one takes longer than five minutes.
4. Pulls the latest `alpha` source with `git pull --ff-only origin alpha`.
5. Downloads the API and web images with `docker-compose pull`.
6. Starts/recreates the services from those images using `docker-compose up -d --no-build`.

The script does not remove PostgreSQL's named data volume. The database remains in `btn_pgdata` across regular container updates.

## Google Cloud firewall and website port

A network tag is a label on the VM. A firewall rule can target that tag so the rule applies only to tagged VMs in the selected network.

The Compose file publishes the website on host port `8080` by default (`WEB_PORT=8080`). The Google Cloud “Allow HTTP traffic” checkbox normally allows port `80`; “Allow HTTPS traffic” normally allows port `443`. Those checkboxes alone do not open port `8080`.

For the current direct setup, the VM needs a VPC ingress firewall rule for **TCP 8080**, targeted at the VM's web network tag. Then the browser address is:

```text
http://VM_EXTERNAL_IP:8080
```

Port 443 is useful only when a TLS/HTTPS service is configured to listen there. Do not assume the current Compose file provides HTTPS. Keep the database port private; PostgreSQL is not published to the public internet by this Compose file.

SSH uses TCP port 22. GitHub-hosted runners previously timed out trying to SSH into this VM. The current deployment avoids that inbound runner connection: the VM checks GHCR itself on a timer. For human SSH, use Google Cloud's browser SSH or a firewall rule restricted to your own IP where practical.

## GitHub repository secrets and old SSH setup

The current workflow reads no `VM_HOST`, `VM_USER`, `VM_SSH_KEY`, or `VM_KNOWN_HOSTS` secrets because it does not connect to the VM. Those values were part of the earlier direct-SSH deployment attempt. A timeout there meant the runner could not establish a network connection to port 22; it was not evidence that Docker image building had failed.

The VM still needs registry read access if the GHCR images are private. That is why the VM's `docker login ghcr.io` may need a `read:packages` token. Keep a token out of the repo and rotate it if it may have been exposed.

## A normal update, start to finish

1. Make the code change on your computer.
2. Commit and push it to GitHub's `alpha` branch (or merge a pull request into `alpha`).
3. Open **GitHub → Actions** and make sure “Build and publish BTN” succeeds. This builds and publishes both images.
4. The VM's cron job checks every five minutes. It pulls the new images and starts the updated containers.
5. If the site does not update, inspect `deploy.log` on the VM and then check `docker-compose ps` and `docker-compose logs --tail=50`.

If the GitHub workflow is still building when the VM checks GHCR, the VM may get the previous `latest` image on that run. The next cron run should check again and pull the newly published image.

## Common messages translated

| Message | Meaning / next check |
|---|---|
| `docker: 'compose' is not a docker command` | The `docker compose` plugin spelling is unavailable. Check whether `docker-compose version` works. |
| `Unable to locate package ...` | Debian's configured repositories do not have that exact package name. Check OS/repositories and available Compose package before retrying another name. |
| `Username for 'https://github.com'` while cloning a public repo | Cancel and check the repository URL. A public clone should not need your account password. |
| `Permission denied` for SSH key files | Check that you edited the public-key file for the correct Linux user and set `.ssh` permissions as above. Do not share the private key. |
| SSH `Connection timed out` | The client cannot reach TCP 22 through the network/firewall. It is different from a rejected key. Current image deployment uses VM polling instead. |
| SSH `Host key verification failed` | The server identity was not accepted or does not match the saved host key. Verify the VM identity; do not blindly discard the check. |
| `tail: ... deploy.log: No such file or directory` | Cron may not have run yet, or there was no output. Confirm `crontab -l`, wait five minutes, or run the script manually with log redirection. |
| Docker pull says access denied | Check the image name, package visibility, and whether the VM is logged in to GHCR with permission to read the package. |
| Compose says a required variable is missing | Check that `.env` exists in the project folder and contains the required variable names. Do not paste its secret values into chat. |

## Changing the customer-facing company name

This is an application setting, not a VM command. Sign in using a **Customer** account, click the avatar at the top right, open **Account Settings**, edit **Company name**, and save. The name appears in that customer's left sidebar. Platform Owner accounts do not see this customer-only setting.

## Going forward: understand each command before running it

When following instructions, first identify whether the command belongs in PowerShell, the VM terminal, a text editor, or a cloud/GitHub website. Read the explanation under the command and compare the expected result with what you see. If an error appears, stop and share the exact error text (but remove passwords, tokens, and private keys). It is safe to ask what each word, option, path, or symbol means before continuing.

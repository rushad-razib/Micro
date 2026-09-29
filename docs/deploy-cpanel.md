# First production deploy (cPanel)

After the Deploy workflow exists in the repo, finish these once on your machine / cPanel / GitHub.

Production host: `https://tools.rushadrazib.com`. There is no database and no Node app.

## 1. Subdomain and document root

In cPanel, create the subdomain `tools.rushadrazib.com`.

- Document root: `/home/<user>/tools.rushadrazib.com/public` (the Laravel `public` directory)
- PHP version: 8.3 or newer for that subdomain
- Enable Let's Encrypt HTTPS (same as the Learning project)

Make `storage` and `bootstrap/cache` writable by the web user after the first upload.

## 2. SSH deploy key

Reuse the Learning deploy key if this is the same cPanel account, or create one:

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\tools_deploy -N '""' -C "github-actions-tools-deploy"
```

- Append the `.pub` file to the server `~/.ssh/authorized_keys` (cPanel → SSH Access, or SSH yourself).
- Put the **private** key contents in GitHub → Settings → Secrets → Actions as `DEPLOY_SSH_KEY`.

## 3. GitHub Actions secrets

| Secret | Example / notes |
|--------|-----------------|
| `DEPLOY_HOST` | server hostname or IP |
| `DEPLOY_USER` | cPanel username (e.g. `rushadra`) |
| `DEPLOY_SSH_KEY` | full private key (`BEGIN`/`END` lines included) |
| `DEPLOY_PATH` | `/home/<user>/tools.rushadrazib.com` |
| `DEPLOY_PORT` | `22` (omit if default) |

Do **not** add `DATABASE_URL` or `DEPLOY_NODE_ACTIVATE`. This app does not use MySQL or a Node process.

## 4. Server `.env` (once)

SSH in and create `/home/<user>/tools.rushadrazib.com/.env` from `.env.example`. Generate a key locally (`php artisan key:generate --show`) and paste it. Minimum:

```
APP_NAME="Image tools"
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://tools.rushadrazib.com
APP_MAINTENANCE_DRIVER=file
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
MAIL_MAILER=log
LOG_CHANNEL=stack
LOG_STACK=single
```

Leave `DB_*` unset. `REGISTRY_SHOW_DRAFTS` stays empty so production 404s draft tools.

The workflow never uploads `.env`. Later deploys keep this file.

## 5. Trigger deploy

Push to `main` (or Actions → Deploy → Run workflow).

The job builds Composer and Vite on GitHub, validates the registry, uploads a tarball over one SSH session (cPanel often has no rsync), then runs `php artisan registry:cache` and `view:cache`. There is no migrate step.

Remote commands use `bash --noprofile --norc` so login does not source `/etc/profile.d` (those scripts can fail when NPROC is tight).

## 6. Verify

- `https://tools.rushadrazib.com/` returns HTML
- `https://tools.rushadrazib.com/compress-image` is 404 while the tool is `draft`
- `https://tools.rushadrazib.com/sitemap.xml` does not list draft tools
- `https://tools.rushadrazib.com/robots.txt` points at the sitemap

Locally, with `APP_ENV=local`, open a draft tool at phone width and confirm the drop zone is first.

## If upload fails with `fork: Resource temporarily unavailable`

cPanel NPROC was full during the job. Stop extra processes, confirm RAM is not pinned, and run one Deploy.

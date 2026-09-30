# First production deploy (cPanel)

After the Deploy workflow exists in the repo, finish these once on your machine / cPanel / GitHub.

**Canonical host:** `https://tools.rushadrazib.com` (HTTPS only). The app 301s other hosts and `http` to this URL when `APP_ENV=production`. There is no database and no Node app.

## 1. Subdomain and document root

In cPanel, create the subdomain `tools.rushadrazib.com`.

- Document root: `/home/<user>/tools.rushadrazib.com/public` (the Laravel `public` directory)
- PHP version: **8.4** for that subdomain in **MultiPHP Manager** (web requests)
- Enable Let's Encrypt HTTPS (same as the Learning project)

Make `storage` and `bootstrap/cache` writable by the web user after the first upload.

**Important:** SSH `php` on shared hosts is often still 8.2/8.3 even when MultiPHP is 8.4 for the site. Find the 8.4 binary once:

```bash
ls /usr/local/bin/ea-php84
# or
ls /opt/cpanel/ea-php84/root/usr/bin/php
/usr/local/bin/ea-php84 -v
```

Put that full path in the GitHub secret `DEPLOY_PHP` (see below).

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
| `DEPLOY_PHP` | `/usr/local/bin/ea-php84` (or the path you found with `ls` above) |

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
MAIL_MAILER=smtp
MAIL_HOST=...
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS="hello@rushadrazib.com"
MAIL_FROM_NAME="${APP_NAME}"
SITE_OPERATOR_NAME="Rushad Razib"
SITE_CONTACT_EMAIL="hello@rushadrazib.com"
GOOGLE_SITE_VERIFICATION=
LOG_CHANNEL=stack
LOG_STACK=single
```

Leave `DB_*` unset. `REGISTRY_SHOW_DRAFTS` stays empty so production 404s draft tools. Set `GOOGLE_SITE_VERIFICATION` to the HTML-tag token from Search Console when you have it.

The workflow never uploads `.env`. Later deploys keep this file.

## 5. Trigger deploy

Push to `main` (or Actions → Deploy → Run workflow).

The job builds Composer and Vite on GitHub, validates the registry, uploads a tarball over one SSH session (cPanel often has no rsync), then runs `registry:cache` and `view:cache` with the PHP binary from `DEPLOY_PHP`. There is no migrate step.

Remote commands use `bash --noprofile --norc` so login does not source `/etc/profile.d` (those scripts can fail when NPROC is tight).

## 6. Verify

- `https://tools.rushadrazib.com/` returns HTML
- `https://tools.rushadrazib.com/compress-image` returns **200** (phase 1 tools are live)
- `https://tools.rushadrazib.com/sitemap.xml` lists live tools and omits phase 2 slugs (`favicon-generator`, `heic-to-jpeg`)
- `https://tools.rushadrazib.com/robots.txt` includes `Allow: /` and a `Sitemap:` line pointing at the production sitemap (must not be the empty Laravel stub)
- DevTools Network while running a tool: no image upload POST
- Contact form: a real message arrives when SMTP is configured

## 7. CDN (Cloudflare or equivalent)

Put a CDN in front of the host for static assets and short HTML caching of anonymous GET pages.

- Cache HTML GET briefly (minutes). Do **not** cache `POST /contact`.
- Codec WASM/JS from Vite already use hashed filenames — long-cache those.
- After each deploy, purge the CDN HTML cache so titles and sitemap updates are visible.
- The app trusts `X-Forwarded-*` so HTTPS and host detection work behind the proxy.

## 8. Phase C — Search Console and indexation

1. In [Google Search Console](https://search.google.com/search-console), add a URL-prefix property for `https://tools.rushadrazib.com`.
2. Verify with the HTML tag: paste the token into `GOOGLE_SITE_VERIFICATION` on the server `.env`, redeploy or clear views, confirm the meta tag on the homepage.
3. Submit `https://tools.rushadrazib.com/sitemap.xml`.
4. Request indexing in this order: homepage, `/images` hub, the six tools (`/compress-image`, `/resize-image`, `/convert-image`, `/crop-image`, `/rotate-image`, `/strip-image-metadata`), then the four presets, then the three guides.
5. Optional: Bing Webmaster Tools with the same sitemap.
6. Run mobile Lighthouse (or Actions → Lighthouse → Run workflow) on `/compress-image` and `/youtube-thumbnail-resizer`. Target LCP under 2.5s and CLS under 0.1 with the empty ad slot reserved.

### GSC triage

When Search Console reports issues, fix in the registry/content (not by adding doorway URLs):

- Duplicate titles → unique `seo_title` (validator rejects duplicates)
- Excluded draft / soft 404 → keep drafts out of sitemap; live URLs must return real HTML with an H1
- Do not publish phase 2 tools during Phase C

## If upload fails with `fork: Resource temporarily unavailable`

cPanel NPROC was full during the job. Stop extra processes, confirm RAM is not pinned, and run one Deploy.

# Image tools

Laravel app for browser-side image tools. Phase A is the shell: file catalog, shared layouts, draft tools. No database.

## Local

```bash
composer install
cp .env.example .env
php artisan key:generate
npm install
npm run dev
php artisan serve
```

`APP_ENV=local` shows draft tools so the empty drop zone can be checked. Production 404s drafts.

```bash
php artisan registry:validate
php artisan test
```

## Deploy

Push to `main`. See [docs/deploy-cpanel.md](docs/deploy-cpanel.md) for the one-time cPanel and GitHub secrets setup (`tools.rushadrazib.com`).

Product docs live in [docs/](docs/).

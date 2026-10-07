# Deployment

## Current live setup

| | |
|---|---|
| Site | https://admin.ibimaassist.online → nginx → static `dist/` build |
| VPS | 200.234.37.130 (same box as the super-admin, call-center and web app), user `deploy` |
| Repo on VPS | `/home/deploy/car-damage-insurance-admin` (cloned from `github.com/vermakhushbu723/car-damage-insurance-admin`) |
| nginx site | `/etc/nginx/sites-available/admin` (symlinked into `sites-enabled`) |
| SSL | Let's Encrypt via `certbot --nginx`, HTTP → HTTPS redirect, auto-renews (`certbot.timer`) |

No backend: all data lives in the browser's localStorage, so there's no API proxy and no PM2 process.

## Deploy a new version

```bash
# push from your machine first: git push origin main
ssh deploy@200.234.37.130          # or root, then: sudo -u deploy -H bash
cd /home/deploy/car-damage-insurance-admin
git pull
npm ci        # only needed if package.json changed
npm run build
# nothing else -- nginx serves dist/ directly, no reload needed
```

Always build as `deploy`. If the repo gets pulled as root by mistake:
`sudo chown -R deploy:deploy /home/deploy/car-damage-insurance-admin`

## nginx config (certbot added the SSL server block + redirect)

```nginx
server {
    listen 80;
    server_name admin.ibimaassist.online;
    root /home/deploy/car-damage-insurance-admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback for React Router
    }
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

# Ubuntu Hosting (Simple Setup)

This app can run as a standalone Node service on Ubuntu using `systemd` + `nginx`.

## 1) First-time server setup

On your Ubuntu host:

```bash
cd /opt/tiligo-mobile
bash artifacts/mobile/server/deploy/setup-ubuntu.sh
```

Optional environment overrides:

```bash
APP_DIR=/opt/tiligo-mobile \
SERVICE_NAME=tiligo-mobile \
APP_PORT=3000 \
RUN_USER=ubuntu \
DOMAIN=example.com \
bash artifacts/mobile/server/deploy/setup-ubuntu.sh
```

## 2) Expected runtime layout

The GitHub Action deploys static files to:

- `/opt/tiligo-mobile/static-build`

And `systemd` runs:

- `/opt/tiligo-mobile/server/serve.js`

So your server should have a checked-out copy of this repository at `/opt/tiligo-mobile`.

## 3) GitHub Actions secrets for deploy

Set these repository secrets:

- `UBUNTU_HOST` (required)
- `UBUNTU_USER` (required)
- `UBUNTU_SSH_KEY` (required, private key)
- `UBUNTU_PORT` (optional, default `22`)
- `UBUNTU_APP_DIR` (optional, default `/opt/tiligo-mobile`)
- `UBUNTU_SERVICE_NAME` (optional, default `tiligo-mobile`)

Workflow file:

- `.github/workflows/mobile-landing-ubuntu.yml`

## 4) Store links

`serve.js` supports these optional environment variables:

- `APP_STORE_URL`
- `PLAY_STORE_URL`

If missing, landing page buttons default to `#`.

## 5) Useful commands

```bash
sudo systemctl status tiligo-mobile
sudo journalctl -u tiligo-mobile -f
sudo nginx -t
```

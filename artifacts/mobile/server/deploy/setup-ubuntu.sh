#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tiligo-mobile}"
SERVICE_NAME="${SERVICE_NAME:-tiligo-mobile}"
APP_PORT="${APP_PORT:-3000}"
RUN_USER="${RUN_USER:-$USER}"
DOMAIN="${DOMAIN:-_}"

sudo apt-get update
sudo apt-get install -y curl nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v pnpm >/dev/null 2>&1; then
  sudo npm install -g pnpm
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R "$RUN_USER":"$RUN_USER" "$APP_DIR"

cat <<EOF | sudo tee /etc/systemd/system/${SERVICE_NAME}.service >/dev/null
[Unit]
Description=Tiligo mobile static server
After=network.target

[Service]
Type=simple
User=${RUN_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=BASE_PATH=/
ExecStart=/usr/bin/node ${APP_DIR}/server/serve.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat <<EOF | sudo tee /etc/nginx/sites-available/${SERVICE_NAME}.conf >/dev/null
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/${SERVICE_NAME}.conf /etc/nginx/sites-enabled/${SERVICE_NAME}.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}
sudo systemctl restart nginx

echo "Ubuntu hosting setup complete for ${SERVICE_NAME}."

#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  LogHist — первичный деплой на сервер
#  Стек: FastAPI + MongoDB + React/Vite + Nginx
# ─────────────────────────────────────────────
REPO="https://github.com/POOFFINGG/mini-app-loghist.git"
APP_DIR="/home/app/loghist"
APP_NAME="loghist"
DOMAIN="iilogist.code-master-py.twc1.net"
BACKEND_PORT=8002

echo "==> [1/9] Исправление кэша APT"
apt-get clean
rm -f /var/lib/apt/lists/lock /var/lib/dpkg/lock
# Убираем сломанный nodesource репо если есть
rm -f /etc/apt/sources.list.d/nodesource.list
apt-get update || true

echo "==> [2/9] Установка базовых зависимостей"
DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl git nginx python3 python3-pip python3-venv \
    certbot python3-certbot-nginx

echo "==> [3/9] Установка Node.js + npm"
DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm
node -v && npm -v

echo "==> [4/9] Установка MongoDB"
if ! command -v mongod &>/dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
        | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
        | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update && apt-get install -y mongodb-org
fi
systemctl enable mongod && systemctl start mongod

echo "==> [5/9] Подготовка приложения"
rm -rf "$APP_DIR"
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "==> [6/9] Backend: venv и зависимости"
python3 -m venv "$APP_DIR/backend/.venv"
"$APP_DIR/backend/.venv/bin/pip" install --upgrade pip
"$APP_DIR/backend/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

cat > "$APP_DIR/backend/.env" <<EOF
MONGO_URI=mongodb://localhost:27017
MONGO_DB=loghist
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_KEY=$(openssl rand -hex 16)
PORT=$BACKEND_PORT
ENVIRONMENT=production
EOF
echo ""
echo "  !! Добавь в $APP_DIR/backend/.env ключи: OPENAI_API_KEY, BOT_TOKEN и др."
echo ""

echo "==> [7/9] Frontend: Сборка"
npm install --prefix "$APP_DIR"
npm run build --prefix "$APP_DIR"

echo "==> [8/9] Systemd-сервис для backend"
cat > /etc/systemd/system/$APP_NAME.service <<EOF
[Unit]
Description=LogHist FastAPI Backend
After=network.target mongod.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/.venv/bin"
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port $BACKEND_PORT --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $APP_NAME
systemctl restart $APP_NAME

echo "==> [9/9] Nginx + SSL"
rm -f /etc/nginx/sites-enabled/default
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    root $APP_DIR/dist/public;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass         http://127.0.0.1:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
        expires 7d;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@$DOMAIN || \
    echo "  Пропущено — настрой SSL вручную: certbot --nginx -d $DOMAIN"

echo ""
echo "Деплой завершён!"
echo "  Сайт:        https://$DOMAIN"
echo "  Статус:      systemctl status $APP_NAME"
echo "  Логи:        journalctl -u $APP_NAME -f"
echo "  .env:        $APP_DIR/backend/.env"

#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  LogHist — исправленный деплой
#  Стек: FastAPI + MongoDB + React/Vite + Nginx
# ─────────────────────────────────────────────

REPO="https://github.com/POOFFINGG/mini-app-loghist.git"
APP_DIR="/home/app/loghist"
APP_NAME="loghist"
DOMAIN="iilogist.code-master-py.twc1.net"
BACKEND_PORT=8002

echo "==> [1/9] Очистка кэша и обновление системы"
# Исправляем проблему "unexpected size" путем полной очистки списков
rm -rf /var/lib/apt/lists/*
apt update && apt upgrade -y

# Устанавливаем зависимости (БЕЗ npm, так как он идет в составе nodejs)
apt install -y curl git nginx python3 python3-pip python3-venv certbot python3-certbot-nginx

echo "==> [2/9] Установка Node.js (NodeSource)"
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo "==> [3/9] Установка MongoDB"
if ! command -v mongod &>/dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
        | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update && apt install -y mongodb-org
fi
systemctl enable mongod && systemctl start mongod

echo "==> [4/9] Клонирование репозитория"
rm -rf "$APP_DIR"
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "==> [5/9] Python venv + зависимости backend"
python3 -m venv "$APP_DIR/backend/.venv"
"$APP_DIR/backend/.venv/bin/pip" install --upgrade pip
"$APP_DIR/backend/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

echo "==> [6/9] Настройка .env"
cat > "$APP_DIR/backend/.env" <<EOF
MONGO_URI=mongodb://localhost:27017
MONGO_DB=loghist
JWT_SECRET=$(openssl rand -hex 32)
ADMIN_KEY=$(openssl rand -hex 16)
PORT=$BACKEND_PORT
ENVIRONMENT=production
EOF

echo "==> [7/9] Сборка Frontend"
# Используем npm, который установился вместе с nodejs
npm install --prefix "$APP_DIR"
npm run build --prefix "$APP_DIR"

echo "==> [8/9] Systemd сервис"
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

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $APP_NAME
systemctl restart $APP_NAME

echo "==> [9/9] Nginx и SSL"
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Попытка выпустить SSL, если домен направлен на IP
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@$DOMAIN || echo "SSL не установлен автоматически."

echo "✓ Готово! Проверьте статус: systemctl status $APP_NAME"
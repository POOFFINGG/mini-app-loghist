#!/bin/bash
set -e

# ─────────────────────────────────────────────
# LogHist — Исправленный деплой (Ubuntu 24.04)
# ─────────────────────────────────────────────

REPO="https://github.com/POOFFINGG/mini-app-loghist.git"
APP_DIR="/home/app/loghist"
APP_NAME="loghist"
DOMAIN="iilogist.code-master-py.twc1.net"
BACKEND_PORT=8002

echo "==> [1/9] Исправление кэша APT"
# Удаляем старые списки, которые вызывают ошибку размера
rm -rf /var/lib/apt/lists/*
apt-get clean
apt-get update || true # Игнорируем ошибки Nodesource

echo "==> [2/9] Установка базовых зависимостей"
# Устанавливаем всё, кроме nodejs/npm, чтобы убедиться в работоспособности базы
apt-get install -y curl git nginx python3 python3-pip python3-venv certbot python3-certbot-nginx

echo "==> [3/9] Установка Node.js"
# Если Nodesource висит, ставим стабильную версию из репозитория Ubuntu
if ! command -v node &>/dev/null; then
    echo "Попытка установки Node.js из Nodesource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || echo "Nodesource временно недоступен, используем стандартный репозиторий"
    apt-get install -y nodejs npm
fi

echo "==> [4/9] Установка MongoDB"
if ! command -v mongod &>/dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
        | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update || true
    apt-get install -y mongodb-org
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

# Создаем .env если его нет
if [ ! -f "$APP_DIR/backend/.env" ]; then
cat > "$APP_DIR/backend/.env" <<EOF
MONGO_URI=mongodb://localhost:27017
MONGO_DB=loghist
JWT_SECRET=$(openssl rand -hex 32)
PORT=$BACKEND_PORT
EOF
fi

echo "==> [7/9] Frontend: Сборка"
npm install --prefix "$APP_DIR"
npm run build --prefix "$APP_DIR"

echo "==> [8/9] Настройка Systemd"
cat > /etc/systemd/system/$APP_NAME.service <<EOF
[Unit]
Description=LogHist FastAPI
After=network.target mongod.service

[Service]
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/.venv/bin"
ExecStart=$APP_DIR/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port $BACKEND_PORT
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable $APP_NAME
systemctl restart $APP_NAME

echo "==> [9/9] Nginx"
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
        proxy_pass http://127.0.0.1:$BACKEND_PORT/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ Деплой завершен!"
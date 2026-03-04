#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  CONFIG — поменяй под себя
# ─────────────────────────────────────────────
REPO="https://github.com/POOFFINGG/mini-app-loghist.git"
APP_DIR="/home/app"
APP_NAME="loghist"
NODE_VERSION="20"

# PostgreSQL
DB_NAME="loghist_db"
DB_USER="loghist_user"
DB_PASS="$(openssl rand -base64 24)"  # генерируется автоматически при первом запуске

# Домен (уже прилинкован)
DOMAIN="iilogist.code-master-py.twc1.net"
# ─────────────────────────────────────────────

echo "==> [1/8] Обновление системы и установка зависимостей"
apt update && apt upgrade -y
apt install -y curl git nginx postgresql postgresql-contrib

echo "==> [2/8] Установка Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
npm install -g pm2

echo "==> [3/8] Настройка PostgreSQL"
# Создаём юзера или обновляем пароль если уже существует
sudo -u postgres psql -c "DO \$\$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';
  ELSE
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END \$\$;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

echo "==> [4/8] Клонирование репозитория с нуля"
rm -rf "$APP_DIR"
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "==> [5/8] Создание .env"
cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$(openssl rand -base64 32)
EOF

echo "==> [6/8] Установка пакетов и сборка"
cd "$APP_DIR"
npm install
npm run build
npm run db:push

echo "==> [7/8] Запуск через PM2"
pm2 delete all 2>/dev/null || true
pm2 start dist/index.cjs --name "$APP_NAME" --env production
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
systemctl enable pm2-root 2>/dev/null || true

echo "==> [8/8] Настройка Nginx (reverse proxy)"
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/$APP_NAME
cat > /etc/nginx/sites-available/$APP_NAME <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "✓ Деплой завершён!"
echo "  Приложение: http://$DOMAIN"
echo "  PM2 статус: pm2 status"
echo "  Логи:       pm2 logs $APP_NAME"

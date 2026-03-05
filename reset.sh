#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  LogHist — полный сброс VPS перед деплоем
# ─────────────────────────────────────────────
APP_DIR="/home/app/loghist"
APP_NAME="loghist"

echo "==> [1/6] Остановка и удаление сервиса"
systemctl stop $APP_NAME 2>/dev/null || true
systemctl disable $APP_NAME 2>/dev/null || true
rm -f /etc/systemd/system/$APP_NAME.service
systemctl daemon-reload

echo "==> [2/6] Удаление приложения"
rm -rf "$APP_DIR"
rm -rf /home/app

echo "==> [3/6] Очистка Nginx"
rm -f /etc/nginx/sites-enabled/$APP_NAME
rm -f /etc/nginx/sites-available/$APP_NAME
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx 2>/dev/null || true

echo "==> [4/6] Удаление nodesource репо"
find /etc/apt/sources.list.d/ \( -name "*node*" -o -name "*nodesource*" \) -delete 2>/dev/null || true
rm -f /etc/apt/keyrings/nodesource.gpg 2>/dev/null || true

echo "==> [5/6] Удаление nodejs (если от nodesource)"
apt-get remove -y nodejs 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

echo "==> [6/6] Очистка APT кэша"
apt-get clean
apt-get update

echo ""
echo "Сброс завершён. Теперь запусти деплой:"
echo "  curl -fsSL https://raw.githubusercontent.com/POOFFINGG/mini-app-loghist/master/deploy.sh | bash"

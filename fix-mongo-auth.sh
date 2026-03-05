#!/bin/bash
set -e

APP_DIR="/home/app/loghist"
APP_NAME="loghist"

echo "==> Исправление MongoDB аутентификации"

# Отключить auth если включена
if grep -q "authorization: enabled" /etc/mongod.conf 2>/dev/null; then
    sed -i 's/authorization: enabled/authorization: disabled/' /etc/mongod.conf
    echo "  auth отключена в mongod.conf"
fi

# Убрать security секцию если включает auth
if grep -q "^\s*authorization:" /etc/mongod.conf 2>/dev/null; then
    sed -i '/^\s*authorization:/d' /etc/mongod.conf
    echo "  строка authorization удалена"
fi

# Исправить MONGO_URI в .env (убрать кредентиалы если есть)
if [ -f "$APP_DIR/backend/.env" ]; then
    sed -i 's|MONGO_URI=.*|MONGO_URI=mongodb://localhost:27017|' "$APP_DIR/backend/.env"
    echo "  MONGO_URI сброшен в .env"
fi

echo "==> Перезапуск MongoDB и backend"
systemctl restart mongod
sleep 2
systemctl restart $APP_NAME
sleep 3
systemctl status $APP_NAME --no-pager | head -20

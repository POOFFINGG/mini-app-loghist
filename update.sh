#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  LogHist — обновление приложения на сервере
#  Запускай после git push в main
# ─────────────────────────────────────────────
APP_DIR="/home/app/loghist"
APP_NAME="loghist"

echo "==> [1/4] Получение последних изменений"
cd "$APP_DIR"
git pull origin main

echo "==> [2/4] Обновление Python-зависимостей"
"$APP_DIR/backend/.venv/bin/pip" install --upgrade pip
"$APP_DIR/backend/.venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

echo "==> [3/4] Пересборка frontend"
npm install --prefix "$APP_DIR"
npm run build --prefix "$APP_DIR"

echo "==> [4/4] Перезапуск backend"
systemctl restart $APP_NAME
systemctl status $APP_NAME --no-pager

echo ""
echo "✓ Обновление завершено!"
echo "  Логи: journalctl -u $APP_NAME -f"

"""
Helper script to generate all required secrets for .env
Run: python scripts/generate_secrets.py
"""
import os
import base64
import secrets

jwt_secret = secrets.token_hex(64)
encryption_key = base64.b64encode(os.urandom(32)).decode()
webhook_secret = secrets.token_hex(32)
admin_key = secrets.token_hex(32)
mongo_root_pw = secrets.token_urlsafe(24)
mongo_app_pw = secrets.token_urlsafe(24)
redis_pw = secrets.token_urlsafe(24)

print("# Copy these into your .env file\n")
print(f"JWT_SECRET_KEY={jwt_secret}")
print(f"ENCRYPTION_KEY={encryption_key}")
print(f"TELEGRAM_WEBHOOK_SECRET={webhook_secret}")
print(f"ADMIN_SECRET_KEY={admin_key}")
print(f"MONGO_ROOT_PASSWORD={mongo_root_pw}")
print(f"MONGO_APP_PASSWORD={mongo_app_pw}")
print(f"REDIS_PASSWORD={redis_pw}")

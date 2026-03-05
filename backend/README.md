# LogHist Backend

Python backend for the LogHist logistics mini-app.

## Stack

| Component | Technology |
|-----------|-----------|
| REST API | FastAPI + Uvicorn |
| Telegram Bot | aiogram 3.x |
| Database | MongoDB 7 (Docker) |
| Cache | Redis (Docker) |
| AI / OCR | OpenAI GPT-4o + Tesseract |
| Encryption | AES-256-GCM (FZ-152) |
| Scheduler | APScheduler |

## Quick Start

### 1. Generate secrets

```bash
python scripts/generate_secrets.py
```

Copy the output into a `.env` file (use `.env.example` as template).

### 2. Start MongoDB + Redis

```bash
docker-compose up -d
```

Open Mongo Express UI (dev only):
```bash
docker-compose --profile tools up -d
# → http://localhost:8081
```

### 3. Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Install Tesseract OCR (system package):
- **Ubuntu/Debian**: `apt-get install tesseract-ocr tesseract-ocr-rus`
- **macOS**: `brew install tesseract tesseract-lang`

### 4. Run the API

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API docs (debug mode only): http://localhost:8000/docs

---

## API Endpoints

### Auth  `/api/v1/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user (with FZ-152 consent) |
| POST | `/login` | Login (email or phone) |
| POST | `/refresh` | Refresh JWT tokens |
| POST | `/logout` | Logout |
| POST | `/change-password` | Change password |

### Profile  `/api/v1/profile`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me` | Get current user profile |
| PATCH | `/me` | Update profile data |

### Requests  `/api/v1/requests`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List requests (filter by status, archived) |
| POST | `/` | Create request |
| GET | `/{id}` | Get request details |
| PATCH | `/{id}` | Update request |
| DELETE | `/{id}` | Delete request |
| POST | `/ai/parse-text` | Parse free text into request fields |
| POST | `/ai/parse-image` | Extract data from document image |
| POST | `/ai/chat` | AI logistics assistant chat |

### Database  `/api/v1/db`
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/counterparties` | List/create counterparties |
| PATCH/DELETE | `/counterparties/{id}` | Update/delete counterparty |
| GET/POST | `/drivers` | List/create drivers (passport encrypted) |
| PATCH/DELETE | `/drivers/{id}` | Update/delete driver |
| GET/POST | `/vehicles` | List/create vehicles |
| PATCH/DELETE | `/vehicles/{id}` | Update/delete vehicle |
| GET | `/documents` | List documents |
| POST | `/documents/upload` | Upload encrypted document (+ OCR) |
| GET | `/documents/{id}/download` | Download & decrypt document |
| DELETE | `/documents/{id}` | Delete document |

### Tracking  `/api/v1/tracking`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/{request_id}` | Get tracking data |
| POST | `/{request_id}/location` | Update GPS position |

### Notifications  `/api/v1/notifications`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| GET | `/unread-count` | Count unread |
| POST | `/{id}/read` | Mark as read |
| POST | `/read-all` | Mark all as read |

### Analytics (Admin)  `/api/v1/analytics`
Requires `X-Admin-Key` header.
| Method | Path | Description |
|--------|------|-------------|
| GET | `/overview` | Platform statistics |
| GET | `/ai-usage?period=month` | AI API usage + cost |
| GET | `/audit-logs` | FZ-152 audit log viewer |
| GET | `/top-routes` | Most popular routes |

### Bot Webhook  `/webhook/telegram`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/telegram` | Telegram webhook receiver |

---

## FZ-152 Compliance

| Requirement | Implementation |
|-------------|---------------|
| Russian servers | MongoDB in Docker on your Russian VPS |
| Encryption of sensitive documents | AES-256-GCM (`core/security.py`) |
| Passport data encryption | `encrypt_field()` on driver create/update |
| Audit logging | All PD actions logged to `audit_logs` collection |
| Webhook to Russian server | HTTPS + HMAC-SHA256 signature (`services/webhook_service.py`) |
| PD consent | Required field in registration, stored with timestamp |
| Log retention | `AUDIT_LOG_RETENTION_DAYS=365` (1 year) |
| Request archive | TTL 30 days + 3-day notification before deletion |

---

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Show mini-app button |
| `/requests` | List last 5 requests |
| `/status NUMBER` | Check request status |
| Send photo | OCR + AI parse of document image |

---

## Environment Variables

See `.env.example` for all variables with descriptions.

Generate all secrets at once:
```bash
python scripts/generate_secrets.py
```

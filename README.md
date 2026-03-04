# AI-Powered Voice Survey for School Employees

A Malayalam-speaking AI voice survey system that conducts structured assessments for school employees (Teachers, Admins, Support Staff) via phone/web, scores responses automatically, and delivers reports to administrators via Chatwoot.

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │───▶│ Voice Gateway│───▶│  PostgreSQL   │
│  (React/Vite)│    │  (Node.js)   │    │  (school_survey)│
└──────┬───────┘    └──────────────┘    └──────────────┘
       │
       ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Vapi AI    │───▶│   n8n Cloud  │───▶│   Chatwoot   │
│ (Voice Agent)│    │ (Workflows)  │    │  (Reports)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## ✨ Features

- **Malayalam Voice AI**: Natural Malayalam conversation using Vapi + Azure STT/TTS
- **3 Role-Based Surveys**: Teacher (12 questions), Admin (12 questions), Support (12 questions)
- **Automatic Scoring**: Mindset, Toolset, Skillset categories with deterministic rubric
- **Smart Confirmation**: AI confirms unclear answers before saving
- **Chatwoot Reports**: Automated survey reports with scores, themes & recommendations
- **Secure OTP**: Hash-based OTP verification with attempt limiting
- **Session Management**: State machine (ISSUED → VERIFIED → IN_PROGRESS → COMPLETED)

## 📁 Project Structure

```
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # Employee ID entry
│   │   │   ├── SessionPage.jsx   # Voice survey (Vapi SDK)
│   │   │   └── CompletePage.jsx  # Thank you page
│   │   ├── components/
│   │   │   ├── OtpInput.jsx      # OTP verification
│   │   │   └── MicStatus.jsx     # Microphone indicator
│   │   ├── api.js                # API client
│   │   └── index.css             # Styles
│   └── .env.example              # Frontend env template
├── voice-gateway/             # Node.js Express API
│   ├── routes/
│   │   ├── otp.js                # OTP send/verify
│   │   ├── session.js            # Session management
│   │   └── voice.js              # Voice processing
│   ├── middleware/auth.js        # JWT authentication
│   ├── utils/
│   │   ├── otp.js                # OTP generation/hashing
│   │   └── storage.js            # File storage utils
│   ├── db.js                     # Postgres connection pool
│   └── server.js                 # Express app entry
├── nginx/                     # Reverse proxy config
│   └── default.conf
├── scripts/                   # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_otp_support.sql
│   ├── 003_add_role_column.sql
│   ├── 004_fix_audio_assets.sql
│   ├── 005_retention_policy.sql
│   └── init-databases.sh
├── docker-compose.yml         # Docker orchestration
├── .env.example               # Environment template
└── developer_implementation_checklist.txt
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Vapi AI account with API keys
- n8n Cloud instance
- Chatwoot Cloud instance
- Google Sheets (question bank)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/madhancarelabz/schoolsurvey.git
   cd schoolsurvey
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   # Edit both files with your credentials
   ```

3. **Start services**
   ```bash
   docker compose --profile full up -d --build
   ```

4. **Build frontend**
   ```bash
   cd frontend && npm install && npm run build
   docker restart survey-nginx
   ```

5. **Access the app**
   - Survey: https://survey.carelabs.me
   - Chatwoot: https://app.chatwoot.com

## 🔑 Environment Variables

### Root `.env`
| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name (default: school_survey) |
| `REDIS_PASSWORD` | Redis password |
| `JWT_SECRET` | JWT signing secret |
| `VAPI_PUBLIC_KEY` | Vapi public API key |
| `VAPI_PRIVATE_KEY` | Vapi private API key |

### Frontend `.env.local`
| Variable | Description |
|----------|-------------|
| `VITE_VAPI_PUBLIC_KEY` | Vapi public key |
| `VITE_VAPI_ASSISTANT_ID` | Vapi assistant ID |
| `VITE_API_BASE_URL` | Voice gateway API URL |

## 📊 Survey Flow

1. Employee opens URL → enters Employee ID
2. System sends OTP → employee enters OTP
3. Vapi AI greets in Malayalam → employee says "തുടങ്ങാം" (start)
4. AI reads 12 questions with 4 options each
5. Employee responds with option number (ഒന്ന്/രണ്ട്/മൂന്ന്/നാല്)
6. AI confirms unclear answers → saves response
7. After 12 questions → scores computed → Chatwoot report generated
8. Session marked COMPLETED → token burned

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `sessions` | Survey sessions (state machine) |
| `responses` | Individual question responses |
| `results` | Computed scores (mindset/toolset/skillset) |
| `audio_assets` | Call recording URLs |
| `audit_logs` | Admin access logs |
| `employees` | Employee directory with roles |

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React + Vite |
| Voice AI | Vapi (Claude Sonnet 4) |
| STT | Azure (ml-IN Malayalam) |
| TTS | Azure Sobhana |
| Backend | Node.js + Express |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Workflows | n8n Cloud |
| Reports | Chatwoot Cloud |
| Proxy | Nginx + SSL |
| Hosting | Contabo VPS (Docker) |

## 📋 Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Infrastructure Setup | ✅ Complete |
| 2 | Database & Schema | ✅ Complete |
| 3 | OTP & Security | ✅ Complete |
| 4 | Voice Gateway API | ✅ Complete |
| 5 | n8n Workflows | ✅ Complete |
| 6 | Vapi Configuration | ✅ Complete |
| 7 | Smart Confirmation | ✅ Complete |
| 8 | Chatwoot Dashboard | ✅ Complete |
| 9 | Audio Retention & Compliance | ⏳ Pending |
| 10 | Final Acceptance Testing | 🔄 In Progress |

## 📄 Documentation

- [`COMMANDS_REFERENCE.md`](COMMANDS_REFERENCE.md) — VPS commands for deployment & debugging
- [`PROJECT_HANDOVER_GUIDE.md`](PROJECT_HANDOVER_GUIDE.md) — Full project handover documentation
- [`developer_implementation_checklist.txt`](developer_implementation_checklist.txt) — Phase-by-phase implementation checklist

## 👥 Team

- **Care Labs** — Product Owner
- Built with Vapi AI, n8n, Chatwoot, and Azure Cognitive Services

## 📜 License

Proprietary — Care Labs © 2026

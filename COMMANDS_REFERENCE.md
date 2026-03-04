# AI Voice Survey — Command Reference
# Last Updated: Feb 24, 2026
# ⚠️ IMPORTANT: On VPS, use `nano` to create/edit files. Do NOT use `cat` with heredoc.

---

## 🖥️ VPS COMMANDS (SSH into 62.72.41.137)

### Project Location
```
cd /opt/voice-survey
```

### Docker — Start/Stop/Check

```bash
# Start all containers (first time or after changes)
docker compose --profile full up -d --build

# Stop all containers
docker compose down

# Restart a single container (e.g., nginx after frontend rebuild)
docker restart survey-nginx

# Check status of all containers
docker compose --profile full ps

# View voice-gateway logs (useful for seeing OTP codes)
docker logs survey-voice-gateway --tail 20

# View nginx logs
docker logs survey-nginx --tail 20

# View postgres logs
docker logs survey-postgres --tail 20
```

### Frontend — Build/Rebuild

```bash
# Rebuild frontend after code changes or env var changes
cd /opt/voice-survey/frontend
npm install
npm run build

# Then restart nginx to serve new build
docker restart survey-nginx
```

### Git — Pull Latest Code from GitHub

```bash
cd /opt/voice-survey
git pull origin main
```

### SSL Certificate — Generate (One-time, already done)

```bash
mkdir -p /opt/voice-survey/nginx/ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /opt/voice-survey/nginx/ssl/privkey.pem \
  -out /opt/voice-survey/nginx/ssl/fullchain.pem \
  -subj "/CN=survey.carelabs.me"
```

### Health Check — Verify System is Running

```bash
# Check API health (voice-gateway + database)
curl -k https://localhost/api/health

# Check nginx health
curl -k https://localhost/health
```

### OTP Testing — See the Mock OTP

```bash
# After clicking "Send OTP" on the website, check logs:
docker logs survey-voice-gateway --tail 5
# Look for: [MOCK GATEWAY] OTP for EMP001: 123456
```

### Phase 9 — Cron Job Setup

```bash
# Add the daily retention cleanup job
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec survey-postgres psql -U survey_admin -d school_survey -c \"DELETE FROM audio_assets WHERE created_at < NOW() - INTERVAL '90 days'; DELETE FROM responses WHERE answered_at < NOW() - INTERVAL '12 months'; DELETE FROM results WHERE computed_at < NOW() - INTERVAL '12 months';\"") | crontab -

# Verify the cron job is saved
crontab -l

# Remove cron job if needed
crontab -r
```

### Database — Direct Access

```bash
# Open PostgreSQL shell
docker exec -it survey-postgres psql -U survey_admin -d school_survey

# Run a quick query from outside
docker exec survey-postgres psql -U survey_admin -d school_survey -c "SELECT COUNT(*) FROM sessions;"
```

### File Editing — Use nano (NOT cat)

```bash
# Edit .env file
nano /opt/voice-survey/.env

# Edit frontend env file
nano /opt/voice-survey/frontend/.env.local

# Edit nginx config
nano /opt/voice-survey/nginx/default.conf
```

---

## 💻 LOCAL MACHINE COMMANDS (Windows PowerShell)

### Project Location
```
cd "c:\Users\MadhanKumarS\OneDrive - Care Labs\AI Powered Voice Survey For School Employees"
```

### Git — Must use full path on this machine

```powershell
# Git is at: C:\Program Files\Git\bin\git.exe

# Add files
& "C:\Program Files\Git\bin\git.exe" add .

# Commit
& "C:\Program Files\Git\bin\git.exe" commit -m "your commit message"

# Push to GitHub
& "C:\Program Files\Git\bin\git.exe" push origin main

# Pull from GitHub
& "C:\Program Files\Git\bin\git.exe" pull origin main

# Check status
& "C:\Program Files\Git\bin\git.exe" status
```

### Frontend — Local Development

```powershell
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Frontend — Production Build (Local)

```powershell
cd frontend
npm run build
```

---

## 📝 IMPORTANT NOTES

1. **VPS nano works, cat heredoc does NOT** — Always use `nano` to create/edit files on VPS
2. **Git on local** — Must use full path: `& "C:\Program Files\Git\bin\git.exe"`
3. **OTP is mock mode** — OTP is logged to docker logs, not sent via SMS
4. **PostgreSQL only accessible from VPS** — Bound to 127.0.0.1, not exposed externally
5. **Frontend env vars** — Must be in `frontend/.env.local`, not root `.env` (Vite only reads from its own folder)
6. **After any frontend code change** — Must run `npm run build` AND `docker restart survey-nginx` on VPS

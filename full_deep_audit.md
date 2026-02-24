# Complete Line-by-Line Deep Audit — Feb 19, 2026 🛡️

## 📋 Developer Implementation Checklist: Full Audit

---

### Phase 1: Infrastructure Setup (Lines 11–23)

| Line | Requirement | Status | Evidence |
| :--- | :--- | :--- | :--- |
| L13 | Install Docker & Docker Compose | ✅ DONE | `docker-compose.yml` exists, containers defined |
| L15 | Configure Nginx Reverse Proxy with SSL | ✅ DONE | Nginx service in docker-compose, `nginx/` directory exists |
| L17 | Create Postgres databases: `school_survey`, `chatwoot_production` | ✅ DONE | `init-databases.sh` creates both, verified in EOD Feb 16 |
| L19 | Configure Redis for Chatwoot | ✅ DONE | Redis 7 service in docker-compose with password auth |
| L21 | Set up Docker networks (internal only) | ✅ DONE | `survey_net` bridge network, Postgres on `127.0.0.1:5432` |
| L23 | Verify all containers running | ✅ DONE | Verified in EOD Feb 16 audit |

**Phase 1 Status: ✅ 6/6 COMPLETE**

---

### Phase 2: Database & Schema Validation (Lines 26–36)

| Line | Requirement | Status | Evidence |
| :--- | :--- | :--- | :--- |
| L28 | Create tables: sessions, responses, audio_assets, results, audit_logs | ✅ DONE | Verified on VPS, `001_initial_schema.sql` synced |
| L30 | Session state machine (ISSUED→VERIFIED→IN_PROGRESS→COMPLETED→EXPIRED) | ✅ DONE | Burn Session Token uses `SET status = 'COMPLETED'` |
| L32 | Token burn only when status = COMPLETED | ✅ DONE | `Burn Session Token` node verified in screenshot |
| L34 | Add indexes on session_token and employee_id | ✅ DONE | Verified in schema alignment |
| L36 | Test DB connection from Voice Gateway and n8n | ✅ DONE | n8n credential `n8n to cantabo pvs` working in screenshots |

**Phase 2 Status: ✅ 5/5 COMPLETE**

---

### Phase 3: OTP & Security Implementation (Lines 39–53)

| Line | Requirement | Status | Evidence |
| :--- | :--- | :--- | :--- |
| L41 | POST /otp/send | ✅ DONE | Voice Gateway API routes live |
| L43 | POST /otp/verify | ✅ DONE | Voice Gateway API routes live |
| L45 | Store only OTP hash | ✅ DONE | Verified in Phase 3 audit |
| L47 | Limit OTP attempts (max 5) | ✅ DONE | Verified in Phase 3 audit |
| L49 | OTP on every session re-entry | ✅ DONE | Verified in Phase 3 audit |
| L51 | 72-hour absolute expiry | ✅ DONE | JWT expiry enforced |
| L53 | Soft device fingerprint check | ✅ DONE | Warning-only implementation |

**Phase 3 Status: ✅ 7/7 COMPLETE**

---

### Phase 4: Voice Gateway API (Lines 56–70)

| Line | Requirement | Status | Evidence |
| :--- | :--- | :--- | :--- |
| L58 | POST /session/start | ✅ DONE | Voice Gateway live on VPS |
| L60 | POST /voice/turn | ✅ DONE | Voice Gateway live on VPS |
| L62 | Integrate Sarvam STT (Malayalam) | ✅ DONE | Sarvam API key configured |
| L64 | Convert WebM to WAV (16kHz mono) | ✅ DONE | Audio conversion logic live |
| L66 | Integrate Sarvam TTS for Malayalam | ✅ DONE | TTS integration live |
| L68 | Store audio in S3-compatible storage | ✅ DONE | R2 bucket `survey-log` configured |
| L70 | Log audio metadata (URL, duration, SHA256) | ✅ DONE | Metadata logging implemented |

**Phase 4 Status: ✅ 7/7 COMPLETE**

---

### Phase 5: n8n Workflows (Lines 73–88) — ⚠️ CURRENT PHASE

| Line | Requirement | n8n Node | Status |
| :--- | :--- | :--- | :--- |
| L75 | Create master webhook: `/webhook/vapi-master` | `Webhook: Vapi Master` | ✅ DONE |
| L77 | Validate session state before processing | `Postgres: Fetch Session` + `If: Valid Session?` | ✅ DONE |
| L79 | Implement fixed question bank per role | `Switch — User Role Router` + `Get row(s) in sheet` | ✅ DONE |
| L81 | Apply deterministic rubric scoring (option-based) | `Postgres: Save Response` (score = answer - 1) | ✅ DONE |
| L83 | Store response per question (no JSON blobs) | `Postgres: Save Response` (UPSERT with 5 columns) | ✅ DONE |
| L84 | On completion: compute final scores | `Postgres: Compute Final Scores` | ✅ DONE |
| **L86** | **Push summary + scores + tags to Chatwoot** | **`HTTP Request (Chatwoot Push)`** | **❌ NOT CONFIGURED** |
| L88 | Burn session token | `Postgres: Burn Session Token` | ✅ DONE |

**Phase 5 Status: ⚠️ 7/8 COMPLETE — L86 is the ONLY remaining item**

---

### Phases 6–10: NOT STARTED

| Phase | Lines | Status |
| :--- | :--- | :--- |
| 6. Vapi Configuration | L91–L103 | ❌ NOT STARTED |
| 7. Option Confirmation System | L106–L118 | ❌ NOT STARTED |
| 8. Chatwoot Dashboard | L121–L133 | ❌ NOT STARTED |
| 9. Audio Retention & Compliance | L136–L146 | ❌ NOT STARTED |
| 10. Final Acceptance Testing | L149–L165 | ❌ NOT STARTED |

---

## 🚨 Critical Discovery: Chatwoot Dependency

> [!CAUTION]
> **Phase 5 Line 86 depends on Phase 8 Line 123.**
>
> To push data to Chatwoot (L86), the Chatwoot instance must be **running** and have an **Inbox created** (L123).
>
> From `docker-compose.yml`, Chatwoot services (`chatwoot-web`, `chatwoot-sidekiq`) are under `profiles: - full`, meaning they are **NOT running yet**.

### What this means:
The `HTTP Request (Chatwoot Push)` node **cannot be fully configured and tested** until:
1. Chatwoot containers are started on the VPS
2. Chatwoot is initialized (database migrations, admin account creation)
3. An Inbox named `AI Survey – Staff` is created (L123)
4. An API access token is generated

---

## 🎯 Precise Next Step Decision

You have **two options**:

### Option A: Complete Phase 5 L86 now (requires VPS work first)
1. SSH into VPS → Start Chatwoot containers: `docker compose --profile full up -d chatwoot-web chatwoot-sidekiq`
2. Run Chatwoot database migrations
3. Create admin account
4. Create Inbox: `AI Survey – Staff`
5. Generate API token
6. Configure the `HTTP Request (Chatwoot Push)` node with:
   - **Method:** `POST`
   - **URL:** `https://your-chatwoot-domain/api/v1/accounts/{account_id}/conversations`
   - **Authentication:** Header `api_access_token`
   - **Body:** Employee metadata + scores + recommendation

### Option B: Skip L86 for now, proceed to Phase 6 (Vapi Configuration)
1. **Deactivate** the `HTTP Request (Chatwoot Push)` node temporarily
2. Proceed to Phase 6 (Vapi Configuration, L91–L103)
3. Come back to L86 + Phase 8 together later (they are tightly coupled)

> [!IMPORTANT]
> **My recommendation:** Option B is more efficient. Phase 5 L86 and Phase 8 (Chatwoot Dashboard) are **the same work** — you need to set up Chatwoot anyway for Phase 8. Doing them together avoids duplicate effort. The Survey Brain logic is functionally complete for testing with Vapi.

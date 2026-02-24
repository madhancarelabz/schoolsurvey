# Deep Analysis: Employee Access Flow & Frontend 🛡️

---

## Question 1: If We Choose Option B, Where Will the Flow Break?

### Answer: **The flow will NOT break.** ✅

In n8n, when you **deactivate** a node, the node is **skipped** and the input data **passes through** to the next connected node. So the flow would be:

```
Postgres: Compute Final Scores → [HTTP Request — SKIPPED] → Postgres: Burn Session Token → Respond to Webhook
```

The scores get computed, the Chatwoot push is skipped (no data sent to Chatwoot), but the session token **still gets burned** and the completion response **still gets sent** back to Vapi.

> [!IMPORTANT]
> **No break.** The only thing you lose is the Chatwoot reporting. The core survey completion flow remains intact.

---

## Question 2: How Does a School Employee Access the System?

Based on `comprehensive_system_flow.txt` and `system_workflow_diagram.md`:

### Complete Employee Journey (Mapped to Checklist Lines)

```
Step 1: Employee opens the PWA link on their phone/browser
         ↓
Step 2: Employee enters Employee ID (e.g., "E101")
         ↓  
Step 3: PWA calls VPS → POST /api/otp/send          [Checklist L41]
         ↓
Step 4: Employee receives OTP (phone/email)
         ↓
Step 5: Employee enters OTP → PWA calls POST /api/otp/verify   [Checklist L43]
         ↓
Step 6: VPS returns JWT → Session status = IN_PROGRESS         [Checklist L51, L58]
         ↓
Step 7: Employee clicks "Start Survey"
         ↓
Step 8: PWA uses Vapi Web SDK to open audio stream to Vapi     [Checklist L103]
         ↓
Step 9: Vapi calls n8n webhook → n8n fetches questions         [Checklist L75, L79]
         ↓
Step 10: Vapi speaks Malayalam question (Sarvam TTS)            [Checklist L101]
         ↓
Step 11: Employee answers → Score saved                         [Checklist L81, L83]
         ↓
Step 12: After 12 questions → Scores computed, session burned   [Checklist L84, L88]
         ↓
Step 13: Results pushed to Chatwoot for HR                      [Checklist L86, L125]
```

### The Entry Point is the **React PWA**

The PWA does three things:
1. **Authentication UI** — Employee ID input + OTP verification
2. **Vapi Bridge** — Uses Vapi Web SDK to inject `session_id` and start the voice call
3. **Survey Status** — Shows the employee survey progress

---

## Question 3: Where Is the Frontend Mentioned in the Checklist?

### Answer: The Frontend is **NOT listed as an explicit phase**.

I searched every single line (1–167) of `developer_implementation_checklist.txt` for: `frontend`, `PWA`, `React`, `web`, `app`, `browser`, `phone`, `link`.

### Results:

| Search Term | Found in Checklist? | Line |
| :--- | :--- | :--- |
| `frontend` | ❌ NO | — |
| `PWA` | ❌ NO | — |
| `React` | ❌ NO | — |
| `web` | ❌ NO | — |
| `app` | ❌ NO | — |
| `browser` | ❌ NO (not as a separate word) | — |
| `phone` | ❌ NO | — |

### The CLOSEST Reference:

**Line 103:** `Test real-time streaming in browser`

This is inside **Phase 6 (Vapi Configuration)**. This line implies that by the end of Phase 6, you should be able to test the voice survey **in a browser** — which requires the PWA/Frontend to exist.

### Additional Evidence:

| Source | What It Says |
| :--- | :--- |
| `frontend/build/index.html` (line 18) | `"Frontend will be built in Phase 6."` |
| `docker-compose.yml` (line 132) | `./frontend/build:/usr/share/nginx/html:ro` (Nginx serves the frontend) |
| `comprehensive_system_flow.txt` (line 8) | `"Data starts at the Frontend React PWA."` |
| `system_workflow_diagram.md` | Shows `React PWA (Frontend)` as the first actor |

---

## 🎯 Conclusion: When to Build the Frontend

The Frontend (React PWA) is **implicitly part of Phase 6 (Vapi Configuration)**.

Here is why — Phase 6 checklist items:

| Line | Requirement | Needs Frontend? |
| :--- | :--- | :--- |
| L93 | Create Voice Assistant | ❌ No (Vapi dashboard) |
| L95 | Configure Tools: next_question, complete_session | ❌ No (Vapi dashboard) |
| L97 | Set webhook URL to n8n master webhook | ❌ No (Vapi dashboard) |
| L99 | Disable autonomous AI scoring | ❌ No (Vapi dashboard) |
| L101 | Use Sarvam Malayalam voice (Bulbul:v1) | ❌ No (Vapi dashboard) |
| **L103** | **Test real-time streaming in browser** | **✅ YES — needs the PWA** |

> [!IMPORTANT]
> **The Frontend must be built DURING Phase 6, specifically before L103.**
> 
> The logical order within Phase 6 is:
> 1. L93–L101: Configure Vapi dashboard (no frontend needed)
> 2. Build the React PWA with Vapi Web SDK
> 3. L103: Test real-time streaming in browser (using the PWA)

### The PWA needs to:
1. Have an **Employee ID input** + **OTP form** (calls Phase 3 endpoints)
2. Have a **"Start Survey" button** that uses the **Vapi Web SDK**
3. Inject the `session_id` into the Vapi call
4. Be served by Nginx from `./frontend/build/` (already configured in docker-compose)

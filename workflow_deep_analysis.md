# Deep Workflow Analysis: Every Node, Every Connection 🔍

## Complete Node Map (17 Nodes from JSON)

| # | Node Name | Type | Purpose | Accurate? |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `Webhook: Vapi Master` | webhook | Receives all Vapi calls at `/vapi-master` | ✅ |
| 2 | `Switch: Event Type` | switch | Routes `tool-calls` vs `status-update` | ✅ |
| 3 | `Switch: Tool Call Name` | switch | Routes `next_question` vs `complete_session` | ✅ |
| 4 | `Postgres: Fetch Session` | postgres | `WHERE id = $1` — validates session UUID | ✅ |
| 5 | `If: Valid Session?` | if | Checks `is_fresh` AND `is_authorized` | ✅ |
| 6 | `Respond: Session Invalid` | respond | Returns error if session invalid | ✅ |
| 7 | `Switch — User Role Router` | switch | Routes TEACHER / ADMIN / SUPPORT | ✅ |
| 8 | `Get row(s) in sheet` | googleSheets | Fetches question bank by role | ✅ |
| 9 | `If: Initial Call?` | if | Checks if `question_id === "INIT"` | ✅ |
| 10 | `Postgres: Save Response` | postgres | INSERTs answer with score | ✅ |
| 11 | `Postgres: Count Responses` | postgres | COUNTs answers for this session | ✅ |
| 12 | `Code: Pick Next Question` | code | Selects next question or sets `finished: true` | ✅ |
| 13 | `If: Survey Finished?` | if | Checks `finished` flag | ✅ |
| 14 | `Respond: Tool Call Result` | respond | Returns next question to Vapi | ✅ |
| 15 | `Postgres: Compute Final Scores` | postgres | Calculates Mindset/Toolset/Skillset | ✅ |
| 16 | `HTTP Request (Chatwoot Push)` | httpRequest | **Disabled** — deferred to Phase 8 | ⏸️ |
| 17 | `Postgres: Burn Session Token` | postgres | Sets `status = 'COMPLETED'` | ✅ |
| 18 | `Respond: Survey Complete` | respond | Returns `finished: true` to Vapi | ✅ |

**Verdict: All 18 nodes are correctly configured.** ✅

---

## Complete Connection Trace

```
Webhook: Vapi Master
  └→ Switch: Event Type
      ├→ [Tool Calls] → Switch: Tool Call Name
      │    ├→ [next_question] → Postgres: Fetch Session
      │    │    └→ If: Valid Session?
      │    │        ├→ [TRUE] → Switch — User Role Router
      │    │        │    ├→ [TEACHER] ─┐
      │    │        │    ├→ [ADMIN] ───┤→ Get row(s) in sheet
      │    │        │    └→ [SUPPORT] ─┘    └→ If: Initial Call?
      │    │        │                            ├→ [TRUE/INIT] → Postgres: Count Responses ─┐
      │    │        │                            └→ [FALSE/Normal] → Postgres: Save Response ─┘
      │    │        │                                                    └→ Postgres: Count Responses
      │    │        │                                                         └→ Code: Pick Next Question
      │    │        │                                                              └→ If: Survey Finished?
      │    │        │                                                                   ├→ [TRUE] → Compute Final Scores
      │    │        │                                                                   │    → Chatwoot Push (disabled)
      │    │        │                                                                   │    → Burn Session Token
      │    │        │                                                                   │    → Respond: Survey Complete
      │    │        │                                                                   └→ [FALSE] → Respond: Tool Call Result
      │    │        └→ [FALSE] → Respond: Session Invalid
      │    └→ [complete_session] → (not connected)
      └→ [Status Updates] → (not connected)
```

**Verdict: All connections are correct.** ✅

---

## Why Does The `If: Initial Call?` Node Exist?

This node is **critical and correct**. Here's why:

When the AI makes the **first call** to `next_question`, it sends:
```json
{ "session_id": "uuid", "question_id": "INIT", "answer": 0 }
```

Without `If: Initial Call?`, the flow would try to **save** this INIT call as a real answer. That would fail because:
- `question_id = "INIT"` doesn't exist in the Google Sheet.
- `answer = 0` is not a real option (options are 1-4).
- Category lookup would return `undefined`.

So `If: Initial Call?` does this:

| question_id | Path | What Happens |
| :--- | :--- | :--- |
| `"INIT"` | **TRUE** → Skip Save → Count Responses (= 0) → Pick Question [0] | Returns **first question** |
| `"T1"`, `"T2"`, etc. | **FALSE** → Save Response → Count Responses → Pick Next Question | Normal survey flow |

**This node is 100% necessary and correctly placed.** ✅

---

## The Error: What Exactly Went Wrong

```
Error: invalid input syntax for type uuid: "INIT"
At: Postgres: Fetch Session (Node #4)
```

The crash happens at **Node #4**, which is BEFORE `If: Initial Call?` (Node #9).

```
Node 1 → 2 → 3 → 4 ❌ CRASH
                     ↓ (never reached)
                     5 → 7 → 8 → 9 (If: Initial Call?)
```

**The AI sent:**

```json
{
  "session_id": "INIT",     ← ❌ Should be a UUID
  "question_id": "INIT",    ← ✅ Correct
  "answer": 0               ← ✅ Correct
}
```

The AI used `"INIT"` for **both** `session_id` AND `question_id` because:
1. Our system prompt only says `question_id="INIT"` and `answer=0` for the first call
2. It says **nothing** about what `session_id` should be
3. The AI had no real UUID, so it guessed `"INIT"`
4. Postgres column `sessions.id` is type UUID → rejects `"INIT"`

---

## The Fix Plan: Testing vs Production

### For Testing Now (Temporary — Phase 6/L103)

| Step | What | Where | Reversible? |
| :--- | :--- | :--- | :--- |
| 1 | Create a test session in the database | VPS (SSH) | ✅ Yes, DELETE later |
| 2 | Hardcode the UUID in the Vapi System Prompt | Vapi Dashboard → Model tab | ✅ Yes, remove later |
| 3 | Test "Talk to Assistant" | Vapi Dashboard | N/A |

**SQL for Step 1:**
```sql
docker exec -it survey-postgres psql -U survey_admin -d school_survey -c "
INSERT INTO sessions (employee_id, session_token, status, role, expires_at)
VALUES ('TEST_EMP_001', 'test-token-vapi', 'VERIFIED', 'TEACHER', NOW() + INTERVAL '72 hours')
RETURNING id;
"
```

**Prompt change for Step 2 (add the UUID to line 2 of SURVEY FLOW):**
```
2. When the employee confirms they are ready, call the next_question tool 
   with session_id="<UUID FROM STEP 1>", question_id="INIT", and answer=0.
3. For ALL subsequent calls to next_question, ALWAYS use session_id="<SAME UUID>".
```

### For Production (Phase 8 — PWA Frontend)

| Step | What | Where |
| :--- | :--- | :--- |
| 1 | PWA calls `/otp/verify` → gets JWT with `session_id` | PWA Frontend |
| 2 | PWA starts Vapi call with `assistantOverrides: { metadata: { session_id: "real-uuid" } }` | PWA + Vapi SDK |
| 3 | Update system prompt: "Use the session_id from the call metadata for every tool call" | Vapi Dashboard |

### What Changes in n8n? **NOTHING.**

The n8n workflow does NOT change at all. The workflow is correct. The only issue is that the AI needs a valid UUID to send, and that comes from outside (PWA in production, hardcoded for testing).

---

## Will This Break Future Phases?

| Phase | Impact | Explanation |
| :--- | :--- | :--- |
| Phase 7 (Confirmation) | ❌ No break | Confirmation logic adds steps AFTER the answer, not before session validation |
| Phase 8 (Chatwoot) | ❌ No break | Chatwoot Push is already wired, just disabled |
| Phase 8 (PWA) | ❌ No break | PWA replaces the hardcoded UUID with a real one automatically |
| Phase 9 (Audio) | ❌ No break | Audio storage is independent of session validation |
| Phase 10 (Testing) | ❌ No break | We'll create proper test sessions then too |

> [!IMPORTANT]
> **Zero changes to n8n.** Zero changes to the database schema. The only change is a temporary test session row + a temporary system prompt update. Both are fully reversible.

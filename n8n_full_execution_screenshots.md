# n8n Full Execution Path — Screenshots Reference
**Date:** February 19, 2026  
**Call ID:** `019c75e1-c15a-7884-b058-09b67bc96fe8`

These screenshots document a **successful full tool-call execution** where all nodes ran end-to-end.

---

## 1. Switch: Event Type — Tool Calls Branch (1 Item)
Shows `tool-calls` matching successfully → routed to Tool Calls output.

![Switch Event Type - Tool Calls matched](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507048164.png)

## 2. Switch: Tool Call Name — Next Question Branch (1 Item)
Shows `next_question` function name matching → routed to Next Question output.

![Switch Tool Call Name - next_question matched](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507064430.png)

## 3. Postgres: Fetch Session — Session Data Retrieved
Shows successful session lookup returning:
- `session_id`: 87244005-cb8b-4d45-aec0-99e7220d9388
- `employee_id`: TEST_EMP_001
- `status`: VERIFIED
- `role`: TEACHER
- `is_fresh`: true
- `is_authorized`: true

![Postgres Fetch Session output](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507079197.png)

## 4. Get row(s) in sheet — 12 Questions Loaded
Shows Google Sheet "AI Voice Survey - Master Question Bank" returning 12 items from the TEACHER sheet. First visible question:
- `question_id`: T1
- `category`: Mindset
- `question_ml`: (Malayalam text for teaching methods question)

![Get rows in sheet - 12 questions loaded](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507121287.png)

## 5. Full Workflow Canvas — All Nodes Green ✅
Shows the complete workflow with ALL nodes successfully executed (green checkmarks):

**Full path:** Webhook → Switch: Event Type → Switch: Tool Call Name → Postgres: Fetch Session → If: Valid Session → Switch: User Role Router → Get row(s) in sheet → If: Initial Call → Postgres: Save Response → Postgres: Count Responses → Code: Pick Next Question → If: Survey Finished → Respond: Tool Call Result

Also shows the completion branch: → Postgres: Compute Final Scores → HTTP Request (Chatwoot Push) → Postgres: Burn Session Token → Respond: Survey Complete

![Full workflow - all nodes green](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507195477.png)

---

## 6. Postgres: Compute Final Scores — Scores Calculated ✅
Shows the final scores computed from all 12 responses:
- `mindset_score`: 4.00
- `toolset_score`: 4.00
- `skillset_score`: 6.00
- `total_score`: **14.00**
- `computed_at`: 2026-02-19T12:36:54.381Z
- `summary`: മെച്ച നിലവാരം... (Good standard — Malayalam)
- `recommendation`: വിദ്യാഭ്യാസ വിഭവ വർദ്ധിപ്പിക്കാനുള്ള... (Malayalam recommendation)

![Postgres Compute Final Scores output](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507320380.png)

## 7. HTTP Request (Chatwoot Push) — Deactivated (Pass-through)
Node is **deactivated** — data passes through without making an HTTP request. This is expected since Chatwoot integration is not yet configured.

![HTTP Request Chatwoot Push - deactivated](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507337535.png)

## 8. Postgres: Burn Session Token — Session COMPLETED ✅
Updates session status to `COMPLETED`:
```sql
UPDATE sessions SET status = 'COMPLETED', updated_at = NOW() WHERE id = $1;
```
Output: `success: true`

![Postgres Burn Session Token](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507353702.png)

## 9. Respond: Survey Complete — Final Response to Vapi ✅
Sends the final JSON response back to Vapi with the tool call result, closing the loop.

![Respond Survey Complete](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507373828.png)

## 10. Final Execution Canvas — Completion Branch (3.374s, ID#26038) ✅
The last tool-call execution at **12:36:51** (3.374s). This is the execution where `finished=true` triggered the **completion branch**: If: Survey Finished → Postgres: Compute Final Scores → HTTP Request (Chatwoot Push) → Postgres: Burn Session Token → Respond: Survey Complete.

![Final execution - completion branch lit up](C:/Users/MadhanKumarS/.gemini/antigravity/brain/fa3e9af3-d218-4f28-8000-c47d57089aae/media__1771507402038.png)

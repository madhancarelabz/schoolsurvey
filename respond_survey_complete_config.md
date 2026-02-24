# Respond: Survey Complete — Node Configuration 🛡️

## 📍 What This Node Does

Your workflow has **two end paths**:

| Path | Condition | Existing Node | Purpose |
| :--- | :--- | :--- | :--- |
| **FALSE** path | Survey NOT finished | `Respond: Tool Call Result` | Returns **next question** to Vapi |
| **TRUE** path | Survey IS finished | `Respond to Webhook` ← **THIS NODE** | Returns **completion message** to Vapi |

Both paths must respond to the same Vapi webhook. The only difference is the **content** of the response.

---

## ⚙️ Exact Configuration

### Step 1: Rename the Node

**Current name:** `Respond to Webhook`
**Change to:** `Respond: Survey Complete`

> This follows your existing naming convention (`Respond: Tool Call Result`, `Respond: Session Invalid`).

---

### Step 2: Set Response Format

- **Respond With:** `JSON`

---

### Step 3: Response Body (Expression Mode)

Click **Expression** (not Fixed), then paste this **exactly**:

```json
{
  "results": [
    {
      "toolCallId": "{{ $node["Webhook: Vapi Master"].json.body.message.toolCalls[0].id }}",
      "result": {{ JSON.stringify($node["Code: Pick Next Question"].json) }}
    }
  ]
}
```

---

## 🔍 Why This Works

This is the **exact same expression pattern** used by your existing `Respond: Tool Call Result` node (Screenshot 2 confirms this).

The key difference is what `$node["Code: Pick Next Question"].json` contains:

| When Survey is NOT Finished | When Survey IS Finished |
| :--- | :--- |
| `finished: false` | `finished: true` |
| `question_id: "T2"` | No question_id |
| `question_text: "കുട്ടികളുടെ..."` | Completion message |
| `options: [...]` | No options |

Your `Code: Pick Next Question` node **already handles both cases** — when `answer_count >= 12`, it sets `finished: true`. Vapi reads this flag and knows to speak the thank-you message and end the call.

---

## ✅ Configuration Checklist

- [ ] Rename node to `Respond: Survey Complete`
- [ ] Set **Respond With** to `JSON`
- [ ] Switch Response Body to **Expression** mode
- [ ] Paste the exact JSON expression above
- [ ] Verify the `Webhook: Vapi Master` node's "Respond" parameter is set to `Using Respond to Webhook Node`

---

## 📍 After This: Your Complete n8n Workflow

Once configured, your **entire Phase 5 n8n workflow** will be:

```
Webhook: Vapi Master
    → Switch: Event Type
        → Switch: Tool Call Name
            → Postgres: Fetch Session
                → If: Valid Session?
                    → (FALSE) → Respond: Session Invalid
                    → (TRUE) → Switch — User Role Router
                        → Get row(s) in sheet
                            → Postgres: Save Response
                                → Postgres: Count Responses
                                    → Code: Pick Next Question
                                        → If: Survey Finished?
                                            → (FALSE) → Respond: Tool Call Result
                                            → (TRUE) → Postgres: Compute Final Scores
                                                → HTTP Request: Chatwoot Push (Deactivated)
                                                    → Postgres: Burn Session Token
                                                        → Respond: Survey Complete  ← THIS NODE
```

**Total Active Nodes: 16** (+ 1 deactivated + the 3 Respond nodes)

---

## 🎯 What Is the Exact Next Step?

After configuring `Respond: Survey Complete`:

**Phase 5 (n8n Workflows) is FUNCTIONALLY COMPLETE** ✅

(L86 Chatwoot Push is deactivated — will be done with Phase 8)

### Next: Phase 6 — Vapi Configuration (Lines 91–103)

| Line | Step | What To Do |
| :--- | :--- | :--- |
| **L93** | Create Voice Assistant | Go to Vapi dashboard → Create a new assistant |
| L95 | Configure Tools | Add `next_question` tool with `question_id` and `answer` params |
| L97 | Set webhook URL | Point to `https://shahariyar.app.n8n.cloud/webhook/vapi-master` |
| L99 | Disable autonomous scoring | Turn off AI-generated scoring in Vapi |
| L101 | Use Sarvam Malayalam voice | Set voice to Bulbul:v1 |
| L103 | Test in browser | Requires building the React PWA first |

**Your immediate next action: L93 — Create Voice Assistant in the Vapi dashboard.**

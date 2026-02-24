# Phase 6 Implementation Plan: Vapi Configuration (Lines 91–103) 🛡️

## Part 1: Deep Analysis — `next_question` & `complete_session` Tools

### Where Are These Tools Referenced?

| Location | `next_question` | `complete_session` | Evidence |
| :--- | :--- | :--- | :--- |
| **Checklist L95** | ✅ Mentioned | ✅ Mentioned | `"Configure Tools: next_question, complete_session"` |
| **n8n: Switch: Tool Call Name** | ✅ Routes it | ❌ NOT routed | Verified in walkthrough — only detects `next_question` |
| **n8n: Webhook Vapi Master** | ✅ Receives tool calls | ❌ No handler | Tool calls come through the webhook |
| **n8n: All Respond nodes** | ✅ Used in responses | ❌ Not used | `toolCallId` from webhook body |
| **Vapi Dashboard** | ❌ NOT YET CREATED | ❌ NOT YET CREATED | Phase 6 work |
| **Any code file** | ❌ None | ❌ None | Searched entire project |

### Key Finding: These Are **Vapi-Side Definitions**, Not n8n Code

> [!IMPORTANT]
> `next_question` and `complete_session` are **Vapi Tools** — they are defined in the **Vapi Dashboard** (Phase 6), NOT in n8n.
>
> **How it works:**
> 1. You define `next_question` as a **Function Tool** in Vapi
> 2. Vapi's AI decides when to call it during the voice conversation
> 3. Vapi sends a webhook to n8n with `toolCalls[0].function.name = "next_question"`
> 4. n8n's `Switch: Tool Call Name` routes it → processes → responds

### How Your n8n Currently Uses Them

```
Vapi calls "next_question" tool
    → Webhook: Vapi Master (receives the call)
        → Switch: Event Type (routes to "tool-calls")
            → Switch: Tool Call Name (detects "next_question")
                → Postgres: Fetch Session
                    → ... (full survey flow)
                        → Respond: Tool Call Result (returns next question)
                        OR
                        → Respond: Survey Complete (returns finished:true)
```

The n8n `Switch: Tool Call Name` reads: `$json.body.message.toolCalls[0].function.name`

---

## Part 2: Gap Analysis — Are We Ready for Phase 6?

### ✅ What IS Complete (Phase 5)

| Item | Status |
| :--- | :--- |
| Webhook receives Vapi tool calls | ✅ |
| Switch routes `next_question` | ✅ |
| Session validation | ✅ |
| Question fetching by role | ✅ |
| Response saving with scoring | ✅ |
| Survey completion detection | ✅ |
| Score computation | ✅ |
| Token burning | ✅ |
| Both Respond nodes (Tool Call Result + Survey Complete) | ✅ |

### ⚠️ Potential Gap: `complete_session` Route

The `Switch: Tool Call Name` node currently only routes `next_question`. The checklist L95 says: **"Configure Tools: next_question, complete_session"**

**Analysis:** In our current architecture, `complete_session` is NOT needed as a separate Vapi tool because:
- Survey completion is automatically detected when `answer_count >= 12` inside the `next_question` flow
- The `Code: Pick Next Question` node sets `finished: true` → triggers the completion path
- Vapi reads `finished: true` and ends the call

**However**, if we want to handle **edge cases** (employee says "I want to stop" mid-survey), we would need a `complete_session` tool. For now, **we can proceed without it** and add it in Phase 7 (Confirmation System) or Phase 10 (Testing).

> [!NOTE]
> **Decision needed from you:** Should we create `complete_session` as an early-exit tool? Or is the automatic completion (after 12 questions) sufficient for now?

### ⚠️ Naming Alignment Issue

| Source | Tool Name Used |
| :--- | :--- |
| Checklist L95 | `next_question` |
| Previous Vapi config guide (conv 71ae4c1a) | `submit_answer` |
| n8n Switch: Tool Call Name | `next_question` |

The previous conversation used `submit_answer` but your n8n switch detects `next_question`. **We will use `next_question`** to match n8n and the checklist.

---

## Part 3: Vapi Dashboard — Complete Feature Guide

When you open the Vapi Dashboard at `https://dashboard.vapi.ai`, here is **everything you will see** and what matters for our project:

### Dashboard Sections

| Section | What It Is | Relevant to Us? |
| :--- | :--- | :--- |
| **Assistants** | Where you create/manage voice AI agents | ✅ YES — main work area |
| **Phone Numbers** | Buy/manage phone numbers for calls | ❌ NO — we use browser, not phone |
| **Squads** | Multi-assistant setups | ❌ NO |
| **Files** | Upload knowledge base files | ❌ NO |
| **Blocks** | Reusable workflow components | ❌ NO |
| **Tools** | Create function tools (server-side) | ✅ YES — `next_question` tool |
| **Logs** | Call logs and debugging | ✅ YES — for testing |
| **API Keys** | Manage API keys | ✅ YES — need Public Key for PWA |

### Inside an Assistant — All Tabs

| Tab | What It Contains | Our Configuration |
| :--- | :--- | :--- |
| **Model** | LLM provider, system prompt, temperature | GPT-4o, custom survey prompt |
| **Transcriber** | STT provider for converting voice to text | Sarvam AI for Malayalam |
| **Voice** | TTS provider for speaking responses | Sarvam Bulbul:v1 Malayalam |
| **Tools** | Function tools the assistant can call | `next_question` tool |
| **Advanced** | Server URL, webhooks, call settings | n8n webhook URL |

---

## Part 5: Call Termination & Completion Logic (Fix Plan) 🏁

### The Root Cause
The call did not end automatically because Vapi's AI treats the final n8n response (`finished: true`) as a message to be spoken, but it lacks a "Instruction" to actually hang up. The logic currently misses a handshake between n8n and Vapi's internal `endCall` utility.

### Solution Pattern

| Component | Required Action | Why? |
| :--- | :--- | :--- |
| **Vapi Tools** | Create `complete_session` tool | Triggers the specific completion branch in n8n's Switch node. |
| **Vapi Prompt** | Enforce calling `complete_session` | Ensures n8n performs final scoring AND the AI knows the work is done. |
| **Vapi Model** | Enable `endCallFunctionEnabled: true` | Grants the AI permission to physically hang up the line. |
| **n8n Webhook** | Add Fallback Node | Prevents status-update/transcript events from timing out (improves latency). |

---

## Part 6: Road to Phase 7 — Option Confirmation (L106–L118) ⚖️

Once Phase 6 (Vapi Config) is verified with a clean run today, we move to **Phase 7: Option Confirmation System**. This is a critical legal requirement.

### How it will work:
1. **Response Logic:** Instead of saving immediately, n8n will first return a "Confirmation Question".
2. **AI Action:** AI repeats the answer: *"You said Option 2. Is this correct?"* (in Malayalam).
3. **Verification:** User must say "Yes" or "Correct".
4. **Final Save:** Only after "Yes", n8n marks the response as `confirmed = TRUE`.

---

## Project Status Audit (Master Checklist)

| Phase | Description | Status | Current Line |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Infrastructure | ✅ COMPLETE | 25 |
| **Phase 2** | Database Schema | ✅ COMPLETE | 38 |
| **Phase 3** | OTP & Security | [/] PARTIAL (Test Mode) | 55 |
| **Phase 4** | Voice Gateway | ✅ COMPLETE (via Vapi) | 72 |
| **Phase 5** | n8n Workflows | [/] VERIFYING (Completion Path) | 88 |
| **Phase 6** | Vapi Config | 📍 **CURRENT STEP** | **95 (Configure Tools)** |
| **Phase 7** | Option Confirmation | ⏭️ **NEXT PHASE** | 106 |

---

## Today's Step-by-Step Execution Plan

1. **[Vapi]** Add `complete_session` tool (Function) pointing to same n8n Webhook.
2. **[Vapi]** Toggle "End Call Function Enabled" in Model tab.
3. **[Postgres]** Run clean-up SQL to delete test data from `responses` and `results`.
4. **[Vapi]** Update Prompt: "When finished, speak the final message AND call the `complete_session` tool AND then hang up."
5. **[n8n]** Add a Respond to Webhook node connected to the "fallback" of the first Switch to handle non-tool events.

# PromptDock ⚡

> **Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF)**

### *Transform Microsoft Copilot, Google Gemini, ChatGPT, and Claude with interactive multi-turn workflows, an in-chat steering cockpit, contextual inline commenting, and one-click prompt management.*

[![Manifest V3](https://img.shields.io/badge/Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Chromium & Firefox](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Firefox%20115+-4F46E5)](https://github.com/Flx-xlF/PromptDock)
[![Microsoft Copilot](https://img.shields.io/badge/Microsoft%20Copilot-M365%20%7C%20Outlook%20%7C%20Teams-0078D4?logo=microsoft&logoColor=white)](https://copilot.cloud.microsoft)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Web%20App-8E75B2?logo=googlegemini&logoColor=white)](https://gemini.google.com)
[![ChatGPT](https://img.shields.io/badge/ChatGPT-Web%20App-10A37F?logo=openai&logoColor=white)](https://chatgpt.com)
[![Claude](https://img.shields.io/badge/Claude-Web%20App-D97706?logo=anthropic&logoColor=white)](https://claude.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

PromptDock (`v2.1.0`) turns browser-based AI chats into a structured workflow cockpit. Launch single-shot prompts or guided multi-turn workflows in one click, steer intermediate checkpoints directly above the chat input, branch completed analyses into new deliverables, and annotate AI drafts inline with word-level diff previews—all 100% locally in your browser with zero telemetry.

---

### Core Capabilities

- ⚡ **Command Palette & Resilient 3-Tier Injection**
  - **Fast Discovery:** Instant live search (`⌘K` / `Ctrl+K`), category filter pills (`Alle`, `PR & Medien`, `Review & Audit`, `Planung & Strategie`, `Eigene`), drag-and-drop sorting, auto-send toggle, and a live `chrome.storage.sync` byte meter.
  - **Rich-Text Safe Injection:** Uses a 3-tier injection pipeline—synthetic `ClipboardEvent('paste')` with synchronous verification, formatted `insertHTML`, and direct DOM / React native value-setter fallbacks—to work reliably across ProseMirror, Lexical, Quill, textareas, and nested M365/Outlook iframes. Falls back gracefully to the system clipboard whenever no input field is reachable.

- 🚊 **In-Chat Multi-Turn Cockpit ("Rail, Checkpoint, Fork")**
  - **Adaptive Floating HUD:** Anchors automatically **10px above the host chat composer** via `ResizeObserver` and viewport clamping inside an isolated Shadow DOM. Supports drag repositioning (double-click to snap back) and automatically collapses inactive step labels into compact dots in narrow split-screens or Outlook/Teams sidebars (`@container` query at `<= 460px`).
  - **Spotlight Composer & Quick Steering Chips:** Guide the next turn without retyping instructions using built-in modifier chips (*`+ Fakten korrigieren`*, *`+ Tiefer recherchieren`*, *`+ Haltung vorgeben`*, *`+ Ohne Rückfrage lösen`*) or type custom steering notes and advance via `Enter` or `Alt+Shift+ArrowRight`.
  - **Dynamic Island Capsule & Stop Interception:** Automatically minimizes into a compact 36px status pill with a pulsing indicator (`Generiert Antwort...`) and spring-physics transitions while the model streams. Catches native *"Stop generating"* / *"Stop response"* clicks so workflows advance cleanly without freezing.
  - **Three Execution Modes & Variable Modal:** Configure runtime variables (`SUCHBEGRIFF`, `ZEITRAUM`, `PERSON`, `THEMA`, `KANAL_PERSON` with automatic context fallbacks) and run any multi-turn workflow in **Guided** (pause at checkpoints), **Autopilot** (hands-free turn advance), or **Express One-Shot** (combines turns with a unified opening role, sequential `TASK 1..N:` headers, an 80/20 deliverable-first gate, and redundancy suppression).
  - **Dynamic Output Forking:** At workflow completion or the final checkpoint, branch in one click into alternative output formats (e.g., turn a completed analysis into a Q+A matrix, press reply, stakeholder email, or strategy brief).

- 💬 **Contextual Inline Commenting & Word-Level Diffs**
  - Highlight any span inside a Copilot, Gemini, ChatGPT, or Claude response to attach floating review notes and persistent W3C text highlights.
  - Apply one-click style adjustments (*"sachlicher"*, *"einkürzen"*, *"positiv formulieren"*, *"empathischer"*, *"verständlicher"*) or custom rewrite instructions, and inspect proposed edits with a **Myers word-level diff** before replacing or copying text.

- 🧩 **Custom Workflow Composer & Dual-Tier Storage**
  - Author your own **Single-Shot** prompts or **Multi-Turn Workflows** directly in the segmented popup editor with interactive step pills (`Turn 1`, `Turn 2`, `+` to append turns) and JSON export/import backups.
  - **Dual-Tier Architecture:** Single-shot prompts (`p_*`) and key ordering (`prompt_order`) synchronize across browser profiles via `chrome.storage.sync` (with automatic local/localStorage fallback), while longer custom multi-turn workflows (`r_*`) reside in `chrome.storage.local` to avoid sync per-item quota limits.

- 📱 **Mobile Shortcuts Sync via Private GitHub Gist**
  - Optional direct browser-to-GitHub sync (`api.github.com`) protected by your personal access token and throttled with a 1500ms debounce timer.
  - Generates a live QR onboarding sheet with endpoint copy for iOS Shortcuts and mobile automation, publishing both a full multi-turn JSON payload (`prompts`) and a flat lookup dictionary (`quick`).

---

### Built-In Strategic Communications Suite (15 Recipes)

While PromptDock works with custom prompts in any language or domain, it ships out of the box with a streamlined, German-language **15-recipe suite for Corporate Communications, Public Affairs, and Executive Intelligence** (`max 2 turns`, `≤ 4 tasks per turn`).

#### Suite Architecture & Guardrails
- **Two-Tier Media & Discourse Radar:** Grounding tasks combine internal **Microsoft 365 Graph** retrieval (emails, Teams chats prioritizing `#KOM-ANKER` self-chat bookmarks, meeting notes, SharePoint) with external **Web Search (*Websuche*)** across 12 of the 15 recipes to capture active media framing, verify consistency with published statements (*Konsistenzschutz*), and cite verified web/media sources alongside internal files.
- **First-Principles & Accessible Writing (*Laien-Test*):** Instead of rigid sentence schemas or hardcoded examples, drafting chunks enforce warm, relatable, jargon-free language understandable without prior knowledge—stress-tested across three viewpoints (*affected laypeople*, *critical media/politics*, and *partners/authorities*).
- **Sync Quota Hardened:** All 15 built-in recipes fit comfortably within Chrome's per-item (`8,192 B`) and total (`102,400 B`) sync limits (largest compiled recipe ~6.7 KB raw / ~6.9 KB JSON sync; total ~71.1 KB raw / ~73.5 KB sync, ~28–30% safe headroom), backed by automated upgrade migrations (`v2_25_universal_media_radar`).

#### Recipe Reference

| # | Recipe (`id`) | Category | Cadence & Turns | Inputs / Output Forks |
| :- | :--- | :--- | :--- | :--- |
| 1 | **Medienanfrage** (`recipe-medienanfrage`) | PR & Medien | 2 Turns: *Diagnose, Recherche & Strategie-Linie* ➔ *Medienantwort & Pre-Flight-Check* | Forks: `Medienantwort-Check`, `Q+A Tabelle`, `Interview-Briefing`, `Themenplanung` |
| 2 | **Interview beantworten** (`recipe-interview`) | PR & Medien | 2 Turns: *Diagnose, Recherche & Interview-Strategie* ➔ *Interview-Briefing & Antworten* | Forks: `Medienantwort`, `Q+A Tabelle` |
| 3 | **Wording erstellen** (`recipe-wording`) | PR & Medien | 2 Turns: *Lagebild & Taktik-Check* ➔ *Wording & Q+A* | Forks: `Medienantwort`, `Kommunikationsstrategie` |
| 4 | **Email & Beratung** (`recipe-email`) | PR & Medien | 2 Turns: *Lagebild, Subtext & taktische Weichenstellung* ➔ *Taktische Empfehlung & Antwortentwurf* | Forks: `Kommunikationsstrategie`, `Handlungsempfehlungen`, `Q+A Tabelle` |
| 5 | **Meeting analysieren** (`recipe-meeting`) | Planung & Strategie | 2 Turns: *Lagebild* ➔ *Briefing* | — |
| 6 | **Textprüfung & Freigabe** (`recipe-freigabe`) | Review & Audit | 2 Turns: *Lagebild* ➔ *Drei-Dimensionen-Audit & Freigabe* | Forks: `Antwortentwurf`, `Q+A Tabelle` |
| 7 | **Themenanalyse & Planung** (`recipe-themenplanung`) | Planung & Strategie | 2 Turns: *Lagebild & 360°-Mehrperspektiven-Check* ➔ *Entscheid, Themenplanung & Massnahmen* | Forks: `Kommunikationsstrategie`, `Antwortentwurf`, `Q+A Tabelle` |
| 8 | **Artikel schreiben** (`recipe-artikel`) | Planung & Strategie | 2 Turns: *Recherche, Thesen-Check & Artikel-Outline* ➔ *Vollständiger Artikelentwurf* | — |
| 9 | **Wochenstart Briefing** (`recipe-wochenstart`) | Planung & Strategie | 2 Turns: *Aktivitäts-Scan* ➔ *Delta & Inbox-Triage* | Vars: `ZEITRAUM` |
| 10 | **Update** (`recipe-update`) | Planung & Strategie | 2 Turns: *Kontext & Recherche* ➔ *Delta & Briefing* | Vars: `THEMA`*, `PERSON`, `ZEITRAUM` |
| 11 | **Recherche** (`recipe-recherche`) | PR & Medien | 1 Turn (Single-Shot): *Lagebild* | Vars: `SUCHBEGRIFF`* · Forks: `Antwortentwurf`, `Kommunikationsstrategie`, `Q+A Tabelle`, `Themenplanung` |
| 12 | **Standort- & Stakeholder-Austausch** (`recipe-standort-austausch`) | Planung & Strategie | 1 Turn (Single-Shot): *Stakeholder-Einträge* | — |
| 13 | **Präsentation & Storyboard** (`recipe-praesentation`) | Review & Audit | 2 Turns: *Deck-Diagnose, Recherche & Storyline-Architektur* ➔ *Folien-Storyboard & konkrete Inputs* | Forks: `Detailtabelle`, `Q+A Tabelle`, `Antwortentwurf` |
| 14 | **Medienantwort-Check** (`recipe-medienantwort-check`) | Review & Audit | 1 Turn (Single-Shot): *Redaktions-Challenge & Optimierung (2 Textvarianten)* | Forks: `Q+A Tabelle`, `Medienantwort` |
| 15 | **Social Media Post** (`recipe-social-post`) | Planung & Strategie | 2 Turns: *Lagebild & Entwurfs-Challenge* ➔ *Post-Entwurf & Visual-Briefing* | Vars: `KANAL_PERSON` · Forks: `Antwortentwurf`, `Q+A Tabelle`, `Artikelentwurf` |

---

### Supported AI Platforms

| Platform | Supported Environments (`manifest.json` & `content.js`) | Prompt Injection & Inline Diffs | Multi-Turn Workflow HUD |
| :--- | :--- | :---: | :---: |
| **Microsoft Copilot** | `copilot.microsoft.com`, `copilot.cloud.microsoft`, `m365.cloud.microsoft`, `teams.microsoft.com`, Outlook Web (`outlook.cloud.microsoft`, `outlook.office.com`, `outlook.office365.com`, `outlook.live.com`, `outlook.com`) | ✅ | ✅ |
| **Google Gemini** | `gemini.google.com` | ✅ | ✅ |
| **ChatGPT** | `chatgpt.com`, `chat.openai.com` | ✅ | ✅ |
| **Claude** | `claude.ai` | ✅ | ✅ |

---

### Installation & Build

#### Load Unpacked (Chrome / Edge / Brave)
1. Clone this repository:
   ```bash
   git clone https://github.com/Flx-xlF/PromptDock.git
   ```
2. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
3. Click **Load unpacked** and select the `PromptDock` folder.
4. Pin PromptDock to your browser toolbar.

*(Firefox 115+ MV3 metadata is configured via `manifest.json` `browser_specific_settings.gecko`; load temporarily via `about:debugging` ➔ **This Firefox** ➔ **Load Temporary Add-on**.)*

#### Build Release ZIP
Validate all JS files with Node.js / JSC and create a clean, store-ready archive (`release/promptdock-v2.1.0.zip`):
```bash
python3 build_release.py
# or
npm run build
```

#### Classic Edition (v1.0 Single-Paste)
Looking for the lightweight single-paste prompt manager without the workflow HUD?
- **Branch:** [`v1-classic`](https://github.com/Flx-xlF/PromptDock/tree/v1-classic)
- **Archive:** [PromptDock v1.0.0-classic Release](https://github.com/Flx-xlF/PromptDock/releases/tag/v1.0.0-classic)

---

### Keyboard Shortcuts

| Shortcut / Command | Scope | Action |
| :--- | :--- | :--- |
| `Alt + Shift + →` | Chat HUD | Submit optional steering note and advance to the next workflow turn |
| `⌘ + K` / `Ctrl + K` | Popup | Focus and select the prompt search bar |
| `Enter` | Chat HUD / Modals | Advance workflow turn with steering note, submit variables, or save inline comment |
| `Esc` | Popup / Chat HUD | Close active modals, clear search, or dismiss workflow HUD |
| `Run Prompt 1–3` (`run-prompt-0..2`) | Global Browser | Configurable via `chrome://extensions/shortcuts` to trigger your top 3 prompts directly |

---

### Privacy & Data Ownership

- **Zero Telemetry & Client-Side Only:** PromptDock includes no analytics, tracking scripts, or intermediary servers.
- **Direct Storage:** Prompts and workflows stay inside your browser (`chrome.storage.sync` / `chrome.storage.local`). Optional GitHub Gist synchronization authenticates directly against `https://api.github.com/gists` using your own token.
- Full details: [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · Licensed under [MIT](LICENSE).

---

Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF) · ☕ [Tip on Ko-fi](https://ko-fi.com/flxxlf)

# PromptDock ⚡

> **Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF)**

### *Transform Microsoft Copilot, Google Gemini, ChatGPT, and Claude with interactive multi-turn workflows, an in-chat steering rail, contextual inline commenting, and one-click prompt management.*

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Microsoft Copilot](https://img.shields.io/badge/Microsoft%20Copilot-Web%20App-0078D4?logo=microsoft&logoColor=white)](https://copilot.microsoft.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Web%20App-8E75B2?logo=googlegemini&logoColor=white)](https://gemini.google.com)
[![ChatGPT](https://img.shields.io/badge/ChatGPT-Web%20App-10A37F?logo=openai&logoColor=white)](https://chatgpt.com)
[![Claude](https://img.shields.io/badge/Claude-Web%20App-D97706?logo=anthropic&logoColor=white)](https://claude.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Dev-schema%2Ff-indigo)](https://github.com/Flx-xlF)

---

### What's New in PromptDock 2.0 🚀

PromptDock 2.0 evolves from a fast prompt launcher into an **interactive AI workflow cockpit** — right inside your browser:

- 🚊 **In-Chat Rail UX ("Rail, Checkpoint, Fork")**  
  Complex corporate communication, audit, and strategic tasks are split into discrete cognitive turns (*Turn 1: Research/Lagebild* ➔ *Turn 2: Strategy/Audit* ➔ *Turn 3: Output*). A floating stepper rail sits directly above the chat input, showing your current step and workflow progress.
- 🛑 **Smart Checkpoint Cards & Streaming Detection**  
  As soon as the LLM finishes streaming its response, PromptDock activates a Checkpoint Card with instant steering chips (*"✓ Direkt weiter"*, *"Fakten korrigieren"*, *"Tiefer recherchieren"*, *"Haltung vorgeben"*) and a free-text input for fast corrections.
- 🔀 **Dynamic Forking**  
  Branch out at completion points: turn an analysis into a press reply, a Q&A defense document, an editorial planning entry, or a strategic briefing with one click.
- ⚡ **Muscle Memory Turn Advancement (`⌥⇧→` / `Alt+Shift+Right`)**  
  Advance through multi-turn workflows without leaving your keyboard.
- 📋 **Variable Sheet Modal**  
  Fill in dynamic variables (e.g. `ZEITRAUM`, `PERSON`, `THEMA`, `SUCHBEGRIFF`) before launching, and choose your preferred execution mode (*Guided*, *Autopilot*, or *Express One-Shot*).

---

### 📦 Classic Edition (v1.0 Single-Paste)

Prefer the pure, ultra-minimalist single-paste prompt list without the in-chat workflow rail?

- 📌 **Git Branch:** [`v1-classic`](https://github.com/Flx-xlF/PromptDock/tree/v1-classic)
- 💾 **Release Archive:** [PromptDock v1.0.0-classic Release](https://github.com/Flx-xlF/PromptDock/releases/tag/v1.0.0-classic)

Both editions share the same local-first, zero-telemetry architecture. PromptDock 2.0 also retains 100% backwards compatibility: any single-turn prompt in your list continues to execute as an instantaneous direct paste!

---

### Key Features

- ⚡ **One-Click Prompt & Workflow Injection**  
  Keep high-leverage prompts and multi-turn recipes organized in a lightweight popup dock. One click injects them into the active chat.
- ⌨️ **Muscle Memory Hotkeys**  
  Trigger your top 3 prompts with global keyboard shortcuts (`Alt+Shift+1`, `Alt+Shift+2`, `Alt+Shift+3`) and advance turns with `Alt+Shift+ArrowRight`.
- 💬 **Contextual Inline Commenting & Rewrites**  
  Highlight any generated text inside Copilot, Gemini, ChatGPT, or Claude to trigger a floating action bar. Run quick one-click adjustments (*"sachlicher"*, *"einkürzen"*, *"positiv formulieren"*, *"empathischer"*) or leave custom instructions with a side-by-side visual diff comparison.
- 🔄 **Smart Clipboard Fallback**  
  If an input field is obscured, inside a nested iframe, or momentarily unreachable, your prompt or turn step is copied to your clipboard instantly with an unobtrusive toast notification.
- 📱 **Mobile & iOS Shortcut Sync**  
  Sync your prompt library directly to your iPhone via a private GitHub Gist—accessible natively via Apple Shortcuts without third-party cloud intermediaries.
- 🔒 **Zero Telemetry & 100% Local-First**  
  No telemetry, no tracking pixels, no remote analytics, and no accounts required. Prompts are stored strictly in your browser's chunked sync storage (`chrome.storage.sync` / `chrome.storage.local`).

---

### Built-In Strategic Recipe Suite

PromptDock 2.0 includes a vendor-agnostic Corporate Communications & Intelligence recipe suite:

1. **Medienanfrage** (3 Turns: Lagebild ➔ Strategie ➔ Medienantwort)
2. **Interview-Vorbereitung** (3 Turns: Briefing ➔ Haltung ➔ Antwortentwurf)
3. **Wording & Sprachregelung** (2 Turns: Kernanalyse ➔ Leitbotschaften & FAQ)
4. **Strategischer Sparringspartner** (Herausforderndes Sparring)
5. **Kommunikationsstrategie** (3 Turns: Lagebild ➔ Positionierung ➔ Massnahmenplan)
6. **E-Mail & Stakeholder-Antwort** (2 Turns: Analyse ➔ Antwortentwurf)
7. **Meeting-Vorbereitung & Protokoll** (Agenda/Protokoll ➔ Briefing)
8. **Themenanalyse & Issue-Monitoring** (Recherche ➔ Risikobewertung)
9. **Proofreading & Redigat** (Textanalyse ➔ Optimierter Text)
10. **Freigabe-Audit & Governance** (Lagebild ➔ 3-fach Audit ➔ Freigabeentscheid)
11. **Themen- & Redaktionsplanung** (Analyse ➔ Themenboard-Eintrag)
12. **Artikel & Storytelling** (Recherche ➔ Storyline ➔ Artikelentwurf)
13. **Wochenstart Briefing** (Executive Activity Scan & Delta)
14. **Projekt- & Status-Update** (Kompaktes Reporting)
15. **Tiefenrecherche & Intelligence** (Quellen- & Fakten-Dossier)
16. **Standort- & Stakeholder-Austausch** (Kompakteinträge)

---

### Supported AI Platforms

| Platform | Environments Supported | Injection & Inline Commenting | Workflow Rail |
| :--- | :--- | :---: | :---: |
| **Microsoft Copilot** | Outlook on the Web, Teams Web, M365 Portal | ✅ | ✅ |
| **Google Gemini** | gemini.google.com | ✅ | ✅ |
| **ChatGPT** | chatgpt.com, chat.openai.com | ✅ | ✅ |
| **Claude** | claude.ai | ✅ | ✅ |

---

### Quick Start & Installation

#### Option A: Install from Web Store
*(Store links will be posted upon publication)*
- [Chrome Web Store](https://chrome.google.com/webstore)
- [Firefox Add-ons (AMO)](https://addons.mozilla.org/)
- [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons)

#### Option B: Load as Developer Extension (Unpacked)
1. Clone or download this repository:
   ```bash
   git clone https://github.com/Flx-xlF/PromptDock.git
   ```
2. Open your Chromium browser and go to `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (toggle in top-right corner).
4. Click **Load unpacked** and select the extension directory.
5. Pin the extension to your toolbar and start prompting.

---

### Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + Shift + 1` | Inject Prompt 1 (or launch guided workflow) |
| `Alt + Shift + 2` | Inject Prompt 2 |
| `Alt + Shift + 3` | Inject Prompt 3 |
| `Alt + Shift + →` | Advance to next turn at workflow checkpoint |

*Customizable anytime via `chrome://extensions/shortcuts`.*

---

### Privacy & Data Ownership

Your prompts belong to you.
- PromptDock operates completely client-side.
- We do not run a backend server.
- The optional GitHub Gist synchronization connects directly from your browser to GitHub's official API (`api.github.com`) using your personal token.
- See full details in [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

---

### Building the Release Package

To validate syntax and create a store-compliant, clean ZIP package:
```bash
python3 build_release.py
```
Outputs: `release/promptdock-v2.0.0.zip`

---

Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF).

☕ Enjoy my work? [Tip me on Ko-fi](https://ko-fi.com/flxxlf).

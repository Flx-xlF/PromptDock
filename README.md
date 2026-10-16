# PromptDock ⚡

> **Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF)**

### *Transform Microsoft Copilot, Google Gemini, ChatGPT, and Claude with interactive multi-turn workflows, an in-chat steering cockpit, contextual inline commenting, and one-click prompt management.*

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Microsoft Copilot](https://img.shields.io/badge/Microsoft%20Copilot-Web%20App-0078D4?logo=microsoft&logoColor=white)](https://copilot.microsoft.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Web%20App-8E75B2?logo=googlegemini&logoColor=white)](https://gemini.google.com)
[![ChatGPT](https://img.shields.io/badge/ChatGPT-Web%20App-10A37F?logo=openai&logoColor=white)](https://chatgpt.com)
[![Claude](https://img.shields.io/badge/Claude-Web%20App-D97706?logo=anthropic&logoColor=white)](https://claude.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Dev-schema%2Ff-indigo)](https://github.com/Flx-xlF)

---

### What's New in PromptDock 2.0 🚀

PromptDock 2.0 evolves from a fast prompt launcher into an **interactive AI workflow cockpit** — engineered right inside your browser:

- 🧩 **Segmented Multi-Turn Recipe Composer**  
  Design and customize your own multi-step workflows directly within the popup editor. Switch between **Single-Shot** and **Multi-Turn** modes via an interactive segmented control. Build sequences step-by-step with horizontal step pills, append subsequent turns with a single click (`+`), and configure each step's title and prompt canvas independently.
- 💾 **Dual-Tier Resilient Storage Architecture**  
  A modern hybrid persistence model: single-shot prompts are stored in `chrome.storage.sync` (`p_<id>`) for instant synchronization across devices, while complex multi-turn workflows are saved in `chrome.storage.local` (`r_<id>`), ensuring zero risk of sync quota bottlenecks. Both tiers are merged transparently into a unified catalog with full export and import support.
- 🌉 **Execution Bridge & Direct Turn Injection**  
  Custom multi-turn recipes connect directly to the in-chat HUD rail via runtime message passing. Each turn injects directly into the chat input without rigid catalog schemas, preserving user-defined instructions and allowing real-time steering notes at every checkpoint.
- ⚡ **Express Mode Fallback Integrity**  
  Launch any multi-turn workflow as an instantaneous single-shot prompt when time is critical: PromptDock automatically compiles all turn instructions with clean markdown dividers (`---`) and injects the composite workflow directly into the composer.
- 🚊 **In-Chat Rail UX ("Rail, Checkpoint, Fork")**  
  Complex corporate communication, audit, and strategic tasks are split into discrete cognitive turns (*Turn 1: Research / Situation Analysis* ➔ *Turn 2: Strategy / Audit* ➔ *Turn 3: Output Synthesis*). A floating stepper rail sits directly above the chat input, showing your current step and workflow progress.
- 🎙️ **2-Zone Spotlight Composer**  
  The expanded HUD is organized into two dedicated zones: a compact top row of quick steering modifier chips (*+ Fakten korrigieren*, *+ Tiefer recherchieren*, *+ Haltung vorgeben*) and a unified full-width input container with an integrated primary `Weiter ➔` CTA (`⌥⇧→`). The steering input spans the full card width, eliminating truncated placeholders.
- 🏝️ **Dynamic Island 36px Capsule**  
  A single-line, 36px minimized status capsule featuring live turn status, workflow name, a pulsing streaming indicator, and compact quick actions. It never wraps and keeps your chat conversation completely unobscured.
- 🌊 **Spring-Physics Morph & Scale Crossfade**  
  Transitions between the expanded Spotlight Composer and the minimized Dynamic Island are powered by physical spring overshoot curves (`cubic-bezier(0.34, 1.15, 0.64, 1)`) paired with a micro-scale content crossfade (`scale(0.96) translateY(4px) ➔ scale(1)`), eliminating jarring snap cuts or layout reflows.
- 📐 **Zero-Overlap Spatial Docking**  
  PromptDock dynamically detects the host chat input container across Copilot, Gemini, ChatGPT, and Claude. Connected to a reactive `ResizeObserver`, `#promptdock-rail-container` anchors **10px above the top border** of the composer. As you type multi-line prompts or attach email cards, PDFs, and images, the HUD automatically glides upward with zero overlap.
- 🛑 **Streaming State Guard & Native Stop Interception**  
  When an AI response begins streaming, PromptDock displays a pulsing amber indicator (`Generiert Antwort...`) and auto-collapses into the 36px capsule. If you click the host chat's native stop button (*"Stop generating"* / *"Stop response"*), PromptDock catches the event and advances directly to your checkpoint without freezing.
- 🎨 **Redesigned Command Palette & Slide-Up Sheet**  
  A dark minimalist command palette unified with modern Indigo design tokens (`--accent: #6366f1`), sticky header brand badge, search shortcut (`⌘K` / `Ctrl+K`), horizontally scrollable category pills with overflow fade masks, directional card chevrons, and a slide-up prompt editor with custom toggle controls.
- 🔀 **Dynamic Output Forking**  
  Branch out at workflow completion points: transform an analysis into a press reply, a defensive Q&A matrix, an editorial board entry, or an executive briefing with a single click.
- 📋 **Variable Sheet Modal**  
  Configure dynamic template variables (e.g. `ZEITRAUM`, `PERSON`, `THEMA`, `SUCHBEGRIFF`) before launching, and select your execution mode (*Guided*, *Autopilot*, or *Express One-Shot*).

---

### 📦 Classic Edition (v1.0 Single-Paste)

Prefer the pure, ultra-minimalist single-paste prompt list without the in-chat workflow rail?

- 📌 **Git Branch:** [`v1-classic`](https://github.com/Flx-xlF/PromptDock/tree/v1-classic)
- 💾 **Release Archive:** [PromptDock v1.0.0-classic Release](https://github.com/Flx-xlF/PromptDock/releases/tag/v1.0.0-classic)

Both editions share the same local-first, zero-telemetry architecture. PromptDock 2.0 retains 100% backwards compatibility: any single-turn prompt in your list continues to execute as an instantaneous direct paste!

---

### Key Features

- ⚡ **One-Click Prompt & Workflow Injection**  
  Keep high-leverage prompts and multi-turn recipes organized in a minimalist command palette. One click on any item row injects and launches it in the active chat.
- 🧩 **Custom Multi-Turn Sequence Builder**  
  Author custom multi-turn workflows with an interactive step builder, dedicated canvas for each phase, and automatic compile fallbacks.
- 🎛️ **Draggable In-Chat HUD Rail**  
  A floating cockpit that keeps you focused on complex multi-turn workflows without switching tabs. Reposition freely on your screen or double-click to snap back to zero-overlap default docking.
- ⌨️ **Muscle Memory Hotkeys**  
  Trigger your top 3 prompts with global keyboard shortcuts (`Alt+Shift+1`, `Alt+Shift+2`, `Alt+Shift+3`), search with `Cmd+K`, and advance turns with `Alt+Shift+ArrowRight`.
- 💬 **Contextual Inline Commenting & Rewrites**  
  Highlight any generated text inside Copilot, Gemini, ChatGPT, or Claude to trigger a floating action bar. Run quick adjustments (*"sachlicher"*, *"einkürzen"*, *"positiv formulieren"*, *"empathischer"*, *"verständlicher"*) or leave custom instructions with a side-by-side visual diff comparison.
- 🛡️ **Resilient 3-Tier Injection Engine**  
  Uses synthetic paste events with synchronous editor verification, `insertHTML`, and direct DOM node construction to prevent duplicate injection and preserve paragraph formatting across complex rich text editors (ProseMirror, Lexical, Quill).
- 🔄 **Smart Clipboard Fallback**  
  If an input field is obscured, inside a nested iframe, or momentarily unreachable, your prompt or turn step is copied to your clipboard instantly with an unobtrusive toast notification.
- 📱 **Mobile Shortcut & Private Gist Sync**  
  Sync your prompt library directly to your mobile device via a private GitHub Gist—accessible natively via mobile shortcuts without third-party cloud intermediaries.
- 🔒 **Zero Telemetry & 100% Local-First**  
  No telemetry, no tracking pixels, no remote analytics, and no accounts required. Prompts are stored strictly in your browser's dual-tier storage (`chrome.storage.sync` for single-shot prompts, `chrome.storage.local` for multi-turn recipes).

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
| **Microsoft Copilot** | copilot.microsoft.com, copilot.cloud.microsoft, Outlook on Web, Teams Web, M365 Portal | ✅ | ✅ |
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
| `⌘ + K` / `Ctrl + K` | Focus prompt search bar in popup dock |
| `Enter` | Submit steering note & advance turn at checkpoint |
| `Esc` | Clear search query or close dialogs |

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

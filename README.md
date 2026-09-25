# PromptDock ⚡

> **Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF)**

### *Are you using Microsoft Copilot, Google Gemini, ChatGPT, or Claude on the web? This lightweight extension delivers one-click prompt injection, inline contextual commenting, and effortless prompt library management.*

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Microsoft Copilot](https://img.shields.io/badge/Microsoft%20Copilot-Web%20App-0078D4?logo=microsoft&logoColor=white)](https://copilot.microsoft.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Web%20App-8E75B2?logo=googlegemini&logoColor=white)](https://gemini.google.com)
[![ChatGPT](https://img.shields.io/badge/ChatGPT-Web%20App-10A37F?logo=openai&logoColor=white)](https://chatgpt.com)
[![Claude](https://img.shields.io/badge/Claude-Web%20App-D97706?logo=anthropic&logoColor=white)](https://claude.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Dev-schema%2Ff-indigo)](https://github.com/Flx-xlF)

---

### The Problem Nobody at Big Tech Wanted to Fix

If your company runs on Microsoft 365 or you work daily with Google Gemini, ChatGPT, or Claude, you have likely noticed a maddening omission:

Unless your organization pays premium enterprise tiers for custom Copilot Studio add-ons or custom enterprise portals, **there is simply no organic way to save, organize, or reuse prompts.** 

Instead, thousands of professionals spend their workdays copy-pasting multi-step instructions from OneNote, sticky notes, and text files. And when an AI response needs tweaking, you are forced to retype instructions from scratch because you cannot easily comment on or refine specific paragraphs inline.

**PromptDock** is the missing local-first productivity layer built right into your browser.

---

### What It Does

- ⚡ **One-Click Prompt Injection**  
  Keep your high-leverage prompts (email replies, executive briefings, logic audits, proofreading) organized in a lightweight popup dock. One click injects them directly into the active AI chat.
- ⌨️ **Muscle Memory Hotkeys**  
  Trigger your top 3 prompts with global keyboard shortcuts (`Alt+Shift+1`, `Alt+Shift+2`, `Alt+Shift+3`) without reaching for the mouse.
- 💬 **Contextual Inline Commenting & Rewrites**  
  Highlight any generated text inside Copilot, Gemini, ChatGPT, or Claude to trigger a floating action bar. Run quick one-click adjustments (*"sachlicher"*, *"einkürzen"*, *"positiv formulieren"*, *"empathischer"*) or leave custom instructions with a side-by-side visual diff comparison.
- 🔄 **Smart Clipboard Fallback**  
  If an input field is obscured, inside a nested iframe, or momentarily unreachable, your prompt is copied to your clipboard instantly with an unobtrusive toast notification.
- 📱 **Mobile & iOS Shortcut Sync**  
  Sync your prompt library directly to your iPhone via a private, secret GitHub Gist—accessible natively via Apple Shortcuts without third-party cloud intermediaries.
- 🔒 **Zero Telemetry & 100% Local-First**  
  No telemetry, no tracking pixels, no remote analytics, and no accounts required. Prompts are stored in your browser's chunked sync storage (`chrome.storage.sync` / `chrome.storage.local`).

---

### Supported AI Platforms

| Platform | Environments Supported | Injection & Inline Commenting |
| :--- | :--- | :---: |
| **Microsoft Copilot** | Outlook on the Web, Teams Web, M365 Portal | ✅ |
| **Google Gemini** | gemini.google.com | ✅ |
| **ChatGPT** | chatgpt.com, chat.openai.com | ✅ |
| **Claude** | claude.ai | ✅ |

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
   git clone https://github.com/Flx-xlF/prompt-dock.git

   1. Open your Chromium browser and go to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked** and select the extension directory.
4. Pin the extension to your toolbar and start prompting.

---

### Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + Shift + 1` | Inject Prompt 1 (or copy to clipboard fallback) |
| `Alt + Shift + 2` | Inject Prompt 2 |
| `Alt + Shift + 3` | Inject Prompt 3 |

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

---

Built with care (and a bit of madness) by schema/f.

Enjoy my work? Tip me on Ko-fi.


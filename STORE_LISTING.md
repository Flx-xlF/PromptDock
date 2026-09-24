# Store Listing & Submission Guide: PromptDock

Use this guide and copy-paste ready text when submitting the extension to the **Chrome Web Store Developer Dashboard**, **Firefox Add-ons Developer Hub (AMO)**, and **Microsoft Edge Add-ons**.

---

## 1. Store Metadata

### Title
PromptDock

### Summary / Short Description (Max 132 characters)
One-click prompt injection, inline commenting, and rewriting for AI assistants (Microsoft Copilot, Google Gemini).

### Category
- Chrome Web Store: **Productivity** / **Workflow & Planning**
- Firefox AMO: **Productivity**

### Languages
- English (United States) (Primary)
- German (Secondary / UI localization)

---

## 2. Store Description (Markdown / Text)

```markdown
Boost your AI workflow with PromptDock — the fastest way to save, organize, and inject recurring prompts into Microsoft Copilot (Outlook, Teams, M365) and Google Gemini.

Key Features:
⚡ One-Click Prompt Injection: Instantly inject complex prompt workflows and multi-step tasks into the chat input.
⌨️ Keyboard Shortcuts: Trigger your favorite prompts using custom hotkeys (Alt+Shift+1, 2, 3...) without touching the mouse.
🔄 Smart Fallback: If an input field isn't detected or is obscured, prompts are automatically copied to your clipboard with an instant toast notification.
📱 Mobile & iOS Shortcut Sync: Seamlessly sync prompts to your iPhone via private GitHub Gists to access your library on the go.
🔒 100% Private & Local-First: Zero tracking, zero telemetry, no external ad scripts. All prompts remain stored safely inside your browser.
💾 JSON Import & Export: Backup and restore your prompt library anytime.

Supported AI Platforms:
- Microsoft 365 Copilot (Outlook Web, Teams Web, M365 Portal)
- Google Gemini (gemini.google.com)

---
Built with care (and a bit of madness) by [schema/f](https://github.com/Flx-xlF).  
Enjoy my work? [Tip me on Ko-fi](https://ko-fi.com/flxxlf)
```

---

## 3. Permission Justifications (For Store Reviewers)

When submitting to the Chrome Web Store, reviewers require clear explanations for each requested permission:

### Host Permissions (`*://*.microsoft.com/*`, `*://*.cloud.microsoft/*`, `*://gemini.google.com/*`, etc.)
> **Justification:**  
> "The extension requires host permissions on supported AI assistant web applications (Microsoft Copilot and Google Gemini) to detect the chat input field, insert user-selected prompt templates, and provide inline action buttons within the interface."

### Host Permission: `https://api.github.com/*`
> **Justification:**  
> "Required strictly for the optional user-configured Mobile Sync feature. Allows users to save and synchronize their prompt templates to a private, secret GitHub Gist using their own Personal Access Token."

### `storage`
> **Justification:**  
> "Used to store user-created prompt templates, titles, keyboard shortcut order, and UI preferences across browser sessions using chrome.storage.sync."

### `activeTab` & `scripting`
> **Justification:**  
> "Used when a user activates a keyboard shortcut to execute the content script and inject the prompt text into the active tab's AI input element."

### `clipboardWrite`
> **Justification:**  
> "Used strictly as a fallback convenience: if the user executes a prompt shortcut on a page where the AI input element cannot be focused or located, the prompt text is copied to the user's clipboard and a notification toast is displayed."

---

## 4. Single-Purpose Policy Declaration
> "The single purpose of PromptDock is to allow users to store, organize, and insert reusable AI prompt templates into web-based AI assistant tools."

---

## 5. Visual Asset Requirements Checklist

- [ ] **128x128 Store Icon:** Located at `icons/icon-128.png` (PNG, 128x128).
- [ ] **Screenshots (Minimum 1, recommended 3–4):**
  - Dimensions: **1280x800** or **640x400** pixels (PNG).
  - Recommended frames:
    1. Popup UI showing prompt list and '+ Neuer Prompt' form.
    2. Prompt injection in action on Microsoft Copilot / Outlook.
    3. Prompt injection in action on Google Gemini.
    4. Mobile Sync dialog with GitHub Gist settings.
- [ ] **Small Promo Tile (Optional but recommended):** 440x280 pixels (PNG).

---

## 6. How to Build & Submit the Release Package

1. Run the release packager:
   ```bash
   python3 build_release.py
   ```
2. The store-ready zip will be generated at:
   `release/promptdock-v1.0.0.zip`
3. Upload to:
   - **Chrome Web Store:** [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
   - **Firefox Add-ons (AMO):** [https://addons.mozilla.org/developers/](https://addons.mozilla.org/developers/)
   - **Edge Add-ons:** [https://partner.microsoft.com/dashboard/microsoftedge](https://partner.microsoft.com/dashboard/microsoftedge)

# Privacy Policy for Universal AI Prompter

**Last updated:** September 24, 2026

Universal AI Prompter ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains our data practices and demonstrates our commitment to transparency.

## 1. Single Purpose & Data Processing Principle
Universal AI Prompter is designed to store user-defined AI prompt templates and inject them into web-based AI assistant interfaces (such as Microsoft Copilot and Google Gemini) upon user request. 

**We do not collect, track, sell, or monetize any personal data.**

## 2. Information Storage & Handling

- **Prompts & Configuration:**
  All prompt titles, prompt contents, and settings are saved locally in your browser using `chrome.storage.sync` (or `chrome.storage.local` if synchronization is unavailable). This data remains strictly within your browser profile and is synchronized exclusively through your authenticated browser account (e.g., Google or Firefox Sync).

- **Mobile Sync & GitHub Tokens (Optional):**
  If you choose to enable the optional Mobile Sync feature via GitHub Gists:
  - Your GitHub Personal Access Token (PAT) is stored strictly in your browser's local storage (`chrome.storage.local`).
  - The token is used solely to authenticate direct HTTPS requests from your browser to GitHub's official API (`https://api.github.com/gists`) to create and update a private, secret Gist containing your prompts.
  - The token and prompt data are never transmitted to any intermediary server or third party.

- **Clipboard Access:**
  The `clipboardWrite` permission is used solely as a user convenience fallback. When a prompt cannot be injected directly into a recognized text input, the prompt text is copied to your clipboard and a brief toast notification is displayed. The extension never reads your clipboard contents.

- **Host Permissions & Web Content:**
  The extension requests host permissions for specific domains (Microsoft Copilot, Office, Bing, and Google Gemini). These permissions are used exclusively to detect prompt input fields and insert your requested text when you activate a prompt. The extension does not read, log, or transmit your conversations, documents, or browsing history.

## 3. Third-Party Services
The extension communicates exclusively with:
1. **GitHub API (`api.github.com`):** Only if you explicitly configure GitHub Gist Mobile Sync.
2. No analytics, tracking pixels, advertising networks, or external telemetry scripts are included.

## 4. Permissions Disclosure
- `storage`: To save your custom prompts and preferences.
- `activeTab` & `scripting`: To inject the prompt injection handler into the active tab.
- `clipboardWrite`: To copy prompts to the clipboard if direct injection is unavailable.
- `host_permissions`: To enable content script interaction on supported AI assistant web applications.

## 5. Contact
For questions or concerns regarding this policy, please open an issue on the official project repository or contact the developer at:
`support@flx.dev`

import { ext, StorageAdapter, PROMPT_KEY_PREFIX, ORDER_KEY } from './shared/browser-compat.js';

/**
 * Global Keyboard Shortcut Listener
 * Listens for commands defined in manifest.json (e.g. run-prompt-0, run-prompt-1, run-prompt-2).
 * Fetches the corresponding prompt and attempts direct injection into the active tab.
 */
ext.commands.onCommand.addListener(async (command) => {
    console.log("[PromptDock] Command received:", command);
    
    if (command.startsWith("run-prompt-")) {
        const indexStr = command.replace("run-prompt-", "");
        const index = parseInt(indexStr);
        
        if (isNaN(index)) return;
        
        // --- 1. Fetch Prompts from Chunked Sync Storage ---
        const allSync = await StorageAdapter.get(null);
        let prompts = [];

        if (allSync[ORDER_KEY]) {
            // New chunked format (each prompt stored under 'p_<id>')
            prompts = allSync[ORDER_KEY]
                .map(id => allSync[PROMPT_KEY_PREFIX + id])
                .filter(Boolean);
        } else if (allSync.prompts && allSync.prompts.length > 0) {
            // Legacy sync format (single array under 'prompts')
            prompts = allSync.prompts;
        } else {
            // Legacy local format
            const localData = await ext.storage.local.get('prompts');
            prompts = (localData.prompts && localData.prompts.length > 0) ? localData.prompts : [];
        }
        
        if (index >= prompts.length) {
            console.warn(`[PromptDock] No prompt configured at index ${index}`);
            return;
        }
        
        const prompt = prompts[index];
        const autoSend = !!prompt.autoSend;
        
        // --- 2. Resolve Active Tab & Validate Domain ---
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) return;
        const tab = tabs[0];
        
        let isSupported = false;
        try {
            const urlObj = new URL(tab.url);
            const validHosts = [
                'outlook.cloud.microsoft',
                'm365.cloud.microsoft',
                'teams.microsoft.com',
                'outlook.office.com',
                'outlook.office365.com',
                'outlook.live.com',
                'outlook.com',
                'gemini.google.com'
            ];
            isSupported = validHosts.some(h => urlObj.hostname === h || urlObj.hostname.endsWith('.' + h));
        } catch (e) {
            // Invalid or non-HTTP URL (e.g. chrome://)
        }
        
        // --- 3. Execute Script & Attempt Injection ---
        if (isSupported) {
            try {
                // Ensure content script is present in all frames (e.g. iframes in Copilot)
                await ext.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    files: ['content.js']
                });
                
                // Call injection function across frames
                const results = await ext.scripting.executeScript({
                    target: { tabId: tab.id, allFrames: true },
                    func: (text, send) => window.injectCopilotPrompt && window.injectCopilotPrompt(text, send),
                    args: [prompt.content, autoSend]
                });
                
                const success = results && results.some(r => r.result === true);
                if (success) {
                    console.log(`[PromptDock] Prompt ${index} injected via shortcut.`);
                } else {
                    // --- 4. Fallback: Copy to Clipboard and Notify User ---
                    console.log(`[PromptDock] Input field not found for prompt ${index}, falling back to clipboard.`);
                    await ext.scripting.executeScript({
                        target: { tabId: tab.id }, // main frame only
                        func: async (text) => {
                            let message = "Eingabefeld nicht gefunden – in die Zwischenablage kopiert!";
                            let bgColor = "#d2691e";
                            try {
                                await navigator.clipboard.writeText(text);
                            } catch (err) {
                                console.error("[PromptDock] Clipboard write failed:", err);
                                message = "Fehler: Zwischenablage nicht verfügbar";
                                bgColor = "#e54d51";
                            }
                            
                            // Create elegant floating toast
                            const toast = document.createElement("div");
                            toast.innerText = message;
                            Object.assign(toast.style, {
                                position: "fixed",
                                bottom: "20px",
                                right: "20px",
                                backgroundColor: bgColor,
                                color: "white",
                                padding: "12px 20px",
                                borderRadius: "8px",
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                fontSize: "14px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: "999999",
                                transition: "opacity 0.3s ease-in-out",
                                opacity: "0"
                            });
                            document.body.appendChild(toast);
                            
                            // Fade in
                            requestAnimationFrame(() => {
                                toast.style.opacity = "1";
                            });
                            
                            // Fade out and remove
                            setTimeout(() => {
                                toast.style.opacity = "0";
                                setTimeout(() => toast.remove(), 300);
                            }, 3000);
                        },
                        args: [prompt.content]
                    });
                }
            } catch (e) {
                console.error("[PromptDock] Failed to inject via shortcut:", e);
            }
        }
    }
});


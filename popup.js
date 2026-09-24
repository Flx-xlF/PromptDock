/**
 * PromptDock — Popup Controller
 * 
 * Manages the extension popup UI:
 * 1. Prompt Management: CRUD operations with live byte counting against chrome.storage.sync quotas.
 * 2. Storage Architecture: Chunked sync storage ('p_<id>') with automatic migration from legacy keys.
 * 3. Mobile Sync: Direct HTTPS integration with GitHub Gists for iOS Apple Shortcuts sync.
 * 4. Backup & Restore: JSON file export and import with schema validation.
 * 5. Prompt Execution: Injects prompts into the active tab or triggers clipboard fallback.
 */

import { ext, StorageAdapter, PROMPT_KEY_PREFIX, ORDER_KEY } from './shared/browser-compat.js';

const DEFAULT_PROMPTS = [
  {
    "id": "1",
    "name": "TL;DR & Kernpunkte",
    "content": "Analysiere den folgenden Text und fasse die wichtigsten Erkenntnisse in 3 prägnanten Bulletpoints zusammen. Hebe konkrete Handlungsfelder und Entscheidungsbedarfe hervor.",
    "autoSend": false
  },
  {
    "id": "2",
    "name": "E-Mail beantworten",
    "content": "Formuliere eine professionelle, klare und wertschätzende Antwort auf die vorliegende Nachricht. Beantworte alle Kernfragen direkt und schlage konkrete nächste Schritte vor.",
    "autoSend": false
  },
  {
    "id": "3",
    "name": "Meeting Action Items",
    "content": "Extrahiere aus diesem Verlauf:\n1. Getroffene Beschlüsse\n2. Konkrete Action Items (Wer macht was bis wann?)\n3. Noch offene Fragen oder Risiken.",
    "autoSend": false
  },
  {
    "id": "4",
    "name": "Text optimieren (Prägnanz)",
    "content": "Überarbeite den folgenden Entwurf: Entferne Füllwörter und Phrasen, stärke die Argumentation und mache die Sätze maximal prägnant. Behalte einen sachlichen Ton bei.",
    "autoSend": false
  },
  {
    "id": "5",
    "name": "Kritischer Sparringspartner",
    "content": "Nimm die Rolle eines anspruchsvollen Kritikers ein. Prüfe die vorliegende Argumentation auf logische Lücken, unausgesprochene Annahmen und potenzielle Risiken.",
    "autoSend": false
  },
  {
    "id": "6",
    "name": "Executive Summary",
    "content": "Erstelle ein 1-minütiges Briefing für das Management: Was ist das Thema? Warum ist es jetzt relevant? Welche Handlungsempfehlung gibst du ab?",
    "autoSend": false
  }
];

const PromptStorage = {
    /** Load prompts, migrating from legacy formats if needed. */
    async load() {
        const allSync = await StorageAdapter.get(null);

        // 1. New chunked format — preferred path
        if (allSync[ORDER_KEY]) {
            const order = allSync[ORDER_KEY];
            return order
                .map(id => allSync[PROMPT_KEY_PREFIX + id])
                .filter(Boolean);
        }

        // 2. Legacy: all prompts in one sync key ('prompts')
        if (allSync.prompts && allSync.prompts.length > 0) {
            const legacy = allSync.prompts;
            await this.save(legacy);                       // migrate
            await StorageAdapter.remove('prompts');   // clean up
            console.log('[PromptDock] Migrated from legacy sync format.');
            return legacy;
        }

        // 3. Legacy: all prompts in one local key (from previous fix)
        const localData = await ext.storage.local.get('prompts');
        if (localData.prompts && localData.prompts.length > 0) {
            const legacy = localData.prompts;
            await this.save(legacy);                        // migrate to sync
            await ext.storage.local.remove('prompts');   // clean up
            console.log('[PromptDock] Migrated from legacy local format.');
            return legacy;
        }

        return null; // no stored data — caller should use defaults
    },

    /** Persist the full prompts array (sync, chunked). */
    async save(prompts) {
        // Build a batch write: order array + one key per prompt
        const batch = {};
        batch[ORDER_KEY] = prompts.map(p => p.id);
        for (const p of prompts) {
            batch[PROMPT_KEY_PREFIX + p.id] = { id: p.id, name: p.name, content: p.content, autoSend: !!p.autoSend };
        }

        // Remove orphaned prompt keys that are no longer in the list
        const allData = await StorageAdapter.get(null);
        const activeKeys = new Set(prompts.map(p => PROMPT_KEY_PREFIX + p.id));
        const orphans = Object.keys(allData).filter(k =>
            k.startsWith(PROMPT_KEY_PREFIX) && !activeKeys.has(k)
        );
        if (orphans.length > 0) {
            await StorageAdapter.remove(orphans);
        }

        await StorageAdapter.set(batch);
        
        // Trigger background Gist sync if configured
        this.syncGist(prompts).catch(console.error);
    },
    
    /** Sync prompts to a Secret GitHub Gist. */
    async syncGist(prompts) {
        const local = await ext.storage.local.get(['github_pat', 'github_gist_id']);
        const token = local.github_pat;
        if (!token) return; // Sync not configured
        
        // Format as a flat dictionary { "Prompt Name": "Prompt Content" } 
        // This allows the iOS "Choose from List" action to natively display beautiful names 
        // and return the text content automatically!
        const mobileFormat = {};
        prompts.forEach(p => {
            mobileFormat[p.name] = p.content;
        });
        
        const fileContent = JSON.stringify(mobileFormat, null, 2);
        const payload = {
            description: "PromptDock Prompts Sync",
            public: false,
            files: {
                "prompts": { content: fileContent } // New dot-less file for iOS
            }
        };
        
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        };

        if (local.github_gist_id) {
            // Update existing Gist
            const res = await fetch(`https://api.github.com/gists/${local.github_gist_id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Gist Update failed: " + res.status);
        } else {
            // Create new Gist
            const res = await fetch("https://api.github.com/gists", {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Gist Creation failed: " + res.status);
            const data = await res.json();
            await ext.storage.local.set({ github_gist_id: data.id });
        }
    }
};

// ---------------------------------------------------------------------------
// Byte-size helpers — mirrors chrome.storage.sync measurement
// Chrome measures: key.length + JSON.stringify(value) byte size (UTF-8)
// ---------------------------------------------------------------------------
const QUOTA_BYTES_PER_ITEM = 8192;  // chrome.storage.sync per-item limit
const QUOTA_BYTES_TOTAL = 102400;   // chrome.storage.sync total limit

/** Calculate the byte size a prompt would occupy in chrome.storage.sync. */
function calcPromptBytes(prompt) {
    const key = PROMPT_KEY_PREFIX + prompt.id;
    const value = { id: prompt.id, name: prompt.name, content: prompt.content, autoSend: !!prompt.autoSend };
    const jsonStr = JSON.stringify(value);
    // Blob gives us the true UTF-8 byte length (handles umlauts, emoji, etc.)
    return key.length + new Blob([jsonStr]).size;
}

/** Estimate total bytes used across all sync storage items. */
function calcTotalBytes(promptsList) {
    let total = 0;
    // Order key
    const orderValue = JSON.stringify(promptsList.map(p => p.id));
    total += ORDER_KEY.length + new Blob([orderValue]).size;
    // Each prompt
    for (const p of promptsList) {
        total += calcPromptBytes(p);
    }
    return total;
}


let prompts = [];
let editingIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
    // Load prompts (with migration from legacy formats)
    const loaded = await PromptStorage.load();
    if (loaded && loaded.length > 0) {
        prompts = loaded;
    } else {
        prompts = [...DEFAULT_PROMPTS];
        await PromptStorage.save(prompts);
    }
    
    renderPrompts();
    
    // UI Event Listeners
    const nameInput = document.getElementById('prompt-name');
    const contentInput = document.getElementById('prompt-content');
    const charCounter = document.getElementById('char-counter');
    
    updateCharCounter = function() {
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();
        const autoSend = document.getElementById('prompt-auto-send').checked;
        // Use actual id when editing, or a placeholder id (13 chars like Date.now()) for new
        const id = editingIndex >= 0 ? prompts[editingIndex].id : '0000000000000';
        
        const mockPrompt = { id, name: name || 'x', content, autoSend };
        const usedBytes = calcPromptBytes(mockPrompt);
        const remainingBytes = QUOTA_BYTES_PER_ITEM - usedBytes;
        const charCount = content.length;
        
        charCounter.textContent = `${charCount} Zeichen · ${usedBytes} / ${QUOTA_BYTES_PER_ITEM} Bytes`;
        
        if (remainingBytes < 0) {
            charCounter.classList.add('over-limit');
            document.getElementById('save-btn').disabled = true;
        } else {
            charCounter.classList.remove('over-limit');
            document.getElementById('save-btn').disabled = false;
        }
    };
    
    contentInput.addEventListener('input', updateCharCounter);
    nameInput.addEventListener('input', updateCharCounter);

    document.getElementById('toggle-add-btn').addEventListener('click', () => {
        document.getElementById('add-form').classList.remove('hidden');
        document.getElementById('toggle-add-btn').classList.add('hidden');
        document.getElementById('save-btn').innerText = 'Speichern';
        updateCharCounter();
    });
    
    document.getElementById('cancel-add-btn').addEventListener('click', () => {
        document.getElementById('add-form').classList.add('hidden');
        document.getElementById('toggle-add-btn').classList.remove('hidden');
        document.getElementById('prompt-name').value = '';
        document.getElementById('prompt-content').value = '';
        document.getElementById('prompt-auto-send').checked = false;
        editingIndex = -1;
        document.getElementById('save-btn').innerText = 'Speichern';
        updateCharCounter();
    });
    
    document.getElementById('save-btn').addEventListener('click', async () => {
        const name = document.getElementById('prompt-name').value.trim();
        const content = document.getElementById('prompt-content').value.trim();
        const autoSend = document.getElementById('prompt-auto-send').checked;
        
        if (name && content) {
            if (editingIndex >= 0) {
                // Update existing
                prompts[editingIndex].name = name;
                prompts[editingIndex].content = content;
                prompts[editingIndex].autoSend = autoSend;
            } else {
                // Add new
                prompts.push({
                    id: Date.now().toString(),
                    name,
                    content,
                    autoSend
                });
            }
            try {
                await PromptStorage.save(prompts);
            } catch (err) {
                alert("Fehler beim Speichern: Speicherlimit erreicht. Bitte löschen Sie alte Prompts.");
                // Revert changes in local array
                if (editingIndex < 0) {
                    prompts.pop();
                }
                return;
            }
            
            document.getElementById('cancel-add-btn').click();
            renderPrompts();
        }
    });

    // Import / Export Event Listeners
    document.getElementById('export-btn').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "prompts_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (!Array.isArray(imported)) {
                    alert("Ungültiges Format: Datei muss ein JSON-Array sein.");
                    return;
                }
                // Schema validation: each item must have string name and content
                const valid = imported.every(item =>
                    item && typeof item.name === 'string' && typeof item.content === 'string'
                );
                if (!valid) {
                    alert("Ungültiges Format: Jeder Eintrag muss 'name' und 'content' (Strings) enthalten.");
                    return;
                }
                // Sanitize: only keep known fields
                const sanitized = imported.map(item => ({
                    id: typeof item.id === 'string' ? item.id : Date.now().toString() + Math.random(),
                    name: item.name,
                    content: item.content,
                    autoSend: typeof item.autoSend === 'boolean' ? item.autoSend : false
                }));
                prompts = [...prompts, ...sanitized];
                await PromptStorage.save(prompts);
                renderPrompts();
            } catch (err) {
                alert("Fehler beim Importieren: " + err);
            }
            e.target.value = ''; // Reset
        };
        reader.readAsText(file);
    });

    // Mobile Sync Modal Event Listeners
    const syncModal = document.getElementById('sync-modal');
    const patInput = document.getElementById('github-pat-input');
    const syncStatus = document.getElementById('sync-status');
    const saveSyncBtn = document.getElementById('save-sync-btn');
    
    document.getElementById('mobile-sync-btn').addEventListener('click', async () => {
        const local = await ext.storage.local.get(['github_pat', 'github_gist_id']);
        if (local.github_pat) {
            patInput.value = local.github_pat;
        } else {
            patInput.value = '';
        }
        
        syncStatus.className = 'sync-status hidden';
        if (local.github_gist_id) {
            syncStatus.innerHTML = `<strong>Status:</strong> Verbunden ✅<br><br><strong>Shortcut API URL:</strong><br><a href="https://api.github.com/gists/${local.github_gist_id}" target="_blank" style="color:var(--accent);word-break:break-all;">https://api.github.com/gists/${local.github_gist_id}</a><br><br><span style="font-size:10px;color:var(--text-tertiary);">Nutze diese URL im Apple Shortcut mit der "Inhalte von URL abrufen" Aktion (Header: Authorization = Bearer PAT).</span>`;
            syncStatus.className = 'sync-status success';
        }
        
        syncModal.classList.remove('hidden');
    });

    document.getElementById('close-sync-btn').addEventListener('click', () => {
        syncModal.classList.add('hidden');
    });

    saveSyncBtn.addEventListener('click', async () => {
        const pat = patInput.value.trim();
        if (!pat) {
            await ext.storage.local.remove(['github_pat', 'github_gist_id']);
            syncStatus.textContent = "Sync deaktiviert.";
            syncStatus.className = 'sync-status';
            setTimeout(() => syncModal.classList.add('hidden'), 1000);
            return;
        }
        
        saveSyncBtn.textContent = 'Synchronisiere...';
        saveSyncBtn.disabled = true;
        
        try {
            const local = await ext.storage.local.get('github_pat');
            // If token changed, clear gist ID to force a new one
            if (local.github_pat !== pat) {
                await ext.storage.local.remove('github_gist_id');
            }
            
            await ext.storage.local.set({ github_pat: pat });
            
            // Force a sync right now
            await PromptStorage.syncGist(prompts);
            
            const updatedLocal = await ext.storage.local.get('github_gist_id');
            syncStatus.innerHTML = `<strong>Erfolgreich synchronisiert! ✅</strong><br><br><strong>Shortcut API URL:</strong><br><a href="https://api.github.com/gists/${updatedLocal.github_gist_id}" target="_blank" style="color:var(--accent);word-break:break-all;">https://api.github.com/gists/${updatedLocal.github_gist_id}</a>`;
            syncStatus.className = 'sync-status success';
        } catch (err) {
            console.error(err);
            syncStatus.textContent = "Fehler: " + err.message;
            syncStatus.className = 'sync-status error';
        } finally {
            saveSyncBtn.textContent = 'Verbinden';
            saveSyncBtn.disabled = false;
        }
    });

    // Ensure external links open cleanly in a new browser tab from the popup
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="http"]');
        if (link) {
            e.preventDefault();
            ext.tabs.create({ url: link.href });
        }
    });
});

let shortcutMap = {};

/** Update the global storage usage bar in the footer. */
function updateGlobalStorage() {
    const el = document.getElementById('global-storage');
    if (!el) return;
    const usedBytes = calcTotalBytes(prompts);
    const pct = Math.round((usedBytes / QUOTA_BYTES_TOTAL) * 100);
    const usedKB = (usedBytes / 1024).toFixed(1);
    const totalKB = (QUOTA_BYTES_TOTAL / 1024).toFixed(0);
    el.textContent = `Speicher: ${usedKB} / ${totalKB} KB (${pct}%)`;
    if (pct > 80) {
        el.classList.add('storage-warning');
    } else {
        el.classList.remove('storage-warning');
    }
}

// Hoisted reference so edit-btn handler inside renderPrompts can call it
let updateCharCounter = () => {};

async function renderPrompts() {
    // Fetch shortcuts
    const commands = await ext.commands.getAll();
    commands.forEach(cmd => {
        if (cmd.name.startsWith("run-prompt-") && cmd.shortcut) {
            const idx = parseInt(cmd.name.replace("run-prompt-", ""));
            shortcutMap[idx] = cmd.shortcut;
        }
    });

    const list = document.getElementById('prompts-list');
    list.innerHTML = '';
    
    prompts.forEach((prompt, index) => {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        div.setAttribute('draggable', 'true');
        div.setAttribute('data-index', index);
        
        // Build header safely using DOM APIs to prevent XSS (#4)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'prompt-header';
        
        const leftDiv = document.createElement('div');
        leftDiv.style.cssText = 'display:flex; align-items:center;';
        
        const dragSpan = document.createElement('span');
        dragSpan.className = 'drag-handle';
        dragSpan.title = 'Ziehen zum Sortieren';
        dragSpan.textContent = '≡';
        leftDiv.appendChild(dragSpan);
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'prompt-name';
        nameSpan.textContent = prompt.name;
        leftDiv.appendChild(nameSpan);
        
        if (shortcutMap[index]) {
            const shortcutSpan = document.createElement('span');
            shortcutSpan.style.cssText = 'font-size: 10px; color: var(--text-secondary); margin-left: 8px; background: var(--bg-color); padding: 2px 4px; border-radius: 4px;';
            shortcutSpan.textContent = shortcutMap[index];
            leftDiv.appendChild(shortcutSpan);
        }
        
        if (prompt.autoSend) {
            const autoSendSpan = document.createElement('span');
            autoSendSpan.title = 'Automatisch absenden';
            autoSendSpan.style.cssText = 'color:var(--accent-color); font-size: 14px; margin-left: 6px;';
            autoSendSpan.textContent = '⚡';
            leftDiv.appendChild(autoSendSpan);
        }
        
        headerDiv.appendChild(leftDiv);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'prompt-actions';
        
        const runBtn = document.createElement('button');
        runBtn.className = 'run-btn';
        runBtn.setAttribute('data-index', index);
        runBtn.textContent = 'Ausführen';
        actionsDiv.appendChild(runBtn);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.setAttribute('data-index', index);
        editBtn.textContent = '✎';
        actionsDiv.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('data-index', index);
        deleteBtn.textContent = '×';
        actionsDiv.appendChild(deleteBtn);
        
        headerDiv.appendChild(actionsDiv);
        div.appendChild(headerDiv);
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'prompt-preview';
        previewDiv.textContent = prompt.content;
        div.appendChild(previewDiv);
        
        list.appendChild(div);
    });
    
    // Update global storage indicator
    updateGlobalStorage();
    
    // Add event listeners to the new buttons
    document.querySelectorAll('.run-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            runPrompt(prompts[index].content, e.target);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.target.getAttribute('data-index');
            editingIndex = parseInt(index);
            
            document.getElementById('prompt-name').value = prompts[index].name;
            document.getElementById('prompt-content').value = prompts[index].content;
            document.getElementById('prompt-auto-send').checked = !!prompts[index].autoSend;
            
            document.getElementById('add-form').classList.remove('hidden');
            document.getElementById('toggle-add-btn').classList.add('hidden');
            document.getElementById('save-btn').innerText = 'Aktualisieren';
            
            // Update byte counter directly
            updateCharCounter();
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Prompt wirklich löschen?")) {
                const index = e.target.getAttribute('data-index');
                prompts.splice(index, 1);
                await PromptStorage.save(prompts);
                renderPrompts();
            }
        });
    });
}

async function runPrompt(content, buttonEl) {
    // Get active tab
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    
    let isSupported = false;
    try {
        const urlObj = new URL(tab.url);
        const validHosts = ['outlook.cloud.microsoft', 'm365.cloud.microsoft', 'teams.microsoft.com', 'outlook.office.com', 'outlook.office365.com', 'outlook.live.com', 'outlook.com', 'gemini.google.com'];
        isSupported = validHosts.some(h => urlObj.hostname === h || urlObj.hostname.endsWith('.' + h));
    } catch (e) {
        // Invalid URL
    }
    
    if (isSupported) {
        // Change button to show loading state
        const oldText = buttonEl.innerText;
        buttonEl.innerText = "Läuft...";
        
        try {
            // Inject the content.js file first
            await ext.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                files: ['content.js']
            });
            
            // Execute the injected function across ALL frames in the tab
            const results = await ext.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                func: (text) => window.injectCopilotPrompt && window.injectCopilotPrompt(text),
                args: [content]
            });
            
            // Check if any frame successfully found and injected the prompt
            const success = results && results.some(r => r.result === true);
            
            if (success) {
                buttonEl.innerText = "Erfolgreich eingefügt!";
                buttonEl.style.backgroundColor = "#107c10"; // Success green color
                setTimeout(() => {
                    try {
                        window.close(); // Close the popup after success (Chrome)
                    } catch (e) {}
                    // Firefox fallback: visually indicate completion if window doesn't close
                    buttonEl.innerText = "Fertig ✓";
                    buttonEl.style.opacity = "0.8";
                }, 1500);
            } else {
                try {
                    await navigator.clipboard.writeText(content);
                    buttonEl.innerText = "In Zwischenablage kopiert ✓";
                    buttonEl.style.backgroundColor = "#d2691e"; // Orange
                } catch (e) {
                    console.error("Clipboard write failed:", e);
                    buttonEl.innerText = "Fehler – bitte manuell kopieren";
                    buttonEl.style.backgroundColor = "#e54d51"; // Red
                }
            }
        } catch (e) {
            console.error(e);
            buttonEl.innerText = "Error";
            setTimeout(() => { buttonEl.innerText = oldText; }, 2000);
        }
    } else {
        alert("Bitte öffne Outlook oder Gemini im aktuellen Tab, um einen Prompt auszuführen.");
    }
}

// --- Drag and Drop Logic ---
let draggedItem = null;
let dragStartIndex = -1;

document.getElementById('prompts-list').addEventListener('dragstart', (e) => {
    if (e.target.className.includes('prompt-item')) {
        draggedItem = e.target;
        dragStartIndex = parseInt(draggedItem.getAttribute('data-index'));
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }
});

document.getElementById('prompts-list').addEventListener('dragend', async (e) => {
    e.target.classList.remove('dragging');
    draggedItem = null;
});

document.getElementById('prompts-list').addEventListener('dragover', (e) => {
    e.preventDefault();
    const list = document.getElementById('prompts-list');
    const afterElement = getDragAfterElement(list, e.clientY);
    const currentDrag = document.querySelector('.dragging');
    if (afterElement == null) {
        list.appendChild(currentDrag);
    } else {
        list.insertBefore(currentDrag, afterElement);
    }
});

document.getElementById('prompts-list').addEventListener('drop', async (e) => {
    e.preventDefault();
    if (dragStartIndex === -1) return;
    
    // Calculate new order
    const currentItems = [...document.getElementById('prompts-list').querySelectorAll('.prompt-item')];
    const newOrderIndices = currentItems.map(item => parseInt(item.getAttribute('data-index')));
    
    // Reorder the array
    const newPrompts = newOrderIndices.map(idx => prompts[idx]);
    prompts = newPrompts;
    
    await PromptStorage.save(prompts);
    renderPrompts();
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.prompt-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

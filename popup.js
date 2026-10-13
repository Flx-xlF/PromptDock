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

const Catalog = globalThis.PromptDockCatalog;

const DEFAULT_PROMPTS = (Catalog && Catalog.RECIPES && Catalog.RECIPES.length > 0)
  ? Catalog.RECIPES.map((r, i) => ({
      id: (i + 1).toString(),
      name: r.name,
      recipeId: r.id,
      content: Catalog.compileExpress(r),
      autoSend: false
    }))
  : [
      {
        "id": "1",
        "name": "Medienanfrage",
        "recipeId": "recipe-medienanfrage",
        "content": "MEDIENANFRAGE: ANALYSE\n\nTASK 1: INHALTS-ANALYSE...",
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
            syncStatus.replaceChildren();
            const s1 = document.createElement('strong');
            s1.textContent = 'Status:';
            syncStatus.appendChild(s1);
            syncStatus.appendChild(document.createTextNode(' Verbunden'));
            syncStatus.appendChild(document.createElement('br'));
            syncStatus.appendChild(document.createElement('br'));
            const s2 = document.createElement('strong');
            s2.textContent = 'Shortcut API URL:';
            syncStatus.appendChild(s2);
            syncStatus.appendChild(document.createElement('br'));
            const link = document.createElement('a');
            link.href = `https://api.github.com/gists/${local.github_gist_id}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.cssText = 'color:var(--accent);word-break:break-all;';
            link.textContent = `https://api.github.com/gists/${local.github_gist_id}`;
            syncStatus.appendChild(link);
            syncStatus.appendChild(document.createElement('br'));
            syncStatus.appendChild(document.createElement('br'));
            const note = document.createElement('span');
            note.style.cssText = 'font-size:10px;color:var(--text-tertiary);';
            note.textContent = 'Nutze diese URL im Apple Shortcut mit der "Inhalte von URL abrufen" Aktion (Header: Authorization = Bearer PAT).';
            syncStatus.appendChild(note);
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
            syncStatus.replaceChildren();
            const s1 = document.createElement('strong');
            s1.textContent = 'Erfolgreich synchronisiert! ✓';
            syncStatus.appendChild(s1);
            syncStatus.appendChild(document.createElement('br'));
            syncStatus.appendChild(document.createElement('br'));
            const s2 = document.createElement('strong');
            s2.textContent = 'Shortcut API URL:';
            syncStatus.appendChild(s2);
            syncStatus.appendChild(document.createElement('br'));
            const link = document.createElement('a');
            link.href = `https://api.github.com/gists/${updatedLocal.github_gist_id}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.cssText = 'color:var(--accent);word-break:break-all;';
            link.textContent = `https://api.github.com/gists/${updatedLocal.github_gist_id}`;
            syncStatus.appendChild(link);
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

    // Recipe Variable Modal Event Listeners
    const varModal = document.getElementById('recipe-var-modal');
    const cancelVarBtn = document.getElementById('cancel-var-btn');
    if (cancelVarBtn) {
        cancelVarBtn.addEventListener('click', () => {
            if (varModal) varModal.classList.add('hidden');
            currentPendingRecipeExecution = null;
        });
    }

    const startVarBtn = document.getElementById('start-var-btn');
    if (startVarBtn) {
        startVarBtn.addEventListener('click', () => {
            if (!currentPendingRecipeExecution) return;
            const { recipe, buttonEl, tab } = currentPendingRecipeExecution;
            const varFields = document.getElementById('var-modal-fields');
            const mode = document.getElementById('var-modal-mode').value;

            const variableValues = {};
            varFields.querySelectorAll('.var-input-field').forEach(input => {
                const key = input.dataset.varKey;
                if (key) {
                    variableValues[key] = input.value.trim() || input.placeholder;
                }
            });

            if (varModal) varModal.classList.add('hidden');
            executeRecipe(recipe, { mode, variableValues }, buttonEl, tab);
            currentPendingRecipeExecution = null;
        });
    }

    // Search input listener
    const searchInput = document.getElementById('prompt-search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.trim().toLowerCase();
            if (searchClearBtn) {
                searchClearBtn.classList.toggle('hidden', currentSearchQuery.length === 0);
            }
            renderPrompts();
        });

        // Global hotkey: Cmd+K / Ctrl+K to jump to search
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            } else if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.value = '';
                currentSearchQuery = '';
                if (searchClearBtn) searchClearBtn.classList.add('hidden');
                renderPrompts();
            }
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            currentSearchQuery = '';
            searchClearBtn.classList.add('hidden');
            renderPrompts();
        });
    }

    // Category filter pills
    const filterBar = document.getElementById('category-filter-bar');
    if (filterBar) {
        filterBar.addEventListener('click', (e) => {
            const pill = e.target.closest('.cat-pill');
            if (!pill) return;
            filterBar.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategoryFilter = pill.dataset.cat || 'all';
            renderPrompts();
        });
    }

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
let currentPendingRecipeExecution = null;
let currentSearchQuery = '';
let currentCategoryFilter = 'all';

function normalizeSlug(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findMatchingRecipe(prompt) {
    if (!Catalog || !Catalog.RECIPES) return null;
    const pSlug = normalizeSlug(prompt.recipeId || prompt.name);
    return Catalog.RECIPES.find(r => 
        normalizeSlug(r.id) === pSlug || 
        normalizeSlug(r.name) === pSlug ||
        r.id === prompt.recipeId ||
        r.name.toLowerCase() === (prompt.name || '').toLowerCase()
    );
}

function getRecipeWorkflowSummary(recipe, fallbackContent) {
    if (recipe && recipe.turns && recipe.turns.length > 0) {
        return recipe.turns.map(t => t.title).join(' ➔ ');
    }
    return (fallbackContent || '').replace(/\s+/g, ' ').slice(0, 60);
}

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
    list.replaceChildren();
    
    // Filter by search query and category
    const filteredPrompts = prompts.map((p, originalIdx) => ({ prompt: p, originalIdx })).filter(({ prompt }) => {
        const matchedRecipe = findMatchingRecipe(prompt);
        
        // 1. Category Filter
        if (currentCategoryFilter !== 'all') {
            if (currentCategoryFilter === 'custom') {
                if (matchedRecipe) return false;
            } else {
                if (!matchedRecipe || matchedRecipe.family !== currentCategoryFilter) return false;
            }
        }

        // 2. Search Query Filter
        if (currentSearchQuery) {
            const nameMatch = (prompt.name || '').toLowerCase().includes(currentSearchQuery);
            const contentMatch = (prompt.content || '').toLowerCase().includes(currentSearchQuery);
            const recipeMatch = matchedRecipe && (
                matchedRecipe.name.toLowerCase().includes(currentSearchQuery) ||
                matchedRecipe.turns.some(t => t.title.toLowerCase().includes(currentSearchQuery))
            );
            if (!nameMatch && !contentMatch && !recipeMatch) return false;
        }

        return true;
    });

    if (filteredPrompts.length === 0) {
        const emptyNotice = document.createElement('div');
        emptyNotice.style.cssText = 'padding: 24px 12px; text-align: center; color: var(--text-tertiary); font-size: 12px;';
        emptyNotice.textContent = currentSearchQuery 
            ? `Keine Prompts für "${currentSearchQuery}" gefunden.` 
            : 'Keine Prompts in dieser Kategorie.';
        list.appendChild(emptyNotice);
        updateGlobalStorage();
        return;
    }

    filteredPrompts.forEach(({ prompt, originalIdx }) => {
        const div = document.createElement('div');
        div.className = 'prompt-item';
        const isFiltered = currentSearchQuery !== '' || currentCategoryFilter !== 'all';
        div.setAttribute('draggable', isFiltered ? 'false' : 'true');
        div.setAttribute('data-index', originalIdx);
        const matchedRecipe = findMatchingRecipe(prompt);
        if (matchedRecipe && matchedRecipe.turns && matchedRecipe.turns.length > 0) {
            div.title = `Klicken, um ${matchedRecipe.turns.length}-Schritte Workflow zu starten (Turn 1: ${matchedRecipe.turns[0].title})`;
        } else {
            div.title = 'Klicken zum Ausführen';
        }

        // Whole row is clickable to launch!
        div.addEventListener('click', (e) => {
            if (e.target.closest('.action-icon-btn') || e.target.closest('.drag-handle')) {
                return;
            }
            handlePromptRun(originalIdx, div);
        });
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'prompt-header';
        
        const leftDiv = document.createElement('div');
        leftDiv.className = 'prompt-left';
        
        const dragSpan = document.createElement('span');
        dragSpan.className = 'drag-handle';
        if (isFiltered) {
            dragSpan.style.display = 'none';
        } else {
            dragSpan.title = 'Ziehen zum Sortieren';
            dragSpan.textContent = '≡';
        }
        leftDiv.appendChild(dragSpan);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'prompt-name';
        nameSpan.textContent = prompt.name;
        leftDiv.appendChild(nameSpan);

        if (matchedRecipe && matchedRecipe.turns && matchedRecipe.turns.length > 0) {
            const turnBadge = document.createElement('span');
            turnBadge.className = 'recipe-turn-badge';
            turnBadge.title = `${matchedRecipe.turns.length}-Schritte Workflow mit Rail & Checkpoints`;
            turnBadge.textContent = `${matchedRecipe.turns.length} Turns`;
            leftDiv.appendChild(turnBadge);
        }
        
        if (shortcutMap[originalIdx]) {
            const shortcutSpan = document.createElement('span');
            shortcutSpan.className = 'shortcut-pill';
            shortcutSpan.textContent = shortcutMap[originalIdx];
            leftDiv.appendChild(shortcutSpan);
        }
        
        if (prompt.autoSend) {
            const autoSendSpan = document.createElement('span');
            autoSendSpan.title = 'Automatisch absenden';
            autoSendSpan.className = 'auto-send-badge';
            autoSendSpan.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
            leftDiv.appendChild(autoSendSpan);
        }
        
        headerDiv.appendChild(leftDiv);
        
        // Hover actions strip
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'prompt-actions';
        
        const playHint = document.createElement('span');
        playHint.className = 'play-hint-icon';
        playHint.title = 'Ausführen';
        playHint.innerHTML = '<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
        actionsDiv.appendChild(playHint);

        const editBtn = document.createElement('button');
        editBtn.className = 'action-icon-btn';
        editBtn.title = 'Bearbeiten';
        editBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editingIndex = originalIdx;
            document.getElementById('prompt-name').value = prompt.name;
            document.getElementById('prompt-content').value = prompt.content;
            document.getElementById('prompt-auto-send').checked = !!prompt.autoSend;
            document.getElementById('add-form').classList.remove('hidden');
            document.getElementById('toggle-add-btn').classList.add('hidden');
            document.getElementById('save-btn').innerText = 'Aktualisieren';
            updateCharCounter();
        });
        actionsDiv.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-icon-btn delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Löschen';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Prompt "${prompt.name}" wirklich löschen?`)) {
                prompts.splice(originalIdx, 1);
                await PromptStorage.save(prompts);
                renderPrompts();
            }
        });
        actionsDiv.appendChild(deleteBtn);
        
        headerDiv.appendChild(actionsDiv);
        div.appendChild(headerDiv);
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'prompt-preview';
        previewDiv.textContent = getRecipeWorkflowSummary(matchedRecipe, prompt.content);
        div.appendChild(previewDiv);
        
        list.appendChild(div);
    });
    
    // Update global storage indicator
    updateGlobalStorage();
}

function isSupportedTabUrl(url) {
    if (!url) return false;
    try {
        const urlObj = new URL(url);
        const validHosts = [
            'outlook.cloud.microsoft',
            'm365.cloud.microsoft',
            'teams.microsoft.com',
            'outlook.office.com',
            'outlook.office365.com',
            'outlook.live.com',
            'outlook.com',
            'copilot.microsoft.com',
            'copilot.cloud.microsoft',
            'gemini.google.com',
            'chatgpt.com',
            'chat.openai.com',
            'claude.ai'
        ];
        return validHosts.some(h => urlObj.hostname === h || urlObj.hostname.endsWith('.' + h));
    } catch (e) {
        return false;
    }
}

async function handlePromptRun(index, buttonEl) {
    const prompt = prompts[index];
    if (!prompt) return;

    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    if (!tab || !isSupportedTabUrl(tab.url)) {
        alert("Bitte öffne einen unterstützten KI-Chat (Copilot, Gemini, ChatGPT oder Claude) im aktuellen Tab, um einen Prompt auszuführen.");
        return;
    }

    const matchedRecipe = findMatchingRecipe(prompt);

    if (matchedRecipe && matchedRecipe.variables && matchedRecipe.variables.length > 0) {
        openVariableModal(matchedRecipe, prompt, buttonEl, tab);
    } else if (matchedRecipe) {
        executeRecipe(matchedRecipe, { mode: 'guided', variableValues: {} }, buttonEl, tab);
    } else {
        runPrompt(prompt.content, buttonEl);
    }
}

function openVariableModal(recipe, prompt, buttonEl, tab) {
    const varModal = document.getElementById('recipe-var-modal');
    const varTitle = document.getElementById('var-modal-title');
    const varFields = document.getElementById('var-modal-fields');
    const varMode = document.getElementById('var-modal-mode');

    varTitle.textContent = `${recipe.name} konfigurieren`;
    varFields.replaceChildren();
    varMode.value = 'guided';

    recipe.variables.forEach(v => {
        const group = document.createElement('div');
        group.style.cssText = 'display:flex; flex-direction:column; gap:4px;';

        const label = document.createElement('label');
        label.style.cssText = 'font-size:11px; font-weight:600; color:var(--text-secondary);';
        label.textContent = v.name + (v.description ? ` (${v.description})` : '');
        group.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'var-input-field';
        input.dataset.varKey = v.name;
        input.placeholder = v.placeholder || v.default || '';
        if (v.default) input.value = v.default;
        group.appendChild(input);

        varFields.appendChild(group);
    });

    currentPendingRecipeExecution = { recipe, buttonEl, tab };
    varModal.classList.remove('hidden');

    const firstInput = varFields.querySelector('input');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

async function executeRecipe(recipe, options, cardEl, tab) {
    if (!tab) {
        const tabs = await ext.tabs.query({ active: true, currentWindow: true });
        tab = tabs[0];
    }
    if (!tab) return;

    if (cardEl) {
        cardEl.style.opacity = '0.7';
        const playHint = cardEl.querySelector('.play-hint-icon');
        if (playHint) playHint.innerHTML = '<span class="pd-spinner-sm"></span>';
    }

    try {
        await ext.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ['shared/recipe-catalog.js', 'content.js']
        });

        const results = await ext.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            func: (recId, opts) => {
                if (window.startPromptDockRecipe) {
                    return window.startPromptDockRecipe(recId, opts);
                }
                return false;
            },
            args: [recipe.id, options]
        });

        const success = results && results.some(r => r.result === true);
        if (success) {
            if (cardEl) {
                cardEl.style.borderColor = "#107c10";
                cardEl.style.backgroundColor = "rgba(16, 124, 16, 0.15)";
                const playHint = cardEl.querySelector('.play-hint-icon');
                if (playHint) playHint.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            setTimeout(() => {
                try { window.close(); } catch (e) {}
            }, 700);
        } else {
            const fallbackText = (options.mode === 'express')
                ? Catalog.compileExpress(recipe, options.variableValues)
                : Catalog.compileTurn(recipe, 0, { variableValues: options.variableValues });
            await navigator.clipboard.writeText(fallbackText);
            if (cardEl) {
                cardEl.style.borderColor = "#d2691e";
                const playHint = cardEl.querySelector('.play-hint-icon');
                if (playHint) playHint.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            }
        }
    } catch (err) {
        console.error("[PromptDock] Recipe execution failed:", err);
        if (cardEl) {
            cardEl.style.opacity = '1';
            cardEl.style.borderColor = "#e54d51";
        }
    }
}

async function runPrompt(content, cardEl) {
    // Get active tab
    const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
    
    if (tab && isSupportedTabUrl(tab.url)) {
        if (cardEl) {
            cardEl.style.opacity = '0.7';
            const playHint = cardEl.querySelector('.play-hint-icon');
            if (playHint) playHint.innerHTML = '<span class="pd-spinner-sm"></span>';
        }
        
        try {
            // Inject recipe catalog and content.js
            await ext.scripting.executeScript({
                target: { tabId: tab.id, allFrames: true },
                files: ['shared/recipe-catalog.js', 'content.js']
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
                if (cardEl) {
                    cardEl.style.borderColor = "#107c10";
                    cardEl.style.backgroundColor = "rgba(16, 124, 16, 0.15)";
                    const playHint = cardEl.querySelector('.play-hint-icon');
                    if (playHint) playHint.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                }
                setTimeout(() => {
                    try {
                        window.close();
                    } catch (e) {}
                }, 700);
            } else {
                try {
                    await navigator.clipboard.writeText(content);
                    if (cardEl) {
                        cardEl.style.borderColor = "#d2691e";
                        const playHint = cardEl.querySelector('.play-hint-icon');
                        if (playHint) playHint.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                    }
                } catch (e) {
                    console.error("Clipboard write failed:", e);
                    if (cardEl) cardEl.style.borderColor = "#e54d51";
                }
            }
        } catch (e) {
            console.error(e);
            if (cardEl) cardEl.style.borderColor = "#e54d51";
        }
    } else {
        alert("Bitte öffne einen unterstützten KI-Chat (Copilot, Gemini, ChatGPT oder Claude) im aktuellen Tab, um einen Prompt auszuführen.");
    }
}

// --- Drag and Drop Logic ---
let draggedItem = null;
let dragStartIndex = -1;

document.getElementById('prompts-list').addEventListener('dragstart', (e) => {
    if (currentSearchQuery !== '' || currentCategoryFilter !== 'all') {
        e.preventDefault();
        return;
    }
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
    if (currentSearchQuery !== '' || currentCategoryFilter !== 'all') return;
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
    if (dragStartIndex === -1 || currentSearchQuery !== '' || currentCategoryFilter !== 'all') return;
    
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

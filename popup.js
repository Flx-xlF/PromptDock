/**
 * PromptDock — Popup Controller
 * 
 * Manages the extension popup UI:
 * 1. Prompt Management: CRUD operations with live byte counting against chrome.storage.sync quotas.
 * 2. Storage Architecture: Chunked sync storage ('p_<id>') with automatic migration from legacy keys.
 * 3. Mobile Sync: Direct HTTPS integration with GitHub Gists for iOS Shortcuts sync.
 * 4. Backup & Restore: JSON file export and import with schema validation.
 * 5. Prompt Execution: Injects prompts into the active tab or triggers clipboard fallback.
 */

import { ext, StorageAdapter, PROMPT_KEY_PREFIX, RECIPE_KEY_PREFIX, ORDER_KEY } from './shared/browser-compat.js';
import { PromptStorage } from './storage.js';

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
    // Each sync prompt (exclude custom recipes which live in chrome.storage.local)
    for (const p of promptsList) {
        if (!p.id.startsWith(RECIPE_KEY_PREFIX) && !p.isCustomRecipe) {
            total += calcPromptBytes(p);
        }
    }
    return total;
}


let prompts = [];
let editingIndex = -1;
let currentWorkflowTurns = [];
let selectedTurnIndex = 0;

function createDefaultTurns() {
    return [
        { id: 'turn-1', title: 'Schritt 1: Lagebild', role: '', content: '' },
        { id: 'turn-2', title: 'Schritt 2: Output', role: '', content: '' }
    ];
}

function syncActiveCanvasToMemory() {
    if (!Array.isArray(currentWorkflowTurns) || currentWorkflowTurns.length === 0) return;
    if (selectedTurnIndex < 0 || selectedTurnIndex >= currentWorkflowTurns.length) return;

    const titleInput = document.getElementById('turn-title');
    const contentInput = document.getElementById('turn-content');

    if (titleInput) {
        currentWorkflowTurns[selectedTurnIndex].title = titleInput.value;
    }
    if (contentInput) {
        currentWorkflowTurns[selectedTurnIndex].content = contentInput.value;
    }

    updateTurnPillLabel(selectedTurnIndex);
}

function updateTurnPillLabel(idx) {
    const pillsContainer = document.getElementById('turn-builder-pills');
    if (!pillsContainer) return;
    const pill = pillsContainer.children[idx];
    if (!pill) return;
    const turn = currentWorkflowTurns[idx];
    if (!turn) return;

    const labelSpan = pill.querySelector('.pill-title');
    if (labelSpan) {
        const rawTitle = (turn.title || '').trim();
        labelSpan.textContent = rawTitle.length > 18 ? rawTitle.slice(0, 16) + '…' : (rawTitle || `Turn ${idx + 1}`);
    }
}

function renderTurnBuilderBar() {
    const container = document.getElementById('turn-builder-pills');
    if (!container) return;
    container.replaceChildren();

    if (!Array.isArray(currentWorkflowTurns) || currentWorkflowTurns.length === 0) {
        currentWorkflowTurns = createDefaultTurns();
        selectedTurnIndex = 0;
    }

    currentWorkflowTurns.forEach((turn, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `turn-builder-pill ${idx === selectedTurnIndex ? 'active' : ''}`;
        pill.setAttribute('data-turn-idx', idx.toString());

        const numSpan = document.createElement('span');
        numSpan.className = 'pill-num';
        numSpan.textContent = `${idx + 1}.`;
        pill.appendChild(numSpan);

        const titleSpan = document.createElement('span');
        titleSpan.className = 'pill-title';
        const rawTitle = (turn.title || '').trim();
        titleSpan.textContent = rawTitle.length > 18 ? rawTitle.slice(0, 16) + '…' : (rawTitle || `Turn ${idx + 1}`);
        pill.appendChild(titleSpan);

        pill.addEventListener('click', () => {
            if (idx === selectedTurnIndex) return;
            syncActiveCanvasToMemory();
            loadTurnIntoCanvas(idx);
        });

        container.appendChild(pill);
    });

    const activePill = container.children[selectedTurnIndex];
    if (activePill && typeof activePill.scrollIntoView === 'function') {
        activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
}

function loadTurnIntoCanvas(index) {
    if (!Array.isArray(currentWorkflowTurns) || currentWorkflowTurns.length === 0) {
        currentWorkflowTurns = createDefaultTurns();
        index = 0;
    }

    selectedTurnIndex = Math.max(0, Math.min(index, currentWorkflowTurns.length - 1));
    const turn = currentWorkflowTurns[selectedTurnIndex];

    const indicator = document.getElementById('turn-index-indicator');
    if (indicator) {
        indicator.textContent = `Turn ${selectedTurnIndex + 1}`;
    }

    const titleInput = document.getElementById('turn-title');
    if (titleInput) {
        titleInput.value = turn.title || '';
    }

    const contentInput = document.getElementById('turn-content');
    if (contentInput) {
        contentInput.value = turn.content || '';
    }

    const deleteBtn = document.getElementById('delete-turn-btn');
    if (deleteBtn) {
        deleteBtn.disabled = currentWorkflowTurns.length <= 1;
    }

    const container = document.getElementById('turn-builder-pills');
    if (container) {
        Array.from(container.children).forEach((pill, idx) => {
            pill.classList.toggle('active', idx === selectedTurnIndex);
        });
    }

    const charCounter = document.getElementById('char-counter');
    if (charCounter) {
        charCounter.textContent = `${currentWorkflowTurns.length} Turns konfiguriert (Storage: local)`;
        charCounter.classList.remove('over-limit');
    }
}

function appendNewTurn() {
    syncActiveCanvasToMemory();
    const newIdx = currentWorkflowTurns.length;
    currentWorkflowTurns.push({
        id: `turn-${Date.now()}-${newIdx + 1}`,
        title: `Schritt ${newIdx + 1}`,
        role: '',
        content: ''
    });
    selectedTurnIndex = newIdx;
    renderTurnBuilderBar();
    loadTurnIntoCanvas(newIdx);

    const titleInput = document.getElementById('turn-title');
    if (titleInput) {
        titleInput.focus();
        titleInput.select();
    }
}

function deleteCurrentTurn() {
    if (currentWorkflowTurns.length <= 1) return;
    currentWorkflowTurns.splice(selectedTurnIndex, 1);
    if (selectedTurnIndex >= currentWorkflowTurns.length) {
        selectedTurnIndex = currentWorkflowTurns.length - 1;
    }
    renderTurnBuilderBar();
    loadTurnIntoCanvas(selectedTurnIndex);
}

function setEditorMode(isMultiTurn) {
    const modeCheckbox = document.getElementById('mode-toggle-checkbox');
    if (modeCheckbox) modeCheckbox.checked = isMultiTurn;

    const btnSingle = document.getElementById('mode-btn-single');
    const btnMulti = document.getElementById('mode-btn-multi');
    if (btnSingle && btnMulti) {
        btnSingle.classList.toggle('active', !isMultiTurn);
        btnSingle.setAttribute('aria-selected', (!isMultiTurn).toString());
        btnMulti.classList.toggle('active', isMultiTurn);
        btnMulti.setAttribute('aria-selected', isMultiTurn.toString());
    }

    const turnBuilderBar = document.getElementById('turn-builder-bar');
    const activeCanvas = document.getElementById('active-turn-canvas');
    const contentArea = document.getElementById('prompt-content');
    const contentLabel = document.getElementById('prompt-content-label');
    const sheetTitle = document.getElementById('editor-sheet-title');
    const inspector = document.getElementById('recipe-turns-inspector');

    if (isMultiTurn) {
        turnBuilderBar?.classList.remove('hidden');
        activeCanvas?.classList.remove('hidden');
        contentArea?.classList.add('hidden');
        contentLabel?.classList.add('hidden');
        inspector?.classList.add('hidden');
        if (sheetTitle) {
            sheetTitle.textContent = (editingIndex >= 0) ? 'Workflow bearbeiten' : 'Neuer Multi-Turn Workflow';
        }
        document.getElementById('save-btn').disabled = false;

        if (!Array.isArray(currentWorkflowTurns) || currentWorkflowTurns.length === 0) {
            if (editingIndex >= 0 && prompts[editingIndex]) {
                const matched = findMatchingRecipe(prompts[editingIndex]);
                if (matched && Array.isArray(matched.turns) && matched.turns.length > 0) {
                    currentWorkflowTurns = matched.turns.map((t, idx) => ({
                        id: t.id || `turn-${idx + 1}`,
                        title: t.title || `Schritt ${idx + 1}`,
                        role: t.role || '',
                        content: t.content || (t.chunks && t.chunks[0]?.text) || ''
                    }));
                }
            }
            if (!currentWorkflowTurns || currentWorkflowTurns.length === 0) {
                const currentContent = contentArea?.value.trim() || '';
                if (currentContent) {
                    currentWorkflowTurns = [
                        { id: 'turn-1', title: 'Schritt 1: Prompt', role: '', content: currentContent },
                        { id: 'turn-2', title: 'Schritt 2: Vertiefung', role: '', content: '' }
                    ];
                } else {
                    currentWorkflowTurns = createDefaultTurns();
                }
            }
            selectedTurnIndex = 0;
        }

        renderTurnBuilderBar();
        loadTurnIntoCanvas(selectedTurnIndex);
    } else {
        syncActiveCanvasToMemory();
        turnBuilderBar?.classList.add('hidden');
        activeCanvas?.classList.add('hidden');
        contentArea?.classList.remove('hidden');
        if (sheetTitle) {
            sheetTitle.textContent = (editingIndex >= 0) ? 'Prompt bearbeiten' : 'Neuer Prompt';
        }
        updateCharCounter();
    }
}

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
        const isMultiTurn = document.getElementById('mode-toggle-checkbox')?.checked || false;
        if (isMultiTurn) {
            charCounter.textContent = `${currentWorkflowTurns.length} Turns konfiguriert (Storage: local)`;
            charCounter.classList.remove('over-limit');
            document.getElementById('save-btn').disabled = false;
            return;
        }

        const name = nameInput.value.trim();
        const content = contentInput.value.trim();
        const autoSend = document.getElementById('prompt-auto-send').checked;
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

    const modeBtnSingle = document.getElementById('mode-btn-single');
    const modeBtnMulti = document.getElementById('mode-btn-multi');
    if (modeBtnSingle) {
        modeBtnSingle.addEventListener('click', () => {
            setEditorMode(false);
        });
    }
    if (modeBtnMulti) {
        modeBtnMulti.addEventListener('click', () => {
            setEditorMode(true);
        });
    }

    const turnTitleInput = document.getElementById('turn-title');
    if (turnTitleInput) {
        turnTitleInput.addEventListener('input', () => {
            syncActiveCanvasToMemory();
        });
        turnTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('turn-content')?.focus();
            }
        });
    }

    const turnContentInput = document.getElementById('turn-content');
    if (turnContentInput) {
        turnContentInput.addEventListener('input', () => {
            syncActiveCanvasToMemory();
        });
    }

    const addTurnPillBtn = document.getElementById('add-turn-pill-btn');
    if (addTurnPillBtn) {
        addTurnPillBtn.addEventListener('click', () => {
            appendNewTurn();
        });
    }

    const deleteTurnBtn = document.getElementById('delete-turn-btn');
    if (deleteTurnBtn) {
        deleteTurnBtn.addEventListener('click', () => {
            deleteCurrentTurn();
        });
    }

    const modeToggle = document.getElementById('mode-toggle-checkbox');
    if (modeToggle) {
        modeToggle.addEventListener('change', () => {
            setEditorMode(modeToggle.checked);
        });
    }

    document.getElementById('toggle-add-btn').addEventListener('click', () => {
        document.getElementById('prompt-modal')?.classList.remove('hidden');
        document.getElementById('add-form')?.classList.remove('hidden');
        document.getElementById('toggle-add-btn')?.classList.add('hidden');
        editingIndex = -1;
        document.getElementById('prompt-name').value = '';
        document.getElementById('prompt-content').value = '';
        document.getElementById('prompt-auto-send').checked = false;
        currentWorkflowTurns = createDefaultTurns();
        selectedTurnIndex = 0;
        setEditorMode(false);
        document.getElementById('save-btn').innerText = 'Speichern';

        // Reset & hide recipe inspector for standard single-shot prompt
        const inspector = document.getElementById('recipe-turns-inspector');
        if (inspector) {
            inspector.classList.add('hidden');
            inspector.replaceChildren();
        }
        const contentLabel = document.getElementById('prompt-content-label');
        if (contentLabel) contentLabel.classList.add('hidden');
        document.getElementById('prompt-content').placeholder = 'Prompt Text...';

        updateCharCounter();
    });
    
    document.getElementById('cancel-add-btn').addEventListener('click', () => {
        document.getElementById('prompt-modal')?.classList.add('hidden');
        document.getElementById('add-form')?.classList.add('hidden');
        document.getElementById('toggle-add-btn')?.classList.remove('hidden');
        document.getElementById('prompt-name').value = '';
        document.getElementById('prompt-content').value = '';
        document.getElementById('prompt-auto-send').checked = false;
        editingIndex = -1;
        currentWorkflowTurns = [];
        selectedTurnIndex = 0;
        setEditorMode(false);
        document.getElementById('save-btn').innerText = 'Speichern';

        // Reset & hide recipe inspector
        const inspector = document.getElementById('recipe-turns-inspector');
        if (inspector) {
            inspector.classList.add('hidden');
            inspector.replaceChildren();
        }
        const contentLabel = document.getElementById('prompt-content-label');
        if (contentLabel) contentLabel.classList.add('hidden');
        document.getElementById('prompt-content').placeholder = 'Prompt Text...';

        updateCharCounter();
    });

    document.getElementById('prompt-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'prompt-modal') {
            document.getElementById('cancel-add-btn').click();
        }
    });
    
    document.getElementById('save-btn').addEventListener('click', async () => {
        const name = document.getElementById('prompt-name').value.trim();
        const autoSend = document.getElementById('prompt-auto-send').checked;
        const isMultiTurn = document.getElementById('mode-toggle-checkbox')?.checked || false;

        if (!name) {
            alert("Bitte geben Sie einen Namen ein.");
            return;
        }

        if (isMultiTurn) {
            syncActiveCanvasToMemory();
            if (!currentWorkflowTurns || currentWorkflowTurns.length === 0) {
                alert("Ein Multi-Turn Workflow benötigt mindestens einen Turn.");
                return;
            }

            // Prefix r_ according to specification
            let recipeId;
            if (editingIndex >= 0) {
                const existing = prompts[editingIndex];
                recipeId = existing.id.startsWith(RECIPE_KEY_PREFIX) ? existing.id : `${RECIPE_KEY_PREFIX}${Date.now()}`;
            } else {
                recipeId = `${RECIPE_KEY_PREFIX}${Date.now()}`;
            }

            const compiledContent = currentWorkflowTurns
                .map((t, idx) => `${t.title || `Turn ${idx + 1}`}:\n${t.content || ''}`)
                .join('\n\n---\n\n');

            const recipeObj = {
                id: recipeId,
                name: name,
                family: 'custom',
                turns: currentWorkflowTurns.map((t, idx) => ({
                    id: t.id || `turn-${idx + 1}`,
                    title: t.title || `Schritt ${idx + 1}`,
                    role: t.role || '',
                    chunks: [{ text: t.content || '' }],
                    content: t.content || ''
                })),
                content: compiledContent,
                autoSend: autoSend,
                isCustomRecipe: true
            };

            if (editingIndex >= 0) {
                prompts[editingIndex] = recipeObj;
            } else {
                prompts.push(recipeObj);
            }

            try {
                await PromptStorage.save(prompts);
            } catch (err) {
                alert("Fehler beim Speichern des Workflows: " + err.message);
                if (editingIndex < 0) prompts.pop();
                return;
            }

            document.getElementById('cancel-add-btn').click();
            renderPrompts();
            return;
        }

        // Single-shot mode
        const content = document.getElementById('prompt-content').value.trim();
        if (!content) {
            alert("Bitte geben Sie den Prompt-Text ein.");
            return;
        }

        if (editingIndex >= 0) {
            const existingPrompt = prompts[editingIndex];
            const matchedRecipe = findMatchingRecipe(existingPrompt);
            const pId = existingPrompt.id.startsWith(RECIPE_KEY_PREFIX) ? Date.now().toString() : existingPrompt.id;

            prompts[editingIndex] = {
                id: pId,
                name: name,
                content: content,
                autoSend: autoSend,
                ...(matchedRecipe ? { recipeId: matchedRecipe.id } : (existingPrompt.recipeId ? { recipeId: existingPrompt.recipeId } : {}))
            };
        } else {
            const newPrompt = {
                id: Date.now().toString(),
                name,
                content,
                autoSend
            };
            const matchedRecipe = findMatchingRecipe(newPrompt);
            if (matchedRecipe) {
                newPrompt.recipeId = matchedRecipe.id;
            }
            prompts.push(newPrompt);
        }

        try {
            await PromptStorage.save(prompts);
        } catch (err) {
            alert("Fehler beim Speichern: Speicherlimit erreicht. Bitte löschen Sie alte Prompts.");
            if (editingIndex < 0) {
                prompts.pop();
            }
            return;
        }

        document.getElementById('cancel-add-btn').click();
        renderPrompts();
    });

    // Import / Export Event Listeners
    document.getElementById('export-btn').addEventListener('click', async () => {
        const backupData = await PromptStorage.exportAll(prompts);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "promptdock_backup.json");
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
                const loaded = await PromptStorage.importAll(imported);
                if (!loaded) {
                    alert("Ungültiges Format: Die Sicherungsdatei konnte nicht importiert werden.");
                    return;
                }
                prompts = loaded;
                renderPrompts();
            } catch (err) {
                alert("Fehler beim Importieren: " + err.message);
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
            note.textContent = 'Nutze diese URL im iOS-Shortcut mit der "Inhalte von URL abrufen" Aktion (Header: Authorization = Bearer PAT).';
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
        startVarBtn.addEventListener('click', submitVariableModal);
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

        // Global hotkey: Cmd+K / Ctrl+K to jump to search, Escape to dismiss modals/search
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            } else if (e.key === 'Escape') {
                if (varModal && !varModal.classList.contains('hidden')) {
                    e.preventDefault();
                    varModal.classList.add('hidden');
                    currentPendingRecipeExecution = null;
                    return;
                }
                const syncModal = document.getElementById('sync-modal');
                if (syncModal && !syncModal.classList.contains('hidden')) {
                    e.preventDefault();
                    syncModal.classList.add('hidden');
                    return;
                }
                if (document.activeElement === searchInput) {
                    searchInput.value = '';
                    currentSearchQuery = '';
                    if (searchClearBtn) searchClearBtn.classList.add('hidden');
                    renderPrompts();
                }
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
    if (!prompt) return null;
    if (prompt.isCustomRecipe || (typeof prompt.id === 'string' && prompt.id.startsWith(RECIPE_KEY_PREFIX))) {
        return prompt;
    }
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

function renderRecipeInspector(recipe) {
    const container = document.getElementById('recipe-turns-inspector');
    if (!container || !recipe || !recipe.turns) return;

    container.replaceChildren();

    // 1. Header
    const header = document.createElement('div');
    header.className = 'recipe-inspector-header';
    header.innerHTML = `
        <span>${recipe.turns.length}-Schritte Workflow Rail</span>
        <span style="color:var(--text-tertiary); font-weight:500;">Turn-Vorschau</span>
    `;
    container.appendChild(header);

    // 2. Turn Pills Bar
    const pillsRow = document.createElement('div');
    pillsRow.className = 'recipe-turn-pills';

    const detailBox = document.createElement('div');
    detailBox.className = 'recipe-turn-detail';

    function updateTurnDetail(turn, turnIdx) {
        const chunkTitles = (turn.chunks || []).map(c => {
            const id = typeof c === 'string' ? c : c.chunkId;
            return Catalog?.CHUNKS?.[id]?.title || id;
        });
        detailBox.innerHTML = `
            <div style="margin-bottom: 3px;"><strong>Schritt ${turnIdx + 1}:</strong> <span style="color: #e2e8f0; font-weight: 600;">${turn.title}</span></div>
            <div style="margin-bottom: 3px;"><strong>Rolle:</strong> <span style="color: #cbd5e1;">${turn.role || 'Standard-Assistent'}</span></div>
            <div><strong>Aktive Chunks:</strong> <span style="color: var(--text-tertiary);">${chunkTitles.join(' · ') || 'Keine Chunks'}</span></div>
        `;
    }

    recipe.turns.forEach((turn, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'recipe-turn-pill' + (idx === 0 ? ' active' : '');
        const numberIcons = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
        const icon = numberIcons[idx] || `${idx + 1}.`;
        pill.textContent = `${icon} ${turn.title}`;
        pill.title = `Turn ${idx + 1}: ${turn.title}`;

        pill.addEventListener('click', (e) => {
            e.preventDefault();
            pillsRow.querySelectorAll('.recipe-turn-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            updateTurnDetail(turn, idx);
        });

        pillsRow.appendChild(pill);
    });

    container.appendChild(pillsRow);

    if (recipe.turns.length > 0) {
        updateTurnDetail(recipe.turns[0], 0);
    }
    container.appendChild(detailBox);
}

/** Update the global storage usage bar in the footer. */
function updateGlobalStorage() {
    const el = document.getElementById('global-storage');
    if (!el) return;
    const usedBytes = calcTotalBytes(prompts);
    const pct = Math.round((usedBytes / QUOTA_BYTES_TOTAL) * 100);
    const usedKB = (usedBytes / 1024).toFixed(1);
    const totalKB = (QUOTA_BYTES_TOTAL / 1024).toFixed(0);
    const localRecipeCount = prompts.filter(p => (typeof p.id === 'string' && p.id.startsWith(RECIPE_KEY_PREFIX)) || p.isCustomRecipe).length;
    const extraInfo = localRecipeCount > 0 ? ` · ${localRecipeCount} Workflows (lokal)` : '';
    el.textContent = `Sync: ${usedKB} / ${totalKB} KB (${pct}%)${extraInfo}`;
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
    const commands = (ext?.commands?.getAll) ? await ext.commands.getAll() : [];
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
        const isCustomItem = !matchedRecipe || (typeof prompt.id === 'string' && prompt.id.startsWith(RECIPE_KEY_PREFIX)) || prompt.isCustomRecipe || (matchedRecipe && matchedRecipe.family === 'custom');
        
        // 1. Category Filter: assign r_ items and custom single-shot prompts to "Eigene" (custom)
        if (currentCategoryFilter !== 'all') {
            if (currentCategoryFilter === 'custom') {
                if (!isCustomItem) return false;
            } else {
                if (isCustomItem || !matchedRecipe || matchedRecipe.family !== currentCategoryFilter) return false;
            }
        }

        // 2. Search Query Filter
        if (currentSearchQuery) {
            const nameMatch = (prompt.name || '').toLowerCase().includes(currentSearchQuery);
            const contentMatch = (prompt.content || '').toLowerCase().includes(currentSearchQuery);
            const turnsMatch = (prompt.turns || (matchedRecipe && matchedRecipe.turns) || []).some(t => 
                (t.title && t.title.toLowerCase().includes(currentSearchQuery)) ||
                (t.content && t.content.toLowerCase().includes(currentSearchQuery))
            );
            const recipeMatch = matchedRecipe && (
                matchedRecipe.name.toLowerCase().includes(currentSearchQuery) ||
                (matchedRecipe.turns && matchedRecipe.turns.some(t => t.title.toLowerCase().includes(currentSearchQuery)))
            );
            if (!nameMatch && !contentMatch && !recipeMatch && !turnsMatch) return false;
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
        const recipeTurns = (matchedRecipe && matchedRecipe.turns) ? matchedRecipe.turns : (prompt.turns || []);
        if (recipeTurns.length > 0) {
            div.title = `Klicken, um ${recipeTurns.length}-Schritte Workflow zu starten (Turn 1: ${recipeTurns[0]?.title || 'Start'})`;
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

        // Render "X Turns" badge for multi-turn items (both custom r_ and catalog recipes)
        if (recipeTurns.length > 0) {
            const turnBadge = document.createElement('span');
            turnBadge.className = 'recipe-turn-badge';
            turnBadge.title = `${recipeTurns.length}-Schritte Workflow mit Rail & Checkpoints`;
            turnBadge.textContent = `${recipeTurns.length} Turns`;
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
            document.getElementById('prompt-content').value = prompt.content || '';
            document.getElementById('prompt-auto-send').checked = !!prompt.autoSend;
            document.getElementById('prompt-modal')?.classList.remove('hidden');
            document.getElementById('add-form')?.classList.remove('hidden');
            document.getElementById('toggle-add-btn')?.classList.add('hidden');
            
            const isCustomRecipe = (typeof prompt.id === 'string' && prompt.id.startsWith(RECIPE_KEY_PREFIX)) || prompt.isCustomRecipe;
            const sheetTitle = document.getElementById('editor-sheet-title');
            const inspector = document.getElementById('recipe-turns-inspector');
            const contentLabel = document.getElementById('prompt-content-label');

            if (isCustomRecipe) {
                currentWorkflowTurns = (prompt.turns || []).map((t, idx) => ({
                    id: t.id || `turn-${idx + 1}`,
                    title: t.title || `Schritt ${idx + 1}`,
                    role: t.role || '',
                    content: t.content || (t.chunks && t.chunks[0]?.text) || ''
                }));
                if (currentWorkflowTurns.length === 0) {
                    currentWorkflowTurns = createDefaultTurns();
                }
                selectedTurnIndex = 0;
                setEditorMode(true);
            } else if (matchedRecipe && matchedRecipe.turns && matchedRecipe.turns.length > 0) {
                setEditorMode(false);
                if (sheetTitle) sheetTitle.textContent = 'Workflow bearbeiten';
                if (inspector) {
                    inspector.classList.remove('hidden');
                    renderRecipeInspector(matchedRecipe);
                }
                if (contentLabel) {
                    contentLabel.classList.remove('hidden');
                    contentLabel.textContent = 'Express-Modus / Direkt-Prompt (1-Turn Fallback)';
                }
                document.getElementById('prompt-content').placeholder = 'Express-Modus / Direkt-Prompt (1-Turn Fallback)';
            } else {
                setEditorMode(false);
                if (sheetTitle) sheetTitle.textContent = 'Prompt bearbeiten';
                if (inspector) {
                    inspector.classList.add('hidden');
                    inspector.replaceChildren();
                }
                if (contentLabel) {
                    contentLabel.classList.add('hidden');
                }
                document.getElementById('prompt-content').placeholder = 'Prompt Text...';
            }

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

const KNOWN_VARIABLE_METADATA = {
    SUCHBEGRIFF: {
        label: 'Suchbegriff / Recherche-Thema',
        description: 'Thema, Fragestellung oder Dossiertitel für die Tiefenrecherche',
        placeholder: 'z.B. KI-Assistenten im Kundenservice, Projekt Rollout 2026...',
        default: '',
        required: true
    },
    ZEITRAUM: {
        label: 'Zeitraum / Scan-Fenster',
        description: 'Relevantes Zeitfenster für den Scan oder das Update',
        placeholder: 'z.B. Letzte Woche bis heute, Letzte 7 Tage...',
        default: 'Letzte Woche bis heute',
        required: false
    },
    PERSON: {
        label: 'Empfänger / Zielgruppe',
        description: 'Für wen ist das Briefing oder Update bestimmt?',
        placeholder: 'z.B. Geschäftsleitung, Leitung Kommunikation, Team...',
        default: 'Geschäftsleitung',
        required: false
    },
    THEMA: {
        label: 'Thema / Projekt',
        description: 'Spezifisches Thema oder Projekt für das Status-Update',
        placeholder: 'z.B. IT-Modernisierung, Medienanfrage, Kampagne...',
        default: '',
        required: true
    }
};

function normalizeVariableDef(v) {
    if (typeof v === 'string') {
        const meta = KNOWN_VARIABLE_METADATA[v.toUpperCase()] || {};
        return {
            key: v,
            name: v,
            label: meta.label || v,
            description: meta.description || '',
            placeholder: meta.placeholder || `Wert für ${v} eingeben...`,
            default: meta.default || '',
            required: meta.required !== undefined ? meta.required : false
        };
    }
    const key = v.key || v.name || v.id || 'VARIABLE';
    const meta = KNOWN_VARIABLE_METADATA[key.toUpperCase()] || {};
    return {
        key: key,
        name: key,
        label: v.label || meta.label || key,
        description: v.description || meta.description || '',
        placeholder: v.placeholder || meta.placeholder || `Wert für ${key} eingeben...`,
        default: v.default !== undefined ? v.default : (meta.default || ''),
        required: v.required !== undefined ? v.required : (meta.required || false)
    };
}

function submitVariableModal() {
    if (!currentPendingRecipeExecution) return;
    const { recipe, buttonEl, tab } = currentPendingRecipeExecution;
    const varModal = document.getElementById('recipe-var-modal');
    const varFields = document.getElementById('var-modal-fields');
    const varMode = document.getElementById('var-modal-mode');
    const mode = varMode ? varMode.value : 'guided';

    const variableValues = {};
    let hasValidationError = false;
    let firstErrorInput = null;

    varFields.querySelectorAll('.var-input-field').forEach(input => {
        const key = input.dataset.varKey;
        if (!key) return;
        const val = input.value.trim();
        const defaultVal = input.dataset.varDefault || '';
        const isRequired = input.dataset.varRequired === 'true';

        if (isRequired && !val && !defaultVal) {
            input.classList.add('input-error');
            hasValidationError = true;
            if (!firstErrorInput) firstErrorInput = input;
        } else {
            variableValues[key] = val || defaultVal;
        }
    });

    if (hasValidationError) {
        if (firstErrorInput) {
            firstErrorInput.focus();
            // Re-trigger shake animation if already added
            firstErrorInput.classList.remove('input-error');
            void firstErrorInput.offsetWidth;
            firstErrorInput.classList.add('input-error');
        }
        return;
    }

    if (varModal) varModal.classList.add('hidden');
    executeRecipe(recipe, { mode, variableValues }, buttonEl, tab);
    currentPendingRecipeExecution = null;
}

function openVariableModal(recipe, prompt, buttonEl, tab) {
    const varModal = document.getElementById('recipe-var-modal');
    const varTitle = document.getElementById('var-modal-title');
    const varDesc = document.getElementById('var-modal-desc');
    const varFields = document.getElementById('var-modal-fields');
    const varMode = document.getElementById('var-modal-mode');
    const modeHint = document.getElementById('var-modal-mode-hint');

    varTitle.textContent = `${recipe.name} konfigurieren`;
    if (varDesc) {
        varDesc.textContent = `Parameter für den mehrstufigen Workflow «${recipe.name}» festlegen:`;
    }
    varFields.replaceChildren();
    varMode.value = 'guided';

    const updateModeHint = () => {
        if (!modeHint) return;
        if (varMode.value === 'guided') {
            modeHint.textContent = 'Empfohlen: Stoppt nach jedem Teilschritt für Zwischenprüfungen & Notizen.';
        } else if (varMode.value === 'autopilot') {
            modeHint.textContent = 'Führt alle Workflow-Schritte automatisch nacheinander aus.';
        } else {
            modeHint.textContent = 'Fasst alle Teilschritte in eine einzige Eingabe zusammen (Express-Prompt).';
        }
    };
    varMode.onchange = updateModeHint;
    updateModeHint();

    recipe.variables.forEach(rawV => {
        const v = normalizeVariableDef(rawV);

        const group = document.createElement('div');
        group.className = 'var-group';

        const labelRow = document.createElement('div');
        labelRow.className = 'var-label-row';

        const label = document.createElement('label');
        label.className = 'var-label';
        label.textContent = v.label;
        labelRow.appendChild(label);

        const badge = document.createElement('span');
        badge.className = v.required ? 'var-badge-req' : 'var-badge-opt';
        badge.textContent = v.required ? 'Erforderlich' : 'Optional';
        labelRow.appendChild(badge);

        group.appendChild(labelRow);

        if (v.description) {
            const desc = document.createElement('div');
            desc.className = 'var-desc';
            desc.textContent = v.description;
            group.appendChild(desc);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'var-input-field';
        input.dataset.varKey = v.key;
        input.dataset.varDefault = v.default || '';
        input.dataset.varRequired = v.required ? 'true' : 'false';
        input.placeholder = v.placeholder || '';
        if (v.default) input.value = v.default;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitVariableModal();
            }
        });

        input.addEventListener('input', () => {
            input.classList.remove('input-error');
        });

        group.appendChild(input);
        varFields.appendChild(group);
    });

    currentPendingRecipeExecution = { recipe, buttonEl, tab };
    varModal.classList.remove('hidden');

    const firstInput = varFields.querySelector('input');
    if (firstInput) {
        setTimeout(() => {
            firstInput.focus();
            if (firstInput.value) {
                firstInput.select();
            }
        }, 60);
    }
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
            func: (recId, opts, customRec) => {
                if (window.startPromptDockRecipe) {
                    return window.startPromptDockRecipe(recId, { ...opts, customRecipe: customRec });
                }
                return false;
            },
            args: [recipe.id, options, recipe]
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

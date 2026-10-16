/**
 * PromptDock — Data Layer & Unified Storage Engine
 * Dual-tier storage architecture:
 * - Single-shot prompts: stored in chrome.storage.sync ('p_<id>')
 * - Custom multi-turn recipes: stored in chrome.storage.local ('r_<id>')
 */

import { ext, StorageAdapter, PROMPT_KEY_PREFIX, RECIPE_KEY_PREFIX, ORDER_KEY } from './shared/browser-compat.js';

let gistSyncTimer = null;

/**
 * 1500ms debounced Gist synchronizer to prevent concurrent HTTPS PATCH bursts.
 */
export function debouncedSyncGist(items) {
    if (gistSyncTimer) clearTimeout(gistSyncTimer);
    gistSyncTimer = setTimeout(() => {
        PromptStorage.syncGist(items).catch(err => {
            console.warn('[PromptDock] Background Gist sync failed:', err);
        });
    }, 1500);
}

export { PROMPT_KEY_PREFIX, RECIPE_KEY_PREFIX, ORDER_KEY };

export const PromptStorage = {
    /**
     * Load all prompts and recipes.
     * Merges chrome.storage.sync ('p_') and chrome.storage.local ('r_') based on ORDER_KEY.
     */
    async load() {
        const allSync = await StorageAdapter.get(null);

        // 1. Fetch sync prompts ('p_')
        const syncPromptsMap = new Map();
        for (const [k, v] of Object.entries(allSync)) {
            if (k.startsWith(PROMPT_KEY_PREFIX) && v && typeof v === 'object') {
                const cleanId = (v.id || k.slice(PROMPT_KEY_PREFIX.length)).replace(/^p_/, '');
                const promptObj = { ...v, id: cleanId };
                syncPromptsMap.set(cleanId, promptObj);
                syncPromptsMap.set(PROMPT_KEY_PREFIX + cleanId, promptObj);
            }
        }

        // 2. Fetch local custom recipes ('r_')
        const localRecipesMap = new Map();
        let allLocal = {};
        if (ext?.storage?.local) {
            try {
                allLocal = await ext.storage.local.get(null);
            } catch (e) {
                console.warn('[PromptDock] Failed reading chrome.storage.local:', e);
            }
        } else {
            // Standalone / localStorage fallback
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith(RECIPE_KEY_PREFIX)) {
                        allLocal[k] = JSON.parse(localStorage.getItem(k));
                    }
                }
            } catch (e) {}
        }

        for (const [k, v] of Object.entries(allLocal)) {
            if (k.startsWith(RECIPE_KEY_PREFIX) && v && typeof v === 'object') {
                const id = v.id && v.id.startsWith(RECIPE_KEY_PREFIX) ? v.id : k;
                const recipeObj = {
                    ...v,
                    id,
                    isCustomRecipe: true,
                    family: 'custom'
                };
                localRecipesMap.set(id, recipeObj);
                localRecipesMap.set(id.replace(/^r_/, ''), recipeObj);
            }
        }

        // 3. Handle legacy single-key migration if no chunked keys exist
        if (syncPromptsMap.size === 0 && localRecipesMap.size === 0) {
            if (allSync.prompts && Array.isArray(allSync.prompts) && allSync.prompts.length > 0) {
                const legacy = allSync.prompts;
                await this.save(legacy);
                await StorageAdapter.remove('prompts');
                console.log('[PromptDock] Migrated from legacy sync format.');
                return legacy;
            }
            if (allLocal.prompts && Array.isArray(allLocal.prompts) && allLocal.prompts.length > 0) {
                const legacy = allLocal.prompts;
                await this.save(legacy);
                if (ext?.storage?.local) await ext.storage.local.remove('prompts');
                console.log('[PromptDock] Migrated from legacy local format.');
                return legacy;
            }
            return null; // First launch, load default prompts
        }

        // 4. Merge according to ORDER_KEY
        const order = Array.isArray(allSync[ORDER_KEY]) ? allSync[ORDER_KEY] : [];
        const merged = [];
        const seen = new Set();

        for (const id of order) {
            const cleanSyncId = typeof id === 'string' ? id.replace(/^p_/, '') : id;
            const fullRecipeId = typeof id === 'string' && !id.startsWith(RECIPE_KEY_PREFIX) ? `${RECIPE_KEY_PREFIX}${id}` : id;

            if (syncPromptsMap.has(cleanSyncId) && !seen.has(cleanSyncId)) {
                merged.push(syncPromptsMap.get(cleanSyncId));
                seen.add(cleanSyncId);
                seen.add(PROMPT_KEY_PREFIX + cleanSyncId);
            } else if (localRecipesMap.has(fullRecipeId) && !seen.has(fullRecipeId)) {
                merged.push(localRecipesMap.get(fullRecipeId));
                seen.add(fullRecipeId);
                seen.add(fullRecipeId.replace(/^r_/, ''));
            } else if (localRecipesMap.has(id) && !seen.has(id)) {
                merged.push(localRecipesMap.get(id));
                seen.add(id);
                seen.add(typeof id === 'string' ? id.replace(/^r_/, '') : id);
            }
        }

        // Append any items not tracked in the order array
        for (const [id, item] of syncPromptsMap.entries()) {
            const cleanId = id.replace(/^p_/, '');
            if (!seen.has(cleanId)) {
                merged.push(item);
                seen.add(cleanId);
                seen.add(PROMPT_KEY_PREFIX + cleanId);
            }
        }
        for (const [id, item] of localRecipesMap.entries()) {
            const fullId = id.startsWith(RECIPE_KEY_PREFIX) ? id : `${RECIPE_KEY_PREFIX}${id}`;
            if (!seen.has(fullId)) {
                merged.push(item);
                seen.add(fullId);
                seen.add(fullId.replace(/^r_/, ''));
            }
        }

        return merged;
    },

    /**
     * Persist the merged prompts and recipes array.
     * Splits payloads: 'p_' -> sync, 'r_' -> local.
     */
    async save(items) {
        if (!Array.isArray(items)) return;

        const syncBatch = {};
        const localBatch = {};
        const activeOrder = items.map(p => p.id);
        syncBatch[ORDER_KEY] = activeOrder;

        const activeSyncKeys = new Set();
        const activeLocalKeys = new Set();

        for (const item of items) {
            const isRecipe = item.id.startsWith(RECIPE_KEY_PREFIX) || item.isCustomRecipe === true;

            if (isRecipe) {
                const rKey = item.id.startsWith(RECIPE_KEY_PREFIX) ? item.id : `${RECIPE_KEY_PREFIX}${item.id}`;
                activeLocalKeys.add(rKey);
                localBatch[rKey] = {
                    id: rKey,
                    name: item.name,
                    family: 'custom',
                    turns: item.turns || [],
                    forks: item.forks || [],
                    content: item.content || '',
                    autoSend: !!item.autoSend,
                    isCustomRecipe: true
                };
            } else {
                const pKey = item.id.startsWith(PROMPT_KEY_PREFIX) ? item.id : `${PROMPT_KEY_PREFIX}${item.id}`;
                activeSyncKeys.add(pKey);
                syncBatch[pKey] = {
                    id: item.id,
                    name: item.name,
                    content: item.content || '',
                    autoSend: !!item.autoSend,
                    ...(item.recipeId ? { recipeId: item.recipeId } : {})
                };
            }
        }

        // Clean up orphaned sync keys
        const allSync = await StorageAdapter.get(null);
        const orphanSync = Object.keys(allSync).filter(k =>
            k.startsWith(PROMPT_KEY_PREFIX) && !activeSyncKeys.has(k)
        );
        if (orphanSync.length > 0) {
            await StorageAdapter.remove(orphanSync);
        }

        // Clean up orphaned local keys
        if (ext?.storage?.local) {
            try {
                const allLocal = await ext.storage.local.get(null);
                const orphanLocal = Object.keys(allLocal).filter(k =>
                    k.startsWith(RECIPE_KEY_PREFIX) && !activeLocalKeys.has(k)
                );
                if (orphanLocal.length > 0) {
                    await ext.storage.local.remove(orphanLocal);
                }
            } catch (e) {
                console.warn('[PromptDock] Local cleanup failed:', e);
            }
        }

        // Save batches
        await StorageAdapter.set(syncBatch);
        if (ext?.storage?.local) {
            if (Object.keys(localBatch).length > 0) {
                await ext.storage.local.set(localBatch);
            }
        } else {
            // Standalone fallback
            try {
                for (const [k, v] of Object.entries(localBatch)) {
                    localStorage.setItem(k, JSON.stringify(v));
                }
            } catch (e) {}
        }

        // Trigger debounced background Gist sync (1500ms idle threshold)
        debouncedSyncGist(items);
    },

    /**
     * Export all items, merging sync prompts and local custom recipes.
     */
    async exportAll(items = []) {
        // 1. Fetch fresh sync data
        const allSync = await StorageAdapter.get(null);
        const syncPrompts = [];
        for (const [k, v] of Object.entries(allSync)) {
            if (k.startsWith(PROMPT_KEY_PREFIX) && v && typeof v === 'object') {
                syncPrompts.push(v);
            }
        }

        // 2. Fetch fresh local data
        let allLocal = {};
        if (ext?.storage?.local) {
            try {
                allLocal = await ext.storage.local.get(null);
            } catch (e) {
                console.warn('[PromptDock] Failed reading local storage during export:', e);
            }
        } else {
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith(RECIPE_KEY_PREFIX)) {
                        allLocal[k] = JSON.parse(localStorage.getItem(k));
                    }
                }
            } catch (e) {}
        }
        const customRecipes = [];
        for (const [k, v] of Object.entries(allLocal)) {
            if (k.startsWith(RECIPE_KEY_PREFIX) && v && typeof v === 'object') {
                customRecipes.push(v);
            }
        }

        const finalPrompts = syncPrompts.length > 0
            ? syncPrompts
            : items.filter(i => !i.id.startsWith(RECIPE_KEY_PREFIX) && !i.isCustomRecipe);
        const finalRecipes = customRecipes.length > 0
            ? customRecipes
            : items.filter(i => i.id.startsWith(RECIPE_KEY_PREFIX) || i.isCustomRecipe);

        return {
            version: "2.0.0",
            exportedAt: new Date().toISOString(),
            order: allSync[ORDER_KEY] || items.map(p => p.id),
            prompts: finalPrompts,
            customRecipes: finalRecipes,
            all: items.length > 0 ? items : [...finalPrompts, ...finalRecipes]
        };
    },

    /**
     * Import prompts and recipes from a backup JSON.
     */
    async importAll(data) {
        let importedList = [];
        if (Array.isArray(data)) {
            importedList = data;
        } else if (data && typeof data === 'object') {
            if (Array.isArray(data.all)) {
                importedList = data.all;
            } else {
                const pList = Array.isArray(data.prompts) ? data.prompts : [];
                const rList = Array.isArray(data.customRecipes) ? data.customRecipes : [];
                importedList = [...pList, ...rList];
            }
        }

        if (importedList.length > 0) {
            await this.save(importedList);
            return importedList;
        }
        return null;
    },

    /**
     * Sync prompts to a Secret GitHub Gist with rich v2.1 envelope schema.
     */
    async syncGist(items) {
        if (!ext?.storage?.local) return;
        const local = await ext.storage.local.get(['github_pat', 'github_gist_id']);
        const token = local?.github_pat;
        if (!token) return;

        const resolveCategory = (p) => {
            if (p.category) return p.category;
            const isCustom = p.isCustomRecipe || (typeof p.id === 'string' && p.id.startsWith(RECIPE_KEY_PREFIX));
            if (isCustom) return 'Eigene';
            if (p.family === 'respond') return 'PR & Medien';
            if (p.family === 'review') return 'Review & Audit';
            if (p.family === 'plan') return 'Planung & Strategie';
            if (p.family === 'custom') return 'Eigene';
            return 'Eigene';
        };

        const formattedItems = (items || []).map(p => {
            const isMultiTurn = Boolean((p.turns && p.turns.length > 0) || p.isCustomRecipe || (typeof p.id === 'string' && p.id.startsWith(RECIPE_KEY_PREFIX)));

            let turns = [];
            if (Array.isArray(p.turns) && p.turns.length > 0) {
                turns = p.turns.map((t, idx) => ({
                    step: idx + 1,
                    title: t.title || `Schritt ${idx + 1}`,
                    content: t.content || (t.chunks && t.chunks[0]?.text) || ''
                }));
            }

            let expressText = '';
            if (isMultiTurn && turns.length > 0) {
                expressText = turns
                    .map(t => `${t.title ? `### ${t.title}\n` : ''}${t.content || ''}`.trim())
                    .filter(Boolean)
                    .join('\n\n---\n\n');
                if (!expressText && p.content) {
                    expressText = p.content;
                }
            } else {
                expressText = p.content || '';
            }

            return {
                id: p.id || '',
                name: p.name || 'Prompt',
                category: resolveCategory(p),
                isMultiTurn,
                turns,
                express: expressText
            };
        });

        const v21Payload = {
            version: "2.1",
            exportedAt: new Date().toISOString(),
            items: formattedItems
        };

        const fileContent = JSON.stringify(v21Payload, null, 2);
        const payload = {
            description: "PromptDock Prompts Sync v2.1",
            public: false,
            files: {
                "prompts": { content: fileContent }
            }
        };

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        if (local.github_gist_id) {
            try {
                const res = await fetch(`https://api.github.com/gists/${local.github_gist_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) return;
            } catch (err) {
                console.warn('[PromptDock] Gist update failed, creating new gist:', err);
            }
        }

        try {
            const res = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                if (data.id) {
                    await ext.storage.local.set({ github_gist_id: data.id });
                }
            }
        } catch (err) {
            console.error('[PromptDock] Gist creation failed:', err);
        }
    }
};

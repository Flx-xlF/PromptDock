/**
 * Cross-browser extension API abstraction layer.
 * Resolves Mozilla `browser` or Chromium `chrome` namespace transparently.
 */
export const ext = (globalThis.browser?.storage ? globalThis.browser : globalThis.chrome) || {};

/** Prefix used for chunked individual prompt storage keys in chrome.storage.sync */
export const PROMPT_KEY_PREFIX = 'p_';

/** Prefix used for custom multi-turn recipe storage keys in chrome.storage.local */
export const RECIPE_KEY_PREFIX = 'r_';

/** Key that stores the ordered array of prompt IDs */
export const ORDER_KEY = 'prompt_order';

/**
 * StorageAdapter provides a unified interface with graceful degradation.
 * Tries chrome.storage.sync first (enabling cross-device sync within browser profile).
 * Automatically falls back to chrome.storage.local or localStorage if sync is unavailable.
 */
export const StorageAdapter = {
    _useSync: true,

    /**
     * Retrieve items from storage.
     * @param {string|string[]|null} keys - Keys to retrieve, or null for all items.
     * @returns {Promise<Object>} Stored key-value pairs.
     */
    async get(keys) {
        if (ext?.storage) {
            try {
                if (this._useSync && ext.storage.sync) return await ext.storage.sync.get(keys);
            } catch (e) {
                console.warn('[PromptDock] Sync storage failed, falling back to local:', e);
                this._useSync = false;
            }
            if (ext.storage.local) {
                try {
                    return await ext.storage.local.get(keys);
                } catch (e) {
                    console.warn('[PromptDock] Local storage failed:', e);
                }
            }
        }

        // Standalone preview / tab fallback (localStorage)
        try {
            if (keys === null) {
                const res = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    try { res[k] = JSON.parse(localStorage.getItem(k)); } catch { res[k] = localStorage.getItem(k); }
                }
                return res;
            }
            if (typeof keys === 'string') {
                const item = localStorage.getItem(keys);
                try { return { [keys]: JSON.parse(item) }; } catch { return { [keys]: item }; }
            }
            if (Array.isArray(keys)) {
                const res = {};
                for (const k of keys) {
                    const item = localStorage.getItem(k);
                    try { res[k] = JSON.parse(item); } catch { res[k] = item; }
                }
                return res;
            }
        } catch (e) {}
        return {};
    },

    /**
     * Store items in storage.
     * @param {Object} items - Object containing key-value pairs to set.
     */
    async set(items) {
        if (ext?.storage) {
            try {
                if (this._useSync && ext.storage.sync) return await ext.storage.sync.set(items);
            } catch (e) {
                console.warn('[PromptDock] Sync storage failed, falling back to local:', e);
                this._useSync = false;
            }
            if (ext.storage.local) {
                try {
                    return await ext.storage.local.set(items);
                } catch (e) {
                    console.warn('[PromptDock] Local storage failed:', e);
                }
            }
        }

        // Standalone preview / tab fallback (localStorage)
        try {
            for (const [k, v] of Object.entries(items || {})) {
                localStorage.setItem(k, JSON.stringify(v));
            }
        } catch (e) {}
    },

    /**
     * Remove items from storage.
     * @param {string|string[]} keys - Key or keys to remove.
     */
    async remove(keys) {
        if (ext?.storage) {
            try {
                if (this._useSync && ext.storage.sync) return await ext.storage.sync.remove(keys);
            } catch (e) {
                console.warn('[PromptDock] Sync storage failed, falling back to local:', e);
                this._useSync = false;
            }
            if (ext.storage.local) {
                try {
                    return await ext.storage.local.remove(keys);
                } catch (e) {
                    console.warn('[PromptDock] Local storage failed:', e);
                }
            }
        }

        // Standalone preview / tab fallback (localStorage)
        try {
            const list = Array.isArray(keys) ? keys : [keys];
            for (const k of list) localStorage.removeItem(k);
        } catch (e) {}
    }
};


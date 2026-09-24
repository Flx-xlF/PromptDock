/**
 * Cross-browser extension API abstraction layer.
 * Resolves Mozilla `browser` or Chromium `chrome` namespace transparently.
 */
export const ext = globalThis.browser?.storage ? globalThis.browser : chrome;

/** Prefix used for chunked individual prompt storage keys in chrome.storage.sync */
export const PROMPT_KEY_PREFIX = 'p_';

/** Key that stores the ordered array of prompt IDs */
export const ORDER_KEY = 'prompt_order';

/**
 * StorageAdapter provides a unified interface with graceful degradation.
 * Tries chrome.storage.sync first (enabling cross-device sync within browser profile).
 * Automatically falls back to chrome.storage.local if sync quota is exceeded or unavailable.
 */
export const StorageAdapter = {
    _useSync: true,

    /**
     * Retrieve items from storage.
     * @param {string|string[]|null} keys - Keys to retrieve, or null for all items.
     * @returns {Promise<Object>} Stored key-value pairs.
     */
    async get(keys) {
        try {
            if (this._useSync) return await ext.storage.sync.get(keys);
        } catch (e) {
            console.warn('[PromptDock] Sync storage failed, falling back to local:', e);
            this._useSync = false;
        }
        return await ext.storage.local.get(keys);
    },

    /**
     * Store items in storage.
     * @param {Object} items - Object containing key-value pairs to set.
     */
    async set(items) {
        try {
            if (this._useSync) return await ext.storage.sync.set(items);
        } catch (e) {
            console.warn('[PromptDock] Sync storage failed, falling back to local:', e);
            this._useSync = false;
        }
        return await ext.storage.local.set(items);
    },

    /**
     * Remove items from storage.
     * @param {string|string[]} keys - Key or keys to remove.
     */
    async remove(keys) {
        try {
            if (this._useSync) return await ext.storage.sync.remove(keys);
        } catch (e) {
            console.warn('[PromptDock] Sync storage failed, falling back to local:', e);
            this._useSync = false;
        }
        return await ext.storage.local.remove(keys);
    }
};


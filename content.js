/**
 * PromptDock — Content Script
 * 
 * Injected into supported AI platforms (Microsoft Copilot, Google Gemini).
 * Responsibilities:
 * 1. Platform Detection: Matches dynamic DOM signatures and URL patterns.
 * 2. Prompt Injection: Injects prompts directly into contenteditable or textarea inputs,
 *    triggering native framework input events.
 * 3. Shadow DOM Isolation: Renders all extension UI elements (FAB, modals, diff views)
 *    inside a closed ShadowRoot to prevent host page CSS collisions.
 * 4. Inline Commenting & Quick Actions: Detects text selections and displays floating
 *    actions for one-click rewrites (e.g. "sachlicher", "einkürzen") and custom instructions.
 * 5. Visual Diff Modal: Renders side-by-side / inline diffs of AI-modified text.
 */

if (!window._uapInjected) {
window._uapInjected = true;
const ID_PREFIX = 'uap-' + Math.random().toString(36).substring(2, 9) + '-';

const PLATFORM_CONFIGS = {
    copilot: {
        isMatch: () => window.location.hostname.includes("copilot") || window.name.includes("embedded-page-container") || !!document.querySelector('.fai-EditorInput__input') || !!document.getElementById('m365-chat-input-shared-wrapper'),
        selectors: {
            input: '#m365-chat-input-shared-wrapper [contenteditable="true"], #m365-chat-input-shared-wrapper textarea, .fai-ExpandableChatInput__inputWrapper [contenteditable="true"], .fai-ChatInput__inputWrapper [contenteditable="true"], .fai-EditorInput__input, [contenteditable="true"][aria-label*="Copilot" i], textarea[aria-label*="Copilot" i]',
            sendBtn: 'button.fai-SendButton, button.fai-ChatInput__send, button[aria-label*="Senden" i], button[aria-label*="Send" i], button[title*="Senden" i], button[title*="Send" i]',
            messageContainers: '.fai-Message, .ac-container, .fai-ChatMessage, [role="listitem"], [data-content-id], [data-message-id], .chat-message',
            chatContainer: '.fai-ChatMessages__list',
            messageSelector: '.fai-Message, .fai-ChatMessage, [role="listitem"]'
        },
        urlPatterns: ['outlook.cloud.microsoft', 'm365.cloud.microsoft', 'teams.microsoft.com', 'outlook.office.com', 'outlook.office365.com', 'outlook.live.com', 'outlook.com', 'copilot.microsoft.com', 'copilot.cloud.microsoft'],
        quickActions: ['sachlicher', 'einkürzen', 'positiv formulieren', 'empathischer', 'verständlicher'],
        requiresIframe: false, // Changed to false: Copilot UI might be in the main frame now
        name: "Outlook Copilot"
    },
    gemini: {
        isMatch: () => window.location.hostname === 'gemini.google.com',
        selectors: {
            input: 'div.ql-editor[role="textbox"]',
            sendBtn: 'gem-icon-button.send-button button',
            messageContainers: 'user-query, model-response',
            chatContainer: 'infinite-scroller.chat-history, main',
            messageSelector: 'model-response, user-query'
        },
        urlPatterns: ['gemini.google.com'],
        quickActions: ['sachlicher', 'einkürzen', 'positiv formulieren', 'empathischer', 'verständlicher'],
        requiresIframe: false,
        name: "Google Gemini"
    },
    chatgpt: {
        isMatch: () => window.location.hostname === 'chatgpt.com' || window.location.hostname.endsWith('.chatgpt.com') || window.location.hostname === 'chat.openai.com' || window.location.hostname.endsWith('.chat.openai.com'),
        selectors: {
            input: '#prompt-textarea, textarea[aria-label*="ChatGPT" i], textarea[placeholder*="ChatGPT" i], textarea#mobile-composer-prompt, div#prompt-textarea[contenteditable="true"]',
            sendBtn: 'button[aria-label="Send message"], button[aria-label="Send prompt"], button[data-testid="send-button"], button[data-testid="fruitjuice-send-button"]',
            messageContainers: 'article, li[data-message-role="assistant"], [data-message-author-role="assistant"], [data-message-author-role="user"], li[data-message-role="user"]',
            chatContainer: 'ol[data-conversation-transcript], main',
            messageSelector: 'article, [data-message-author-role]'
        },
        urlPatterns: ['chatgpt.com', 'chat.openai.com'],
        quickActions: ['sachlicher', 'einkürzen', 'positiv formulieren', 'empathischer', 'verständlicher'],
        requiresIframe: false,
        name: "ChatGPT"
    },
    claude: {
        isMatch: () => window.location.hostname === 'claude.ai' || window.location.hostname.endsWith('.claude.ai'),
        selectors: {
            input: 'div.ProseMirror[contenteditable="true"], fieldset div[contenteditable="true"], div[contenteditable="true"][role="textbox"], div[contenteditable="true"]',
            sendBtn: 'button[aria-label="Send Message"], button[aria-label="Send message"], button[aria-label*="Send" i], button[data-testid="send-button"]',
            messageContainers: '.font-user-message, div[data-testid="user-message"], .font-claude-message, div[data-testid="claude-message"], div.standard-markdown',
            chatContainer: 'main, div[data-testid="chat-messages"]',
            messageSelector: '.font-user-message, .font-claude-message, div[data-testid$="-message"]'
        },
        urlPatterns: ['claude.ai'],
        quickActions: ['sachlicher', 'einkürzen', 'positiv formulieren', 'empathischer', 'verständlicher'],
        requiresIframe: false,
        name: "Claude"
    }
};

/** Check if a URL matches any known platform. Used by popup.js and background.js. */
function matchesPlatformUrl(urlStr) {
    if (!urlStr) return false;
    try {
        const url = new URL(urlStr);
        for (const key in PLATFORM_CONFIGS) {
            if (PLATFORM_CONFIGS[key].urlPatterns.some(pattern => url.hostname === pattern || url.hostname.endsWith('.' + pattern))) {
                return true;
            }
        }
    } catch(e) {}
    return false;
}

let PLATFORM = null;
for (const key in PLATFORM_CONFIGS) {
    if (PLATFORM_CONFIGS[key].isMatch()) {
        PLATFORM = PLATFORM_CONFIGS[key];
        break;
    }
}

window.injectCopilotPrompt = function(promptText, autoSend) {
    if (!PLATFORM) {
        for (const key in PLATFORM_CONFIGS) {
            if (PLATFORM_CONFIGS[key].isMatch()) {
                PLATFORM = PLATFORM_CONFIGS[key];
                break;
            }
        }
        if (!PLATFORM) {
            PLATFORM = PLATFORM_CONFIGS.copilot; // fallback
        }
    }
    
    console.log(`[PromptDock] Checking frame for ${PLATFORM.name}...`, window.location.href);
    
    // --- CRITICAL SECURITY SANDBOX ---
    const isIframe = window !== window.top;
    
    if (PLATFORM.requiresIframe && !isIframe) {
        // Obsolete block for Copilot, but kept for future strict iframe platforms
        console.log(`[PromptDock] Execution blocked: Main window detected for ${PLATFORM.name}.`);
        return false;
    }
    
    let inputField = document.querySelector(PLATFORM.selectors.input);
    if (!inputField && (PLATFORM === PLATFORM_CONFIGS.copilot)) {
        inputField = document.querySelector('.fai-EditorInput__input');
    }
    if (!inputField && (PLATFORM === PLATFORM_CONFIGS.chatgpt)) {
        inputField = document.querySelector('#prompt-textarea') || document.querySelector('textarea');
    }
    if (!inputField && (PLATFORM === PLATFORM_CONFIGS.claude)) {
        inputField = document.querySelector('div[contenteditable="true"]');
    }
    
    if (!inputField && PLATFORM.requiresIframe && !window.name.includes("embedded-page-container")) {
        // Fallback name check for strict iframe platforms
        return false;
    }
    
    if (!inputField) {
        return false;
    }
    
    console.log(`[PromptDock] Found input field for ${PLATFORM.name}!`);
    
    // --- Step 2: Inject Prompt ---
    inputField.focus();
    if (inputField.isContentEditable) {
        // 1. Clear existing content completely first
        try {
            const selection = window.getSelection();
            selection.selectAllChildren(inputField);
            document.execCommand('delete', false, null);
        } catch (e) {}

        let inserted = false;

        // Method A: Synthetic Paste Event (preferred for rich-text editors like ProseMirror / Lexical)
        try {
            const dt = new DataTransfer();
            dt.setData('text/plain', promptText);
            const pasteEvt = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dt
            });
            inputField.dispatchEvent(pasteEvt);

            // Crucial: Check if the editor actually inserted the text!
            // When ProseMirror/Lexical handles paste, it calls preventDefault() and inserts content synchronously.
            const contentNow = (inputField.innerText || inputField.textContent || '').trim();
            if (contentNow.length > 0 && (contentNow.includes(promptText.slice(0, 30)) || contentNow.length >= Math.min(promptText.length, 40))) {
                inserted = true;
            }
        } catch (e) {
            inserted = false;
        }

        // Method B: insertHTML with proper line breaks (ONLY if paste was not handled)
        if (!inserted) {
            try {
                const selection = window.getSelection();
                selection.selectAllChildren(inputField);

                const html = promptText
                    .split('\n')
                    .map(line => {
                        const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        return escaped ? `<div>${escaped}</div>` : '<div><br></div>';
                    })
                    .join('');

                inserted = document.execCommand && document.execCommand('insertHTML', false, html);
                const contentNow = (inputField.innerText || inputField.textContent || '').trim();
                if (contentNow.length > 0) {
                    inserted = true;
                }
            } catch (e) {
                inserted = false;
            }
        }

        // Method C: Direct DOM Replacement Fallback
        if (!inserted) {
            try {
                inputField.replaceChildren();
                const lines = promptText.split('\n');
                lines.forEach((line) => {
                    const div = document.createElement('div');
                    if (line) {
                        div.textContent = line;
                    } else {
                        div.appendChild(document.createElement('br'));
                    }
                    inputField.appendChild(div);
                });
                inserted = true;
            } catch (e) {}
        }

        // Dispatch input and change events so frameworks (React, Angular, Lit) detect value update
        inputField.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: promptText }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
        // Textarea / input element (React synthetic event bypass)
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set ||
                             Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeSetter) {
            nativeSetter.call(inputField, promptText);
        } else {
            inputField.value = promptText;
        }
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (autoSend) {
        const attempts = [250, 500, 800, 1200];
        const trySend = (attemptIdx) => {
            if (attemptIdx >= attempts.length) return;
            const delay = attemptIdx === 0 ? attempts[0] : (attempts[attemptIdx] - attempts[attemptIdx - 1]);
            setTimeout(() => {
                const sendBtn = document.querySelector(PLATFORM.selectors.sendBtn);
                if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true') {
                    sendBtn.click();
                    console.log(`[PromptDock] Auto-send clicked for ${PLATFORM.name} on attempt ${attemptIdx + 1}.`);
                } else {
                    trySend(attemptIdx + 1);
                }
            }, delay);
        };
        trySend(0);
    }
    
    return true;
};

// --- INLINE COMMENTING FEATURE ---

if (PLATFORM) {
    const isIframe = window !== window.top;
    if (!PLATFORM.requiresIframe || isIframe) {
        setTimeout(() => {
            if (PLATFORM !== PLATFORM_CONFIGS.copilot || document.querySelector(PLATFORM.selectors.input) || window.name.includes("embedded-page-container")) {
                initInlineComments();
            }
        }, 1000);
    }
}

function initInlineComments() {
    const platformName = PLATFORM ? PLATFORM.name : 'Unknown';
    console.log(`[PromptDock] Initializing Inline Comments for ${platformName}...`);

    // 1. Create UI Elements within a ShadowRoot
    const shadowHost = document.createElement('div');
    shadowHost.id = ID_PREFIX + 'uap-extension-root';
    document.body.appendChild(shadowHost);
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    window._uapShadowRoot = shadowRoot;
    
    // Inject the CSS into the ShadowRoot
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    const ext = typeof browser !== 'undefined' ? browser : chrome;
    cssLink.href = ext.runtime.getURL('content.css');
    shadowRoot.appendChild(cssLink);

    const fab = document.createElement('div');
    fab.id = ID_PREFIX + 'copilot-inline-fab';
    fab.className = 'copilot-inline-fab-class';
    
    const svgNS = "http://www.w3.org/2000/svg";
    const fabSvg = document.createElementNS(svgNS, "svg");
    fabSvg.setAttribute("class", "fab-icon");
    fabSvg.setAttribute("viewBox", "0 0 24 24");
    fabSvg.setAttribute("fill", "none");
    fabSvg.setAttribute("stroke", "currentColor");
    fabSvg.setAttribute("stroke-width", "2");
    
    const fabPath = document.createElementNS(svgNS, "path");
    fabPath.setAttribute("d", "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z");
    fabSvg.appendChild(fabPath);
    
    fab.appendChild(fabSvg);
    fab.appendChild(document.createTextNode(' Kommentar'));
    shadowRoot.appendChild(fab);

    const backdrop = document.createElement('div');
    backdrop.id = ID_PREFIX + 'copilot-modal-backdrop';
    backdrop.className = 'copilot-modal-backdrop-class';
    shadowRoot.appendChild(backdrop);
    
    backdrop.addEventListener('click', () => {
        if (modal.style.display === 'flex') modal.querySelector('.cancel').click();
    });

    const modal = document.createElement('div');
    modal.id = ID_PREFIX + 'copilot-inline-modal';
    modal.className = 'copilot-inline-modal-class';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Add Comment');
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'modal-drag-handle';
    const dragIndicator = document.createElement('div');
    dragIndicator.className = 'modal-drag-indicator';
    dragHandle.appendChild(dragIndicator);
    modal.appendChild(dragHandle);
    
    const qaContainer = document.createElement('div');
    qaContainer.className = 'modal-quick-actions';
    const quickActions = PLATFORM ? PLATFORM.quickActions : ['sachlicher', 'einkürzen', 'positiv formulieren', 'empathischer', 'verständlicher'];
    quickActions.forEach(a => {
        const span = document.createElement('span');
        span.textContent = a;
        qaContainer.appendChild(span);
    });
    modal.appendChild(qaContainer);
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Instruction (e.g. make this more positive)';
    modal.appendChild(textarea);
    
    const hint = document.createElement('div');
    hint.className = 'modal-keyboard-hint';
    hint.textContent = 'Enter ↵';
    modal.appendChild(hint);
    
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    
    const btnDelete = document.createElement('button');
    btnDelete.className = 'delete';
    btnDelete.textContent = 'Delete';
    actions.appendChild(btnDelete);
    
    const btnCancel = document.createElement('button');
    btnCancel.className = 'cancel';
    btnCancel.textContent = 'Cancel';
    actions.appendChild(btnCancel);
    
    const btnSave = document.createElement('button');
    btnSave.className = 'save';
    btnSave.textContent = 'Save';
    actions.appendChild(btnSave);
    
    modal.appendChild(actions);
    shadowRoot.appendChild(modal);

    const diffModal = document.createElement('div');
    diffModal.id = ID_PREFIX + 'copilot-diff-modal';
    diffModal.className = 'copilot-diff-modal-class';
    diffModal.setAttribute('role', 'dialog');
    diffModal.setAttribute('aria-label', 'View Changes');
    
    const diffHeader = document.createElement('div');
    diffHeader.id = ID_PREFIX + 'copilot-diff-modal-header';
    diffHeader.className = 'copilot-diff-modal-header-class';
    
    const diffTitle = document.createElement('span');
    diffTitle.textContent = `Changes Made by ${platformName}`;
    diffHeader.appendChild(diffTitle);
    
    const diffClose = document.createElement('button');
    diffClose.id = ID_PREFIX + 'copilot-diff-modal-close';
    diffClose.className = 'copilot-diff-modal-close-class';
    diffClose.textContent = '×';
    diffHeader.appendChild(diffClose);
    
    diffModal.appendChild(diffHeader);
    
    const diffContent = document.createElement('div');
    diffContent.id = ID_PREFIX + 'copilot-diff-content';
    diffContent.className = 'copilot-diff-content-class';
    diffModal.appendChild(diffContent);
    
    shadowRoot.appendChild(diffModal);
    
    diffClose.addEventListener('click', () => {
        diffModal.style.display = 'none';
    });

    // Modal Focus Trap
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            const focusable = modal.querySelectorAll('textarea, button, [tabindex]:not([tabindex="-1"])');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (shadowRoot.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                }
            } else {
                if (shadowRoot.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (diffModal.style.display === 'flex') diffModal.style.display = 'none';
            if (modal.style.display === 'flex') modal.querySelector('.cancel').click();
        }
    });
    
    const rewriteContainer = document.createElement('div');
    rewriteContainer.id = ID_PREFIX + 'copilot-rewrite-container';
    rewriteContainer.className = 'copilot-rewrite-container-class';
    
    const rewriteBtn = document.createElement('button');
    rewriteBtn.className = 'copilot-rewrite-btn hidden';
    rewriteBtn.textContent = 'Mit Kommentaren umschreiben';
    rewriteContainer.appendChild(rewriteBtn);
    
    shadowRoot.appendChild(rewriteContainer);
    window._uapComments = window._uapComments || [];

    // --- W3C Web Annotation (TextQuoteSelector) & Robust Anchoring Helpers ---

    function getMessageNodes() {
        return Array.from(document.querySelectorAll(PLATFORM ? PLATFORM.selectors.messageContainers : '.fai-Message, .ac-container, .fai-ChatMessage, [role="listitem"]'));
    }

    function getW3CContextAndOffsets(range) {
        let firstNode = range.commonAncestorContainer;
        if (firstNode.nodeType === Node.TEXT_NODE) firstNode = firstNode.parentNode;
        let messageNode = firstNode.closest(PLATFORM ? PLATFORM.selectors.messageContainers : '.fai-Message, .ac-container, .fai-ChatMessage, [role="listitem"]') || document.body;
        
        const messageNodes = getMessageNodes();
        const messageIndex = messageNodes.indexOf(messageNode);

        let currentIndex = 0;
        let start = 0;
        let end = 0;
        let fullText = "";
        
        function walk(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node === range.startContainer) start = currentIndex + range.startOffset;
                if (node === range.endContainer) end = currentIndex + range.endOffset;
                fullText += node.textContent;
                currentIndex += node.textContent.length;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const display = window.getComputedStyle(node).display;
                const isBlock = display.includes('block') || display === 'flex' || display === 'grid' || ['BR', 'P', 'DIV', 'LI'].includes(node.tagName);
                
                if (isBlock && currentIndex > 0 && !node.previousSibling) {
                    fullText += '\n';
                    currentIndex += 1;
                }
                for (let child of node.childNodes) walk(child);
                if (isBlock && currentIndex > 0) {
                    fullText += '\n';
                    currentIndex += 1;
                }
            }
        }
        walk(messageNode);
        
        let exact = fullText.substring(start, end);
        let prefixContext = fullText.substring(0, start).slice(-60); // Exact slice, no space normalization!
        let suffixContext = fullText.substring(end).slice(0, 60);
        
        return { messageIndex, start, end, exact, prefixContext, suffixContext };
    }

    function createRangeFromOffsets(messageNode, start, end) {
        const range = document.createRange();
        let currentIndex = 0;
        let startSet = false;
        let endSet = false;
        
        function walk(node) {
            if (startSet && endSet) return;
            
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeLength = node.textContent.length;
                if (!startSet && start <= currentIndex + nodeLength) {
                    range.setStart(node, Math.max(0, start - currentIndex));
                    startSet = true;
                }
                if (!endSet && end <= currentIndex + nodeLength) {
                    range.setEnd(node, Math.max(0, end - currentIndex));
                    endSet = true;
                }
                currentIndex += nodeLength;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const display = window.getComputedStyle(node).display;
                const isBlock = display.includes('block') || display === 'flex' || display === 'grid' || ['BR', 'P', 'DIV', 'LI'].includes(node.tagName);
                
                if (isBlock && currentIndex > 0 && !node.previousSibling) currentIndex += 1;
                for (let child of node.childNodes) walk(child);
                if (isBlock && currentIndex > 0) {
                    currentIndex += 1;
                }
            }
        }
        walk(messageNode);
        return (startSet && endSet) ? range : null;
    }

    function rehydrateRanges() {
        const messageNodes = getMessageNodes();
        let changed = false;
        
        window._uapComments.forEach(c => {
            let messageNode = document.body;
            if (c.messageIndex !== undefined && c.messageIndex >= 0 && c.messageIndex < messageNodes.length) {
                messageNode = messageNodes[c.messageIndex];
            }
            const newRange = createRangeFromOffsets(messageNode, c.start, c.end);
            if (newRange) {
                c.range = newRange;
                changed = true;
            }
        });
        
        if (changed) updateHighlights();
    }

    // Setup Mutation Observer for Rehydration
    let rehydrateTimeout = null;
    const rehydrateObserver = new MutationObserver(() => {
        clearTimeout(rehydrateTimeout);
        rehydrateTimeout = setTimeout(rehydrateRanges, 100);
    });
    // Start observing when body is ready, or chat container
    const rootContainer = document.querySelector(PLATFORM ? PLATFORM.selectors.chatContainer : '.fai-ChatMessages__list') || document.body;
    rehydrateObserver.observe(rootContainer, { childList: true, subtree: true });


    function updateHighlights(pendingRange = null) {
        if (!CSS.highlights) return;
        
        try {
            const commentRanges = window._uapComments.map(c => c.range).filter(r => r && r.startContainer); 
            const commentHighlight = new Highlight(...commentRanges);
            CSS.highlights.set('copilot-comment', commentHighlight);

            if (pendingRange) {
                const pendingHighlight = new Highlight(pendingRange);
                CSS.highlights.set('copilot-pending', pendingHighlight);
            } else {
                CSS.highlights.delete('copilot-pending');
            }
        } catch (e) {
            console.error("Highlight API error:", e);
        }
    }

    let currentRange = null;
    let pendingGroupId = null;

    // 2. Selection Listener
    document.addEventListener('mouseup', (e) => {
        if (fab.contains(e.target) || modal.contains(e.target) || rewriteContainer.contains(e.target) || backdrop.contains(e.target)) {
            return;
        }

        setTimeout(() => {
            const selection = window.getSelection();
            if (selection.toString().trim().length > 0) {
                currentRange = selection.getRangeAt(0).cloneRange();
                const rect = currentRange.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    fab.style.top = `${Math.max(0, rect.top - 35)}px`;
                    fab.style.left = `${rect.left + (rect.width / 2) - 35}px`;
                    fab.style.display = 'flex';
                }
            } else {
                fab.style.display = 'none';
                if (modal.style.display !== 'flex') backdrop.style.display = 'none';
            }
        }, 10);
    }, true); 

    let selectionTimeout;
    document.addEventListener('selectionchange', () => {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(() => {
            const selection = window.getSelection();
            if (selection.toString().trim().length === 0) {
                if (modal.style.display !== 'flex') fab.style.display = 'none';
            } else if (modal.style.display !== 'flex') {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    currentRange = range.cloneRange();
                    fab.style.top = `${Math.max(0, rect.top - 35)}px`;
                    fab.style.left = `${rect.left + (rect.width / 2) - 35}px`;
                    fab.style.display = 'flex';
                }
            }
        }, 150);
    }, true); 

    // 3. Handle FAB Click (and prevent selection clearing)
    fab.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
    });

    fab.addEventListener('click', () => {
        if (currentRange) {
            const rangeRect = currentRange.getBoundingClientRect();
            let modalLeft = Math.max(10, rangeRect.left);
            if (modalLeft + 280 > window.innerWidth - 10) {
                modalLeft = window.innerWidth - 280 - 10;
            }
            modal.style.top = `${rangeRect.bottom + 10}px`;
            modal.style.left = `${modalLeft}px`;
        } else {
            const fabRect = fab.getBoundingClientRect();
            let modalLeft = Math.max(10, fabRect.left);
            if (modalLeft + 280 > window.innerWidth - 10) {
                modalLeft = window.innerWidth - 280 - 10;
            }
            modal.style.top = `${fabRect.bottom + 10}px`;
            modal.style.left = `${modalLeft}px`;
        }
        
        modal.style.display = 'flex';
        backdrop.style.display = 'block';
        fab.style.display = 'none';
        
        if (currentRange) {
            pendingGroupId = 'group-' + Math.random().toString(36).substring(2, 9);
            updateHighlights(currentRange);
        }
        
        modal.querySelector('.delete').style.display = 'none';
        const textarea = modal.querySelector('textarea');
        textarea.value = '';
        textarea.focus();
        window.getSelection().removeAllRanges();
    });

    // 4. Handle Modal Cancel
    modal.querySelector('.cancel').addEventListener('click', () => {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
        currentRange = null;
        pendingGroupId = null;
        updateHighlights();
    });

    // 5. Handle Modal Save
    modal.querySelector('.save').addEventListener('click', () => {
        const comment = modal.querySelector('textarea').value.trim();
        if (comment && currentRange) {
            const { messageIndex, start, end, exact, prefixContext, suffixContext } = getW3CContextAndOffsets(currentRange);
            
            window._uapComments.push({
                id: pendingGroupId,
                range: currentRange,
                start: start,
                end: end,
                messageIndex: messageIndex,
                exact: exact,
                prefixContext: prefixContext,
                suffixContext: suffixContext,
                comment: comment
            });
            
            const chatContainer = document.querySelector(PLATFORM ? PLATFORM.selectors.chatContainer : '.fai-ChatMessages__list') || document.body;
            rewriteContainer.querySelector('.copilot-rewrite-btn').classList.remove('hidden');
        }
        
        currentRange = null;
        pendingGroupId = null;
        updateHighlights();
        
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    });

    // 4b. Modal Dragging Logic
    // We already have dragHandle from DOM creation
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    dragHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragHandle.style.cursor = 'grabbing';
        const rect = modal.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        e.preventDefault(); // Prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        modal.style.left = `${e.clientX - dragOffsetX}px`;
        modal.style.top = `${e.clientY - dragOffsetY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            dragHandle.style.cursor = 'grab';
        }
    });

    modal.querySelector('textarea').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            modal.querySelector('.save').click();
        }
    });

    // 5b. Quick Actions and Delete Logic
    modal.querySelector('.modal-quick-actions').addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            const textarea = modal.querySelector('textarea');
            const prefix = textarea.value.trim() ? textarea.value.trim() + ", " : "";
            textarea.value = prefix + e.target.innerText;
            textarea.focus();
        }
    });
    modal.querySelector('.delete').addEventListener('click', () => {
        if (pendingGroupId) {
            window._uapComments = window._uapComments.filter(c => c.id !== pendingGroupId);
            
            if (window._uapComments.length === 0) {
                rewriteContainer.querySelector('.copilot-rewrite-btn').classList.add('hidden');
            }
        }
        currentRange = null;
        pendingGroupId = null;
        updateHighlights();
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    });

    document.addEventListener('click', (e) => {
        let clickedRange;
        if (document.caretRangeFromPoint) {
            clickedRange = document.caretRangeFromPoint(e.clientX, e.clientY);
        } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (pos && pos.offsetNode) {
                clickedRange = document.createRange();
                clickedRange.setStart(pos.offsetNode, pos.offset);
                clickedRange.collapse(true);
            }
        }

        if (clickedRange && window._uapComments) {
            const clickedNode = clickedRange.startContainer;
            const clickedOffset = clickedRange.startOffset;
            
            const matchingComment = window._uapComments.find(c => {
                try {
                    return c.range.isPointInRange(clickedNode, clickedOffset);
                } catch(err) {
                    return false;
                }
            });
            
            if (matchingComment) {
                e.stopPropagation();
                e.preventDefault();
                
                pendingGroupId = matchingComment.id;
                currentRange = matchingComment.range;
                
                const rect = currentRange.getBoundingClientRect();
                let modalLeft = Math.max(10, rect.left);
                if (modalLeft + 280 > window.innerWidth - 10) {
                    modalLeft = window.innerWidth - 280 - 10;
                }
                modal.style.top = `${rect.bottom + 10}px`;
                modal.style.left = `${modalLeft}px`;
                
                modal.style.display = 'flex';
                backdrop.style.display = 'block';
                fab.style.display = 'none';
                
                modal.querySelector('.delete').style.display = 'inline-block';
                const textarea = modal.querySelector('textarea');
                textarea.value = matchingComment.comment;
                textarea.focus();
                window.getSelection().removeAllRanges();
            }
        }
    }, true);

    // 6. Compile & Send
    rewriteContainer.querySelector('.copilot-rewrite-btn').addEventListener('click', () => {
        if (!window._uapComments || window._uapComments.length === 0) return;

        const comments = [...window._uapComments].sort((a, b) => a.start - b.start);
        let clusters = [];
        let currentCluster = [];
        
        for (let i = 0; i < comments.length; i++) {
            if (currentCluster.length === 0) {
                currentCluster.push(comments[i]);
            } else {
                let last = currentCluster[currentCluster.length - 1];
                let lastPure = last.prefixContext + last.exact + last.suffixContext;
                let currentPure = comments[i].prefixContext + comments[i].exact + comments[i].suffixContext;
                
                let overlapIndex = -1;
                const minLen = Math.min(lastPure.length, currentPure.length);
                for (let j = minLen; j > 0; j--) {
                    if (lastPure.endsWith(currentPure.substring(0, j))) {
                        overlapIndex = j;
                        break;
                    }
                }
                
                if (overlapIndex > 0) {
                    currentCluster.push(comments[i]);
                } else {
                    clusters.push(currentCluster);
                    currentCluster = [comments[i]];
                }
            }
        }
        if (currentCluster.length > 0) clusters.push(currentCluster);
        
        let finalContexts = [];
        
        clusters.forEach(cluster => {
            let pureChunk = cluster[0].prefixContext + cluster[0].exact + cluster[0].suffixContext;
            
            for (let i = 1; i < cluster.length; i++) {
                let cPure = cluster[i].prefixContext + cluster[i].exact + cluster[i].suffixContext;
                let overlapIndex = -1;
                const minLen = Math.min(pureChunk.length, cPure.length);
                for (let j = minLen; j > 0; j--) {
                    if (pureChunk.endsWith(cPure.substring(0, j))) {
                        overlapIndex = j;
                        break;
                    }
                }
                if (overlapIndex > 0) {
                    pureChunk += cPure.substring(overlapIndex);
                }
            }
            
            let annotatedChunk = pureChunk;
            // Insert backwards to not disturb earlier string indices
            for (let i = cluster.length - 1; i >= 0; i--) {
                let c = cluster[i];
                let searchStr = c.prefixContext + c.exact;
                let idx = annotatedChunk.lastIndexOf(searchStr);
                if (idx !== -1) {
                    let insertPos = idx + searchStr.length;
                    annotatedChunk = annotatedChunk.substring(0, insertPos) + " (( > " + c.comment + " ))" + annotatedChunk.substring(insertPos);
                }
            }
            
            // Clean up excessive newlines generated by block elements
            annotatedChunk = annotatedChunk.replace(/\n{3,}/g, '\n\n');
            
            finalContexts.push(annotatedChunk);
        });

        const finalPrompt = `Überarbeite den folgenden Text basierend auf meinen Kommentaren in den doppelten Klammern (( > ... )).
Gib nur den überarbeiteten Text zurück, keine Erklärungen. 
Die Kommentare (( > ... )) müssen im Zieltext entfernt werden.
Wenn es mehrere Textausschnitte gibt, überarbeite jeden Ausschnitt so, dass er natürlich klingt.

Textausschnitte:
${finalContexts.join('\n\n---\n\n')}`;

        if (window.injectCopilotPrompt) {
            window.injectCopilotPrompt(finalPrompt, false);
            
            const chatContainer = document.querySelector(PLATFORM ? PLATFORM.selectors.chatContainer : '.fai-ChatMessages__list') || document.body;
            let currentMessageCount = chatContainer.querySelectorAll(PLATFORM ? PLATFORM.selectors.messageSelector : '.fai-Message, .fai-ChatMessage').length;
            
            // Disconnect any previous observer to prevent leaks (#2)
            if (window._uapChatObserver) {
                window._uapChatObserver.disconnect();
                if (window._uapStreamObserver) {
                    window._uapStreamObserver.disconnect();
                }
                if (window._uapStreamTimeout) {
                    clearTimeout(window._uapStreamTimeout);
                }
                window._uapChatObserver = null;
            }

            const observer = new MutationObserver((mutations, obs) => {
                let newMessages = chatContainer.querySelectorAll(PLATFORM ? PLATFORM.selectors.messageSelector : '.fai-Message, .fai-ChatMessage');
                if (newMessages.length > currentMessageCount) {
                    let latestMessage = newMessages[newMessages.length - 1];
                    let buttonInjected = false;
                    let lastTextHash = '';
                    
                    const finalize = () => {
                        if (buttonInjected) return;
                        buttonInjected = true;
                        streamObserver.disconnect();
                        obs.disconnect();
                        window._uapChatObserver = null;
                        
                        const btn = document.createElement('button');
                        btn.className = 'copilot-show-diff-btn';
                        btn.innerText = 'View Diff';
                        btn.addEventListener('click', () => {
                            const newText = latestMessage.innerText.replace('View Diff', '').trim();
                            renderWordDiff(originalClean, newText, diffContent);
                            diffModal.style.display = 'flex';
                        });
                        latestMessage.appendChild(btn);
                    };

                    let streamTimeout;
                    const streamObserver = new MutationObserver(() => {
                        const currentText = latestMessage.innerText;
                        if (currentText !== lastTextHash) {
                            lastTextHash = currentText;
                            clearTimeout(streamTimeout);
                            streamTimeout = setTimeout(finalize, 2000);
                            window._uapStreamTimeout = streamTimeout;
                        }
                    });
                    streamObserver.observe(latestMessage, { childList: true, subtree: true, characterData: true });
                    streamTimeout = setTimeout(finalize, 2000);
                    
                    window._uapStreamObserver = streamObserver;
                    window._uapStreamTimeout = streamTimeout;
                }
            });
            observer.observe(chatContainer, { childList: true, subtree: true });
            window._uapChatObserver = observer;

            // Safety net: disconnect after 60 seconds if no response arrives
            setTimeout(() => {
                if (window._uapChatObserver === observer) {
                    observer.disconnect();
                    window._uapChatObserver = null;
                    console.log('[PromptDock] Observer auto-disconnected after timeout.');
                }
            }, 60000);

            rewriteContainer.querySelector('.copilot-rewrite-btn').classList.add('hidden');
        }
    });
}

/**
 * Compute a word-level diff between two strings using Myers algorithm
 * and render directly into the DOM container without innerHTML.
 */
function renderWordDiff(oldStr, newStr, container) {
    container.replaceChildren();
    let oldWords = oldStr.split(/(\s+)/);
    let newWords = newStr.split(/(\s+)/);

    const n = oldWords.length;
    const m = newWords.length;
    const max = n + m;
    const v = { 1: 0 };
    const trace = [];

    let x = 0, y = 0;
    
    // Search for the shortest edit script (SES)
    for (let d = 0; d <= max; d++) {
        trace.push(Object.assign({}, v));
        
        for (let k = -d; k <= d; k += 2) {
            let down = (k === -d || (k !== d && v[k - 1] < v[k + 1]));
            let kPrev = down ? k + 1 : k - 1;
            
            x = v[kPrev];
            if (!down) {
                x++;
            }
            y = x - k;

            while (x < n && y < m && oldWords[x] === newWords[y]) {
                x++; y++;
            }
            v[k] = x;
            
            if (x >= n && y >= m) {
                // Backtrack to find the operations
                let ops = [];
                let currX = n, currY = m;
                for (let dTrace = trace.length - 1; dTrace >= 0; dTrace--) {
                    const tv = trace[dTrace];
                    const kTrace = currX - currY;
                    let tDown = (kTrace === -dTrace || (kTrace !== dTrace && tv[kTrace - 1] < tv[kTrace + 1]));
                    let prevK = tDown ? kTrace + 1 : kTrace - 1;
                    
                    let prevX = tv[prevK];
                    let prevY = prevX - prevK;
                    
                    while (currX > prevX && currY > prevY) {
                        ops.push({ type: 'eq', val: oldWords[currX - 1] });
                        currX--; currY--;
                    }
                    
                    if (dTrace > 0) {
                        if (tDown) {
                            ops.push({ type: 'add', val: newWords[currY - 1] });
                            currY--;
                        } else {
                            ops.push({ type: 'rm', val: oldWords[currX - 1] });
                            currX--;
                        }
                    }
                }
                
                ops.reverse();
                const fragment = document.createDocumentFragment();
                ops.forEach(op => {
                    if (op.type === 'eq') {
                        fragment.appendChild(document.createTextNode(op.val));
                    } else if (op.type === 'add') {
                        const span = document.createElement('span');
                        span.className = 'diff-add';
                        span.textContent = op.val;
                        fragment.appendChild(span);
                    } else if (op.type === 'rm') {
                        const span = document.createElement('span');
                        span.className = 'diff-remove';
                        span.textContent = op.val;
                        fragment.appendChild(span);
                    }
                });
                container.appendChild(fragment);
                return;
            }
        }
    }
}

// ==========================================================================
// PromptDock — Modular Recipe & In-Chat Rail Engine
// ==========================================================================

const RecipeState = {
    activeRecipe: null,
    currentTurnIndex: 0,
    variableValues: {},
    mode: 'guided', // 'guided' | 'autopilot' | 'express'
    status: 'idle', // 'idle' | 'running_turn' | 'checkpoint' | 'completed'
    isMinimized: false,
    customPos: null, // { left: number, top: number } when dragged
    streamCheckInterval: null,
    autoCloseTimer: null,
    autoCloseInterval: null
};

function getOrCreateShadowRoot() {
    if (window._uapShadowRoot) return window._uapShadowRoot;
    let shadowHost = document.getElementById(ID_PREFIX + 'uap-extension-root');
    if (!shadowHost) {
        shadowHost = document.createElement('div');
        shadowHost.id = ID_PREFIX + 'uap-extension-root';
        document.body.appendChild(shadowHost);
    }
    const shadowRoot = shadowHost.shadowRoot || shadowHost.attachShadow({ mode: 'open' });
    if (!shadowRoot.querySelector('link[rel="stylesheet"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        const ext = typeof browser !== 'undefined' ? browser : chrome;
        cssLink.href = ext.runtime.getURL('content.css');
        shadowRoot.appendChild(cssLink);
    }
    window._uapShadowRoot = shadowRoot;
    return shadowRoot;
}

let activeManualStopListener = null;

function cancelWorkflow(triggerEl) {
    if (activeManualStopListener) {
        document.removeEventListener('click', activeManualStopListener, true);
        activeManualStopListener = null;
    }
    if (RecipeState.streamCheckInterval) {
        clearInterval(RecipeState.streamCheckInterval);
        RecipeState.streamCheckInterval = null;
    }
    if (RecipeState.autoCloseTimer) {
        clearTimeout(RecipeState.autoCloseTimer);
        RecipeState.autoCloseTimer = null;
    }
    if (RecipeState.autoCloseInterval) {
        clearInterval(RecipeState.autoCloseInterval);
        RecipeState.autoCloseInterval = null;
    }
    RecipeState.status = 'idle';
    RecipeState.activeRecipe = null;
    RecipeState.isMinimized = false;

    // Immediately hide and disable interactions
    const shadowRoot = getOrCreateShadowRoot();
    const railContainer = shadowRoot ? shadowRoot.querySelector('#promptdock-rail-container') : null;
    if (railContainer) {
        railContainer.style.pointerEvents = 'none';
        railContainer.style.display = 'none';
        railContainer.replaceChildren();
        railContainer.style.opacity = '1';
        railContainer.style.pointerEvents = 'auto';
    }

    if (triggerEl) {
        const directRail = triggerEl.closest ? triggerEl.closest('#promptdock-rail-container') : null;
        if (directRail) {
            directRail.style.pointerEvents = 'none';
            directRail.style.display = 'none';
            directRail.replaceChildren();
        }
    }
}

/** Helper to reliably attach mouse and click actions without interference from drag handlers */
function bindAction(btn, fn) {
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        fn(btn);
    });
}

/**
 * Cross-Platform Generation Completion Detector (Copilot, Gemini, ChatGPT, Claude)
 * Listens for visible active streaming indicators, text stabilization, manual stop clicks,
 * and triggers onComplete when finished.
 */
function observeTurnCompletion(onComplete) {
    if (RecipeState.streamCheckInterval) {
        clearInterval(RecipeState.streamCheckInterval);
        RecipeState.streamCheckInterval = null;
    }
    if (activeManualStopListener) {
        document.removeEventListener('click', activeManualStopListener, true);
        activeManualStopListener = null;
    }

    let isStreaming = false;
    let streamSawStart = false;
    let turnStartTime = Date.now();
    let lastObservedText = '';
    let stableTextCount = 0;

    // Helper: Is any dedicated LLM generation stop button actually visible and active on screen?
    function isStopButtonActive() {
        const stopSelectors = [
            '.fai-StopButton',
            '[data-testid="stop-button"]',
            '.stop-button',
            'button[aria-label*="stop generating" i]',
            'button[aria-label*="stop response" i]',
            'button[aria-label*="stop streaming" i]',
            'button[aria-label*="generierung anhalten" i]',
            'button[aria-label*="generierung stoppen" i]',
            'button[aria-label*="generierung beenden" i]',
            'button[aria-label*="antwort anhalten" i]',
            'button[aria-label*="antwort stoppen" i]',
            'button[title*="generierung anhalten" i]',
            'button[title*="generierung stoppen" i]',
            'button[title*="antwort stoppen" i]',
            'button[title*="antwort anhalten" i]'
        ];
        const els = document.querySelectorAll(stopSelectors.join(', '));
        for (const el of els) {
            // Ignore PromptDock's own UI elements
            if (el.closest('#promptdock-rail-container') || el.closest('[id*="uap-extension-root"]')) continue;
            if (el.disabled || el.getAttribute('aria-hidden') === 'true' || el.getAttribute('aria-disabled') === 'true') continue;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
            if (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0) {
                return true;
            }
        }
        return false;
    }

    // Helper: Check for AI completion cues (e.g. Copilot follow-up suggestions)
    function hasCompletionIndicators() {
        const suggestionSelectors = [
            '.fai-SuggestedPrompts',
            '.fai-SuggestedQuestions',
            '.fai-SuggestionItem',
            '.fai-SuggestionButton',
            'button[data-testid*="suggestion" i]',
            'button[aria-label*="Vorschlag" i]',
            'button[title*="Vorschlag" i]',
            '.fai-FollowUpQuestions'
        ];
        const els = document.querySelectorAll(suggestionSelectors.join(', '));
        for (const el of els) {
            if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                return true;
            }
        }
        return false;
    }

    // Helper: Get text from the latest assistant message
    function getLatestAssistantText() {
        const msgSelectors = PLATFORM ? PLATFORM.selectors.messageContainers : '.fai-Message, .ac-container, .fai-ChatMessage, [role="listitem"]';
        const msgs = document.querySelectorAll(msgSelectors);
        if (msgs.length > 0) {
            return (msgs[msgs.length - 1].textContent || '').trim();
        }
        return '';
    }

    function cleanup() {
        if (activeManualStopListener) {
            document.removeEventListener('click', activeManualStopListener, true);
            activeManualStopListener = null;
        }
        if (RecipeState.streamCheckInterval) {
            clearInterval(RecipeState.streamCheckInterval);
            RecipeState.streamCheckInterval = null;
        }
    }

    // Listen for manual stop button click in chat interface to instantly advance to checkpoint
    const onManualStopClicked = (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.closest('#promptdock-rail-container') || btn.closest('[id*="uap-extension-root"]')) return;

        const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
        const title = (btn.getAttribute('title') || '').toLowerCase();
        const isStopBtn = btn.matches('.fai-StopButton, [data-testid="stop-button"], .stop-button') ||
            aria.includes('generierung anhalten') || aria.includes('generierung stoppen') || aria.includes('generierung beenden') ||
            aria.includes('stop generating') || aria.includes('stop response') || aria.includes('stop streaming') ||
            title.includes('generierung anhalten') || title.includes('generierung stoppen');

        if (isStopBtn) {
            console.log('[PromptDock] Detected manual chat stop by user.');
            cleanup();
            setTimeout(() => {
                if (RecipeState.status === 'running_turn') {
                    onComplete();
                }
            }, 300);
        }
    };
    document.addEventListener('click', onManualStopClicked, true);
    activeManualStopListener = onManualStopClicked;

    const checkGenerationState = () => {
        if (RecipeState.status !== 'running_turn') {
            cleanup();
            return;
        }

        const stopActive = isStopButtonActive();
        const currentText = getLatestAssistantText();
        const hasSuggestions = hasCompletionIndicators();

        if (stopActive) {
            isStreaming = true;
            streamSawStart = true;
            stableTextCount = 0;
            lastObservedText = currentText;
        } else if (isStreaming && !stopActive) {
            // Definite transition: stop button disappeared!
            isStreaming = false;
            cleanup();
            setTimeout(onComplete, 350);
            return;
        }

        // Completion indicator: Copilot follow-up suggestions appeared!
        if (hasSuggestions && (streamSawStart || (Date.now() - turnStartTime > 2000))) {
            cleanup();
            setTimeout(onComplete, 250);
            return;
        }

        // Secondary detection: text stabilization
        if (currentText && currentText === lastObservedText) {
            stableTextCount++;
            // If text has been stable for 4 cycles (~1.2s) without stop button active,
            // OR stable for 6 cycles (~1.8s) regardless
            if ((stableTextCount >= 4 && !stopActive && (streamSawStart || (Date.now() - turnStartTime > 2500))) ||
                (stableTextCount >= 6 && (streamSawStart || (Date.now() - turnStartTime > 3500)))) {
                cleanup();
                setTimeout(onComplete, 300);
                return;
            }
        } else {
            stableTextCount = 0;
            lastObservedText = currentText;
            if (currentText.length > 20) {
                streamSawStart = true;
            }
        }
    };

    // Check every 300ms
    RecipeState.streamCheckInterval = setInterval(checkGenerationState, 300);

    // Timeout safety fallback 1: if no streaming started within 5s
    setTimeout(() => {
        if (!streamSawStart && RecipeState.status === 'running_turn') {
            cleanup();
            onComplete();
        }
    }, 5000);

    // Timeout safety fallback 2: absolute max timeout 30s
    setTimeout(() => {
        if (RecipeState.streamCheckInterval && RecipeState.status === 'running_turn') {
            cleanup();
            onComplete();
        }
    }, 30000);
}

function handleTurnCompletion() {
    if (!RecipeState.activeRecipe) return;
    const recipe = RecipeState.activeRecipe;
    const currentIdx = RecipeState.currentTurnIndex;

    if (currentIdx < recipe.turns.length - 1) {
        RecipeState.currentTurnIndex++;
        if (RecipeState.mode === 'autopilot') {
            RecipeState.status = 'running_turn';
            renderRailUI();
            setTimeout(() => {
                executeNextTurn('');
            }, 1200);
        } else {
            RecipeState.status = 'checkpoint';
            renderRailUI();
        }
    } else {
        RecipeState.status = 'completed';
        renderRailUI();
    }
}

function executeNextTurn(userSteeringNote) {
    if (!RecipeState.activeRecipe) return;
    const recipe = RecipeState.activeRecipe;
    const nextIdx = RecipeState.currentTurnIndex;
    const prevTurnTitle = recipe.turns[nextIdx - 1]?.title;

    const catalog = window.PromptDockCatalog;
    if (!catalog) return;

    const turnPrompt = catalog.compileTurn(recipe, nextIdx, {
        variableValues: RecipeState.variableValues,
        userSteeringNote: userSteeringNote || '',
        previousTurnTitle: prevTurnTitle
    });

    const injected = window.injectCopilotPrompt(turnPrompt, true);
    if (!injected) {
        console.warn('[PromptDock] Turn injection failed in this frame.');
        return;
    }

    RecipeState.status = 'running_turn';
    renderRailUI();
    observeTurnCompletion(() => handleTurnCompletion());
}

function executeFork(outputChunkId, userSteeringNote) {
    if (!RecipeState.activeRecipe) return;
    const catalog = window.PromptDockCatalog;
    if (!catalog) return;

    const chunkDef = catalog.CHUNKS[outputChunkId];
    if (!chunkDef) return;

    const chunkText = typeof chunkDef.compile === 'function' ? chunkDef.compile({}) : chunkDef.text;
    const promptParts = [
        `FORK-OUTPUT: ${chunkDef.title.toUpperCase()}`,
        `BASIS:\nVorangegangene Recherche und Analyse in diesem Chat.`
    ];
    if (userSteeringNote && userSteeringNote.trim()) {
        promptParts.push(`STEUERUNG DURCH NUTZER:\n${userSteeringNote.trim()}`);
    }
    promptParts.push(chunkText);

    const fullPrompt = promptParts.join('\n\n');
    const injected = window.injectCopilotPrompt(fullPrompt, true);
    if (!injected) return;

    RecipeState.status = 'running_turn';
    renderRailUI();
    observeTurnCompletion(() => {
        RecipeState.status = 'completed';
        renderRailUI();
    });
}

let isRailDraggingInitialized = false;

function setupRailDragging(railContainer) {
    if (isRailDraggingInitialized) return;
    isRailDraggingInitialized = true;

    let isDragging = false;
    let startMouseX = 0;
    let startMouseY = 0;
    let startLeft = 0;
    let startTop = 0;

    railContainer.addEventListener('mousedown', (e) => {
        // Prevent drag when clicking on interactive controls
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) {
            return;
        }

        const isHeader = !!e.target.closest('.pd-hud-header');
        const isMin = !!e.target.closest('.pd-hud-dock.pd-minimized');
        if (!isHeader && !isMin) {
            return;
        }

        isDragging = true;
        railContainer.classList.add('pd-dragging');

        const rect = railContainer.getBoundingClientRect();
        startLeft = rect.left;
        startTop = rect.top;
        startMouseX = e.clientX;
        startMouseY = e.clientY;

        // Switch to explicit fixed pixel positioning
        railContainer.style.left = `${startLeft}px`;
        railContainer.style.top = `${startTop}px`;
        railContainer.style.bottom = 'auto';
        railContainer.style.transform = 'none';

        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        const rect = railContainer.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 12;
        const maxTop = window.innerHeight - rect.height - 12;

        newLeft = Math.max(12, Math.min(maxLeft, newLeft));
        newTop = Math.max(12, Math.min(maxTop, newTop));

        railContainer.style.left = `${newLeft}px`;
        railContainer.style.top = `${newTop}px`;
        RecipeState.customPos = { left: newLeft, top: newTop };
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            railContainer.classList.remove('pd-dragging');
        }
    });

    // Double-click on header or pill resets position back to center bottom default
    railContainer.addEventListener('dblclick', (e) => {
        if ((e.target.closest('.pd-hud-header') || e.target.closest('.pd-hud-dock.pd-minimized')) && !e.target.closest('button')) {
            RecipeState.customPos = null;
            railContainer.style.left = '50%';
            railContainer.style.bottom = '84px';
            railContainer.style.top = 'auto';
            railContainer.style.transform = 'translateX(-50%)';
        }
    });
}

function renderRailUI() {
    const shadowRoot = getOrCreateShadowRoot();
    let railContainer = shadowRoot.querySelector('#promptdock-rail-container');
    if (!railContainer) {
        railContainer = document.createElement('div');
        railContainer.id = 'promptdock-rail-container';
        shadowRoot.appendChild(railContainer);
    }
    setupRailDragging(railContainer);

    if (!RecipeState.activeRecipe || RecipeState.status === 'idle') {
        railContainer.style.display = 'none';
        return;
    }

    railContainer.style.display = 'flex';
    railContainer.replaceChildren();

    // Preserve custom drag position if moved, otherwise center at bottom
    if (RecipeState.customPos) {
        const safeLeft = Math.max(12, Math.min(window.innerWidth - 280, RecipeState.customPos.left));
        const safeTop = Math.max(12, Math.min(window.innerHeight - 60, RecipeState.customPos.top));
        railContainer.style.left = `${safeLeft}px`;
        railContainer.style.top = `${safeTop}px`;
        railContainer.style.bottom = 'auto';
        railContainer.style.transform = 'none';
    } else {
        railContainer.style.left = '50%';
        railContainer.style.bottom = '84px';
        railContainer.style.top = 'auto';
        railContainer.style.transform = 'translateX(-50%)';
    }

    const recipe = RecipeState.activeRecipe;
    const currentIdx = RecipeState.currentTurnIndex;
    const totalTurns = recipe.turns.length;

    // --- State A: Minimized Floating Pill ---
    if (RecipeState.isMinimized) {
        const minDock = document.createElement('div');
        minDock.className = 'pd-hud-dock pd-minimized';

        const leftInfo = document.createElement('div');
        leftInfo.className = 'pd-min-left';
        const isCheckpoint = RecipeState.status === 'checkpoint';
        const isCompleted = RecipeState.status === 'completed';
        leftInfo.innerHTML = `
            <span class="pd-drag-handle" title="Ziehen zum Verschieben">
                <svg width="7" height="11" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="2" cy="2" r="1.2"/>
                    <circle cx="6" cy="2" r="1.2"/>
                    <circle cx="2" cy="6" r="1.2"/>
                    <circle cx="6" cy="6" r="1.2"/>
                    <circle cx="2" cy="10" r="1.2"/>
                    <circle cx="6" cy="10" r="1.2"/>
                </svg>
            </span>
            <span class="pd-min-badge">${recipe.name}</span>
            <span class="pd-min-text">${
                isCompleted ? 'Workflow abgeschlossen!' :
                isCheckpoint ? `Bereit für Schritt ${currentIdx + 1}: <strong>${recipe.turns[currentIdx].title}</strong>` :
                `Schritt ${currentIdx + 1} von ${totalTurns} läuft...`
            }</span>
        `;
        minDock.appendChild(leftInfo);

        const rightActions = document.createElement('div');
        rightActions.className = 'pd-min-actions';

        if (isCheckpoint) {
            const sendBtn = document.createElement('button');
            sendBtn.className = 'pd-primary-btn pd-min-send';
            sendBtn.innerHTML = `Weiter ➔ <span class="pd-shortcut">⌥⇧→</span>`;
            bindAction(sendBtn, () => executeNextTurn(''));
            rightActions.appendChild(sendBtn);
        } else if (RecipeState.status === 'running_turn') {
            const isLastTurn = currentIdx >= totalTurns - 1;
            const unlockBtn = document.createElement('button');
            unlockBtn.className = 'pd-skip-btn pd-min-send';
            unlockBtn.textContent = isLastTurn ? 'Fertig ✓' : 'Fertig ➔';
            unlockBtn.title = isLastTurn ? 'Workflow beenden und Fenster schliessen' : 'Zum nächsten Schritt wechseln';
            bindAction(unlockBtn, (btn) => {
                if (RecipeState.streamCheckInterval) {
                    clearInterval(RecipeState.streamCheckInterval);
                    RecipeState.streamCheckInterval = null;
                }
                if (isLastTurn) {
                    cancelWorkflow(btn);
                } else {
                    handleTurnCompletion();
                }
            });
            rightActions.appendChild(unlockBtn);
        }

        const expandBtn = document.createElement('button');
        expandBtn.className = 'pd-ctrl-btn';
        expandBtn.textContent = '↗';
        expandBtn.title = 'Erweitern (Steuerung öffnen)';
        bindAction(expandBtn, () => {
            RecipeState.isMinimized = false;
            renderRailUI();
        });
        rightActions.appendChild(expandBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'pd-ctrl-btn';
        closeBtn.textContent = '×';
        closeBtn.title = 'Workflow beenden (×)';
        bindAction(closeBtn, (btn) => cancelWorkflow(btn));
        rightActions.appendChild(closeBtn);

        minDock.appendChild(rightActions);
        railContainer.appendChild(minDock);
        return;
    }

    // --- State B: Unified Full HUD Dock ---
    const hud = document.createElement('div');
    hud.className = 'pd-hud-dock';

    // 1. Header: Title, Stepper, Controls
    const header = document.createElement('div');
    header.className = 'pd-hud-header';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'pd-hud-title';

    const handleSpan = document.createElement('span');
    handleSpan.className = 'pd-drag-handle';
    handleSpan.title = 'Ziehen zum Verschieben (Doppelklick zum Zurücksetzen)';
    handleSpan.innerHTML = `
        <svg width="7" height="11" viewBox="0 0 8 12" fill="currentColor">
            <circle cx="2" cy="2" r="1.2"/>
            <circle cx="6" cy="2" r="1.2"/>
            <circle cx="2" cy="6" r="1.2"/>
            <circle cx="6" cy="6" r="1.2"/>
            <circle cx="2" cy="10" r="1.2"/>
            <circle cx="6" cy="10" r="1.2"/>
        </svg>
    `;
    titleDiv.appendChild(handleSpan);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'pd-hud-name';
    nameSpan.textContent = recipe.name;
    titleDiv.appendChild(nameSpan);

    header.appendChild(titleDiv);

    const stepsList = document.createElement('div');
    stepsList.className = 'pd-rail-steps';

    recipe.turns.forEach((turn, idx) => {
        const step = document.createElement('div');
        const isDone = idx < currentIdx || (RecipeState.status === 'completed' && idx === currentIdx);
        const isActive = idx === currentIdx && RecipeState.status !== 'completed';
        step.className = `pd-rail-step ${isDone ? 'done' : isActive ? 'active' : 'pending'}`;

        const circle = document.createElement('span');
        circle.className = 'pd-step-circle';
        circle.textContent = isDone ? '✓' : (idx + 1);

        const title = document.createElement('span');
        title.className = 'pd-step-title';
        title.textContent = turn.title;

        step.appendChild(circle);
        step.appendChild(title);
        stepsList.appendChild(step);

        if (idx < totalTurns - 1) {
            const line = document.createElement('div');
            line.className = `pd-step-line ${idx < currentIdx ? 'done' : ''}`;
            stepsList.appendChild(line);
        }
    });
    header.appendChild(stepsList);

    const controls = document.createElement('div');
    controls.className = 'pd-hud-controls';

    const minBtn = document.createElement('button');
    minBtn.className = 'pd-ctrl-btn';
    minBtn.textContent = '—';
    minBtn.title = 'Minimieren (Chat lesen)';
    bindAction(minBtn, () => {
        RecipeState.isMinimized = true;
        renderRailUI();
    });
    controls.appendChild(minBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pd-ctrl-btn';
    closeBtn.textContent = '×';
    closeBtn.title = 'Workflow beenden (×)';
    bindAction(closeBtn, (btn) => cancelWorkflow(btn));
    controls.appendChild(closeBtn);

    header.appendChild(controls);
    hud.appendChild(header);

    // 2. Body based on current status
    if (RecipeState.status === 'checkpoint') {
        const body = document.createElement('div');
        body.className = 'pd-hud-body';

        const statusLine = document.createElement('div');
        statusLine.className = 'pd-hud-status-line';
        statusLine.innerHTML = `<span class="pd-step-tag">Schritt ${currentIdx + 1} von ${totalTurns}</span> <span class="pd-step-desc">Bereit für: <strong>${recipe.turns[currentIdx].title}</strong></span>`;
        body.appendChild(statusLine);

        // Steering Modifiers (no redundant "Direkt weiter" chip!)
        const modsRow = document.createElement('div');
        modsRow.className = 'pd-modifiers-row';

        const noteInput = document.createElement('input');
        noteInput.type = 'text';
        noteInput.className = 'pd-note-input';
        noteInput.placeholder = 'Optionale Steuerungsnotiz (oder direkt Weiter / Enter drücken)...';

        const modChips = [
            { label: '+ Fakten korrigieren', note: 'Bitte korrigiere folgende Fakten: ' },
            { label: '+ Tiefer recherchieren', note: 'Recherchiere noch tiefer zu: ' },
            { label: '+ Haltung vorgeben', note: 'Empfohlene Haltung soll lauten: ' }
        ];

        modChips.forEach(c => {
            const chip = document.createElement('button');
            chip.className = 'pd-mod-tag';
            chip.textContent = c.label;
            bindAction(chip, () => {
                noteInput.value = c.note;
                noteInput.focus();
            });
            modsRow.appendChild(chip);
        });
        body.appendChild(modsRow);

        // Action Row: Input + Primary Advance Button + Cancel Button
        const actionRow = document.createElement('div');
        actionRow.className = 'pd-action-row';

        noteInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeNextTurn(noteInput.value);
            }
        });
        actionRow.appendChild(noteInput);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pd-primary-btn';
        nextBtn.innerHTML = `Weiter ➔ <span class="pd-shortcut">⌥⇧→</span>`;
        bindAction(nextBtn, () => executeNextTurn(noteInput.value));
        actionRow.appendChild(nextBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'pd-cancel-btn';
        cancelBtn.textContent = 'Abbrechen';
        cancelBtn.title = 'Workflow komplett beenden';
        bindAction(cancelBtn, (btn) => cancelWorkflow(btn));
        actionRow.appendChild(cancelBtn);

        body.appendChild(actionRow);

        // Fork Dropdown: ONLY on final step if forks exist!
        const isFinalStep = currentIdx === totalTurns - 1;
        if (isFinalStep && recipe.forks && recipe.forks.length > 0) {
            const forkRow = document.createElement('div');
            forkRow.className = 'pd-fork-row';
            
            const forkLabel = document.createElement('span');
            forkLabel.className = 'pd-fork-label';
            forkLabel.textContent = 'Anderen Output wählen:';
            forkRow.appendChild(forkLabel);

            const forkSelect = document.createElement('select');
            forkSelect.className = 'pd-fork-select';
            const defOpt = document.createElement('option');
            defOpt.value = '';
            defOpt.textContent = `Standard (${recipe.turns[currentIdx].title})`;
            forkSelect.appendChild(defOpt);

            const catalog = window.PromptDockCatalog;
            recipe.forks.forEach(fId => {
                const opt = document.createElement('option');
                opt.value = fId;
                opt.textContent = `➔ ${catalog?.CHUNKS[fId]?.title || fId}`;
                forkSelect.appendChild(opt);
            });

            forkSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    executeFork(e.target.value, noteInput.value);
                }
            });
            forkRow.appendChild(forkSelect);
            body.appendChild(forkRow);
        }

        hud.appendChild(body);
    } else if (RecipeState.status === 'completed') {
        const body = document.createElement('div');
        body.className = 'pd-hud-body pd-completed-body';

        const doneMsg = document.createElement('div');
        doneMsg.className = 'pd-done-message';
        doneMsg.innerHTML = `<span class="pd-done-icon">✓</span> <span><strong>Workflow abgeschlossen!</strong> Alle ${totalTurns} Schritte ausgeführt.</span>`;
        body.appendChild(doneMsg);

        const actionsRow = document.createElement('div');
        actionsRow.className = 'pd-action-row';

        if (recipe.forks && recipe.forks.length > 0) {
            const forkSelect = document.createElement('select');
            forkSelect.className = 'pd-fork-select';
            const defOpt = document.createElement('option');
            defOpt.value = '';
            defOpt.textContent = 'Weiteren Output generieren (Fork)...';
            forkSelect.appendChild(defOpt);

            const catalog = window.PromptDockCatalog;
            recipe.forks.forEach(fId => {
                const opt = document.createElement('option');
                opt.value = fId;
                opt.textContent = `➔ ${catalog?.CHUNKS[fId]?.title || fId}`;
                forkSelect.appendChild(opt);
            });

            forkSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    if (RecipeState.autoCloseTimer) {
                        clearTimeout(RecipeState.autoCloseTimer);
                        RecipeState.autoCloseTimer = null;
                    }
                    if (RecipeState.autoCloseInterval) {
                        clearInterval(RecipeState.autoCloseInterval);
                        RecipeState.autoCloseInterval = null;
                    }
                    executeFork(e.target.value, '');
                }
            });
            actionsRow.appendChild(forkSelect);
        }

        const finishBtn = document.createElement('button');
        finishBtn.className = 'pd-primary-btn pd-finish-btn';
        finishBtn.textContent = 'Schliessen ✓';
        finishBtn.title = 'Workflow beenden und Fenster schliessen';
        bindAction(finishBtn, (btn) => cancelWorkflow(btn));
        actionsRow.appendChild(finishBtn);

        body.appendChild(actionsRow);

        // Auto-close countdown indicator (clickable for instant dismissal)
        const autoCloseRow = document.createElement('div');
        autoCloseRow.className = 'pd-autoclose-indicator';
        let countdownSec = (recipe.forks && recipe.forks.length > 0) ? 5 : 2;
        autoCloseRow.textContent = `Schliesst automatisch in ${countdownSec}s (oder hier klicken)...`;
        autoCloseRow.title = 'Klicken zum sofortigen Schliessen';
        bindAction(autoCloseRow, (el) => cancelWorkflow(el));
        body.appendChild(autoCloseRow);

        // Clear any previous auto-close timer
        if (RecipeState.autoCloseTimer) clearTimeout(RecipeState.autoCloseTimer);
        if (RecipeState.autoCloseInterval) clearInterval(RecipeState.autoCloseInterval);

        let isHovered = false;
        hud.addEventListener('mouseenter', () => {
            isHovered = true;
            autoCloseRow.textContent = 'Auto-Schliessen pausiert (Klicken zum Schliessen)';
        });
        hud.addEventListener('mouseleave', () => {
            isHovered = false;
            autoCloseRow.textContent = `Schliesst automatisch in ${countdownSec}s (oder hier klicken)...`;
        });

        RecipeState.autoCloseInterval = setInterval(() => {
            if (isHovered) return;
            countdownSec--;
            if (countdownSec > 0) {
                autoCloseRow.textContent = `Schliesst automatisch in ${countdownSec}s (oder hier klicken)...`;
            } else {
                clearInterval(RecipeState.autoCloseInterval);
                RecipeState.autoCloseInterval = null;
                cancelWorkflow();
            }
        }, 1000);

        hud.appendChild(body);
    } else if (RecipeState.status === 'running_turn') {
        const body = document.createElement('div');
        body.className = 'pd-hud-body pd-running-body';

        const indicator = document.createElement('div');
        indicator.className = 'pd-running-indicator';
        indicator.innerHTML = `<span class="pd-spinner"></span> <span>Schritt ${currentIdx + 1} (${recipe.turns[currentIdx].title}) wird generiert...</span>`;
        body.appendChild(indicator);

        const actions = document.createElement('div');
        actions.className = 'pd-running-actions';

        const isLastTurn = currentIdx >= totalTurns - 1;
        const unlockBtn = document.createElement('button');
        unlockBtn.className = 'pd-skip-btn';
        unlockBtn.textContent = isLastTurn 
            ? 'Fertig? Abschliessen ➔' 
            : `Fertig? Weiter zu Schritt ${currentIdx + 2} ➔`;
        unlockBtn.title = isLastTurn 
            ? 'Workflow beenden und Fenster schliessen' 
            : 'Zum nächsten Schritt wechseln';
        bindAction(unlockBtn, (btn) => {
            if (RecipeState.streamCheckInterval) {
                clearInterval(RecipeState.streamCheckInterval);
                RecipeState.streamCheckInterval = null;
            }
            if (isLastTurn) {
                // Instantly complete and dismiss the modal!
                btn.innerHTML = '<span>Fertig ✓</span>';
                btn.style.borderColor = '#10b981';
                btn.style.color = '#10b981';
                setTimeout(() => {
                    cancelWorkflow(btn);
                }, 120);
            } else {
                handleTurnCompletion();
            }
        });
        actions.appendChild(unlockBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'pd-cancel-btn';
        cancelBtn.textContent = 'Abbrechen';
        cancelBtn.title = 'Workflow sofort komplett abbrechen';
        bindAction(cancelBtn, (btn) => cancelWorkflow(btn));
        actions.appendChild(cancelBtn);

        body.appendChild(actions);
        hud.appendChild(body);
    }

    railContainer.appendChild(hud);
}

window.startPromptDockRecipe = function(recipeIdOrName, options) {
    options = options || {};
    const catalog = window.PromptDockCatalog;
    if (!catalog) {
        console.error('[PromptDock] Recipe catalog not loaded!');
        return false;
    }
    const recipe = catalog.RECIPES.find(r => r.id === recipeIdOrName || r.name.toLowerCase() === (recipeIdOrName || '').toLowerCase());
    if (!recipe) {
        console.error(`[PromptDock] Recipe ${recipeIdOrName} not found.`);
        return false;
    }

    const mode = options.mode || 'guided';
    const variableValues = options.variableValues || {};

    if (mode === 'express') {
        const expressPrompt = catalog.compileExpress(recipe, variableValues);
        return window.injectCopilotPrompt(expressPrompt, false);
    }

    const turnPrompt = catalog.compileTurn(recipe, 0, { variableValues });
    const injected = window.injectCopilotPrompt(turnPrompt, true);

    // CRITICAL FIX: If prompt could not be injected into this frame, DO NOT render UI!
    // This stops parent or sibling iframes from spawning duplicate floating cards!
    if (!injected) {
        return false;
    }

    RecipeState.activeRecipe = recipe;
    RecipeState.currentTurnIndex = 0;
    RecipeState.variableValues = variableValues;
    RecipeState.mode = mode;
    RecipeState.status = 'running_turn';
    RecipeState.isMinimized = false;

    renderRailUI();
    observeTurnCompletion(() => handleTurnCompletion());

    return true;
};

// Global Shortcut Listeners: Alt+Shift+ArrowRight (⌥⇧→) to advance turn, Escape to dismiss
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && RecipeState.status !== 'idle') {
        const shadowRoot = getOrCreateShadowRoot();
        const rail = shadowRoot ? shadowRoot.querySelector('#promptdock-rail-container') : null;
        if (rail && rail.style.display !== 'none') {
            e.preventDefault();
            e.stopPropagation();
            cancelWorkflow();
            return;
        }
    }
    if (e.altKey && e.shiftKey && (e.key === 'ArrowRight' || e.code === 'ArrowRight')) {
        if (RecipeState.status === 'checkpoint') {
            e.preventDefault();
            const shadowRoot = getOrCreateShadowRoot();
            const noteInput = shadowRoot ? shadowRoot.querySelector('.pd-note-input') : null;
            const noteVal = noteInput ? noteInput.value : '';
            executeNextTurn(noteVal);
        }
    }
}, true);

// Runtime Message Listener
const extRuntime = typeof browser !== 'undefined' ? browser.runtime : (typeof chrome !== 'undefined' ? chrome.runtime : null);
if (extRuntime && extRuntime.onMessage) {
    extRuntime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg && msg.type === 'START_RECIPE') {
            const success = window.startPromptDockRecipe(msg.recipeId, msg.options);
            sendResponse({ success });
        }
    });
}
}


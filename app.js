// ── CONFIG ──
const GITHUB_REPO = 'fredrikberg112/todo-app';
const GITHUB_TOKEN = '';
const DATA_BRANCH = 'main';
const LISTS_PATH = 'lists.json';

// ── DEFAULT LISTS ──
const defaultLists = {
    handla: {
        id: 'handla',
        name: 'Handla',
        icon: '🛒',
        color: '#00d4ff',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    jobb: {
        id: 'jobb',
        name: 'Jobb',
        icon: '💼',
        color: '#ffaa00',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    dagsplanering: {
        id: 'dagsplanering',
        name: 'Dagsplanering',
        icon: '📅',
        color: '#9d4edd',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
};

// ── STATE ──
let lists = {};
let expandedLists = new Set(['handla']);
let listsSha = null; // GitHub SHA for lists.json

// ── INIT ──
function init() {
    loadListsFromGitHub();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('quick-add-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addFromInput();
    });
}

// ── GITHUB SYNC ──
async function loadListsFromGitHub() {
    try {
        showLoading(true);
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/${DATA_BRANCH}/${LISTS_PATH}?t=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            lists = data;
            console.log('✅ Loaded lists from GitHub');
        } else {
            throw new Error('Failed to load');
        }
    } catch (e) {
        console.log('⚠️ Could not load from GitHub, using defaults');
        lists = JSON.parse(JSON.stringify(defaultLists));
    }
    render();
    updateSummary();
    showLoading(false);
}

async function saveListsToGitHub() {
    if (!GITHUB_TOKEN) {
        console.log('⚠️ No GitHub token, saving to localStorage only');
        localStorage.setItem('fredriks_lists', JSON.stringify(lists));
        return;
    }
    
    try {
        showLoading(true);
        
        // Get current SHA if we don't have it
        if (!listsSha) {
            const metaRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LISTS_PATH}?ref=${DATA_BRANCH}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'User-Agent': 'TodoApp'
                }
            });
            if (metaRes.ok) {
                const meta = await metaRes.json();
                listsSha = meta.sha;
            }
        }
        
        // Upload updated lists.json
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(lists, null, 2))));
        const body = {
            message: 'Update lists from app',
            content: content,
            branch: DATA_BRANCH,
            sha: listsSha
        };
        
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LISTS_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'TodoApp'
            },
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            const result = await res.json();
            listsSha = result.content.sha;
            console.log('✅ Saved to GitHub');
        } else {
            throw new Error('Failed to save');
        }
    } catch (e) {
        console.error('❌ GitHub save failed:', e);
        // Fallback to localStorage
        localStorage.setItem('fredriks_lists', JSON.stringify(lists));
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const btn = document.getElementById('save-indicator');
    if (btn) {
        btn.textContent = show ? '💾 Sparar...' : '';
        btn.style.display = show ? 'inline' : 'none';
    }
}

// ── LOCAL STORAGE (fallback) ──
function loadListsFallback() {
    const saved = localStorage.getItem('fredriks_lists');
    if (saved) {
        lists = JSON.parse(saved);
    } else {
        lists = JSON.parse(JSON.stringify(defaultLists));
    }
}

function saveLists() {
    updateSummary();
    saveListsToGitHub();
}

// ── ADD ITEMS ──
function addFromInput() {
    const input = document.getElementById('quick-add-input');
    const selector = document.getElementById('list-selector');
    const text = input.value.trim();
    
    if (!text) return;
    
    const listId = selector.value;
    const items = text.split(/[,;]/).map(s => s.trim()).filter(s => s);
    
    items.forEach(itemText => {
        addItem(listId, itemText);
    });
    
    input.value = '';
    expandedLists.add(listId);
    render();
    saveLists();
}

function addItem(listId, text) {
    if (!lists[listId]) return false;
    
    // Check if item already exists and not completed
    const existing = lists[listId].items.find(i => 
        i.text.toLowerCase() === text.toLowerCase() && !i.completed
    );
    
    if (existing) {
        // Already exists and not done - don't add duplicate
        return false;
    }
    
    const item = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    lists[listId].items.push(item);
    lists[listId].updatedAt = new Date().toISOString();
    return true;
}

function toggleItem(listId, itemId) {
    const item = lists[listId].items.find(i => i.id === itemId);
    if (!item) return;
    
    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date().toISOString() : null;
    lists[listId].updatedAt = new Date().toISOString();
    
    render();
    saveLists();
}

function deleteItem(listId, itemId) {
    lists[listId].items = lists[listId].items.filter(i => i.id !== itemId);
    lists[listId].updatedAt = new Date().toISOString();
    render();
    saveLists();
}

function addItemToListFromApp(listId) {
    const input = document.getElementById(`add-item-${listId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    addItem(listId, text);
    input.value = '';
    render();
    saveLists();
}

// ── RENDER ──
function render() {
    renderLists();
    updateSummary();
}

function renderLists() {
    const grid = document.getElementById('lists-grid');
    if (!grid) return;
    
    grid.innerHTML = Object.values(lists).map(list => {
        const totalItems = list.items.length;
        const completedItems = list.items.filter(i => i.completed).length;
        const progress = totalItems > 0 ? (completedItems / totalItems * 100) : 0;
        const isExpanded = expandedLists.has(list.id);
        
        return `
            <div class="list-card ${isExpanded ? 'expanded' : ''} ${totalItems > 0 ? 'active' : ''}">
                <div class="list-header" onclick="toggleList('${list.id}')">
                    <div class="list-header-left">
                        <div class="list-icon" style="border-color: ${list.color}33; background: ${list.color}11;">${list.icon}</div>
                        <div class="list-info">
                            <h3>${list.name}</h3>
                            <div class="list-meta">
                                ${completedItems}/${totalItems} klara
                                ${totalItems > 0 ? `
                                    <div class="progress-bar">
                                        <div class="progress-fill ${progress < 100 ? 'partial' : ''}" style="width: ${progress}%"></div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <span class="list-toggle">▼</span>
                </div>
                
                <div class="list-items">
                    ${list.items.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <p>Inga items än</p>
                        </div>
                    ` : list.items.map(item => `
                        <div class="todo-item ${item.completed ? 'completed' : ''}">
                            <div class="item-checkbox" onclick="event.stopPropagation(); toggleItem('${list.id}', '${item.id}')"></div>
                            <span class="item-text">${escapeHtml(item.text)}</span>
                            <span class="item-time">${formatTime(item.createdAt)}</span>
                            <button class="btn-delete" onclick="event.stopPropagation(); deleteItem('${list.id}', '${item.id}')">🗑️</button>
                        </div>
                    `).join('')}
                    
                    <div class="add-item-row">
                        <input type="text" class="add-item-input" id="add-item-${list.id}"
                               placeholder="Lägg till..." 
                               onkeypress="if(event.key==='Enter') addItemToListFromApp('${list.id}')">
                        <button class="btn btn-secondary btn-small" onclick="addItemToListFromApp('${list.id}')">+ Lägg till</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleList(listId) {
    if (expandedLists.has(listId)) {
        expandedLists.delete(listId);
    } else {
        expandedLists.add(listId);
    }
    renderLists();
}

function updateSummary() {
    const statsEl = document.getElementById('summary-stats');
    if (!statsEl) return;
    
    const totalItems = Object.values(lists).reduce((sum, list) => sum + list.items.length, 0);
    const completedItems = Object.values(lists).reduce((sum, list) => 
        sum + list.items.filter(i => i.completed).length, 0);
    const activeLists = Object.values(lists).filter(list => list.items.length > 0).length;
    
    statsEl.innerHTML = `
        <div class="stat">
            <div class="stat-value" style="color: var(--cyan);">${activeLists}</div>
            <div class="stat-label">Aktiva Listor</div>
        </div>
        <div class="stat">
            <div class="stat-value" style="color: var(--amber);">${totalItems - completedItems}</div>
            <div class="stat-label">Att Göra</div>
        </div>
        <div class="stat">
            <div class="stat-value" style="color: var(--green);">${completedItems}</div>
            <div class="stat-label">Klara</div>
        </div>
    `;
}

// ── HELPERS ──
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'nyss';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'igår';
    return `${diffDays}d`;
}

// ── TELEGRAM INTEGRATION ──
// This function is called from the Telegram bridge
function processTelegramMessage(message) {
    // Expected format: "handla mjölk bröd morot" or "jobb ring kundservice"
    const words = message.toLowerCase().split(/\s+/);
    
    // Map first word to list ID
    const listMap = {
        'handla': 'handla',
        'köp': 'handla',
        'köpa': 'handla',
        'shop': 'handla',
        'jobb': 'jobb',
        'arbete': 'jobb',
        'work': 'jobb',
        'idag': 'dagsplanering',
        'idag:': 'dagsplanering',
        'dagsplan': 'dagsplanering',
        'plan': 'dagsplanering',
        'fredag': 'dagsplanering',
        'lördag': 'dagsplanering',
        'söndag': 'dagsplanering'
    };
    
    let targetList = null;
    let itemText = message;
    
    // Check if first word maps to a list
    if (words.length > 1 && listMap[words[0]]) {
        targetList = listMap[words[0]];
        itemText = words.slice(1).join(' ');
    }
    
    // If no list specified, default to handla for shopping-like items
    if (!targetList) {
        const shoppingWords = ['mjölk', 'bröd', 'ägg', 'smör', 'pasta', 'ris', 'kaffe', 'te', 'frukt', 'grönsaker', 'kött', 'fisk'];
        const hasShoppingWords = shoppingWords.some(sw => message.toLowerCase().includes(sw));
        if (hasShoppingWords) {
            targetList = 'handla';
        }
    }
    
    // Add items
    const items = itemText.split(/[,;]/).map(s => s.trim()).filter(s => s);
    let added = 0;
    
    items.forEach(item => {
        if (addItem(targetList || 'handla', item)) {
            added++;
        }
    });
    
    saveLists();
    render();
    
    return {
        success: true,
        added: added,
        list: targetList || 'handla',
        items: items
    };
}

// ── GITHUB SYNC (placeholder) ──
async function syncToGitHub() {
    // TODO: Implement GitHub Pages sync
    console.log('Syncing to GitHub...');
    // Would need GitHub token and API calls
}

// ── INIT ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose functions globally for testing
window.addFromInput = addFromInput;
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.toggleList = toggleList;
window.addItemToListFromApp = addItemToListFromApp;
window.processTelegramMessage = processTelegramMessage;

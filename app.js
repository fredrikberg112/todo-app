// ── CONFIG ──
const STORAGE_KEY = '***';

// ── EMBEDDED DATA (from lists.json) ──
const EMBEDDED_LISTS = {
    "handla": {
        "id": "handla",
        "name": "Handla",
        "icon": "🛒",
        "color": "#00d4ff",
        "items": [
            {"id": "test1", "text": "test1", "completed": false, "createdAt": "2026-06-01T11:25:46.257Z", "completedAt": null},
            {"id": "test2", "text": "test2", "completed": false, "createdAt": "2026-06-01T11:25:46.257Z", "completedAt": null}
        ],
        "createdAt": "2026-06-01T08:14:17.156Z",
        "updatedAt": "2026-06-01T11:25:46.257Z"
    },
    "jobb": {
        "id": "jobb",
        "name": "Jobb",
        "icon": "💼",
        "color": "#ffaa00",
        "items": [],
        "createdAt": "2026-06-01T08:14:17.157Z",
        "updatedAt": "2026-06-01T11:25:46.257Z"
    },
    "dagsplanering": {
        "id": "dagsplanering",
        "name": "Dagsplanering",
        "icon": "📅",
        "color": "#9d4edd",
        "items": [],
        "createdAt": "2026-06-01T08:14:17.157Z",
        "updatedAt": "2026-06-01T11:25:46.257Z"
    }
};

// ── STATE ──
let lists = {};
let expandedLists = new Set(['handla']);

// ── INIT ──
function init() {
    loadLists();
    render();
    setupEventListeners();
    updateSummary();
}

function setupEventListeners() {
    const input = document.getElementById('quick-add-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addFromInput();
        });
    }
}

// ── LOCAL STORAGE ──
function loadLists() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            lists = JSON.parse(saved);
            // Ensure all lists exist
            Object.keys(EMBEDDED_LISTS).forEach(key => {
                if (!lists[key]) {
                    lists[key] = JSON.parse(JSON.stringify(EMBEDDED_LISTS[key]));
                }
            });
        } else {
            // First time - use embedded data
            lists = JSON.parse(JSON.stringify(EMBEDDED_LISTS));
            saveLists();
        }
    } catch (e) {
        console.error('Error loading lists:', e);
        lists = JSON.parse(JSON.stringify(EMBEDDED_LISTS));
    }
}

function saveLists() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
        updateSummary();
    } catch (e) {
        console.error('Error saving lists:', e);
    }
}

// ── ADD ITEMS ──
function addFromInput() {
    const input = document.getElementById('quick-add-input');
    const selector = document.getElementById('list-selector');
    if (!input || !selector) return;
    
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

function clearCompleted(listId) {
    const completedCount = lists[listId].items.filter(i => i.completed).length;
    if (completedCount === 0) return;
    
    if (!confirm(`Rensa ${completedCount} avbockade items?`)) return;
    
    lists[listId].items = lists[listId].items.filter(i => !i.completed);
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
                    <div class="list-header-actions">
                        ${completedItems > 0 ? `<button class="btn-clear-completed" onclick="event.stopPropagation(); clearCompleted('${list.id}')">🧹 Rensa klara</button>` : ''}
                        <span class="list-toggle">▼</span>
                    </div>
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

// ── INIT ──
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose functions globally
window.addFromInput = addFromInput;
window.toggleItem = toggleItem;
window.deleteItem = deleteItem;
window.toggleList = toggleList;
window.addItemToListFromApp = addItemToListFromApp;
window.clearCompleted = clearCompleted;

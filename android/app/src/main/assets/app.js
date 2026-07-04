/**
 * SecuroSpace - Main Application Controller
 * Zero-Knowledge operations, state management, UI controller.
 */

// Transient Master Session State (Cleared on Lock)
let masterPassword = '';
let decryptedDb = {
    tasks: [],
    habits: [],
    transactions: [],
    vault: []
};

// Application Configuration
const CONFIG = {
    AUTO_LOCK_SECONDS: 300, // 5 minutes inactivity
};

// Inactivity tracking variables
let autoLockTimer = null;
let secondsRemaining = CONFIG.AUTO_LOCK_SECONDS;

// Real-Time Diagnostic Event Logger
function addSecurityLog(message, type = 'info') {
    const logList = document.getElementById('security-log');
    if (!logList) return;

    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const item = document.createElement('li');
    item.className = `security-log-item ${type}`;
    item.innerHTML = `<span>[${timestamp}] ${message}</span><span style="opacity: 0.6;">OK</span>`;
    
    logList.insertBefore(item, logList.firstChild);
    
    // Limit to 50 logs
    while (logList.children.length > 50) {
        logList.removeChild(logList.lastChild);
    }
}

// System Alert Toast Manager
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon selection
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: var(--color-success);"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
    } else if (type === 'danger') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: var(--color-danger);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
    } else {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: var(--color-warning);"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`;
    }

    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ----------------------------------------------------
// Cryptographic State Management
// ----------------------------------------------------

/**
 * Initializes state from LocalStorage or forces setup.
 */
async function initializeApp() {
    addSecurityLog("SecuroSpace Crypto Engine active.", 'info');
    
    const metadata = localStorage.getItem('securospace_metadata');
    
    if (!metadata) {
        // First run - Setup Master Key
        document.getElementById('setup-card').style.display = 'block';
        document.getElementById('login-card').style.display = 'none';
        addSecurityLog("No master key schema detected. Awaiting initialization.", 'warn');
    } else {
        // Vault exists - Unlock required
        document.getElementById('setup-card').style.display = 'none';
        document.getElementById('login-card').style.display = 'block';
        addSecurityLog("Cryptographic database schema detected. Vault sealed.", 'info');
    }
}

/**
 * Creates the vault master key and initializes the database.
 */
async function handleVaultSetup(password) {
    try {
        addSecurityLog("Initiating key derivation (PBKDF2 SHA-256, 100,000 iterations)...", 'info');
        
        // Generate cryptographic salt (16 bytes)
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const saltBase64 = SecuroCrypto.buf2base64(salt);

        // Create challenge value to verify password correct later
        const verification = await SecuroCrypto.encrypt("verified", password);
        
        const metadata = {
            salt: saltBase64,
            checkValue: verification
        };

        // Write verification metadata to storage
        localStorage.setItem('securospace_metadata', JSON.stringify(metadata));
        addSecurityLog("Master Password metadata challenge created successfully.", 'success');

        // Write empty initial decrypted vault object
        masterPassword = password;
        decryptedDb = {
            tasks: [],
            habits: [],
            transactions: [],
            vault: []
        };
        
        await saveEncryptedDatabase();
        addSecurityLog("Zero-Knowledge secure database initialized.", 'success');
        
        showToast("Encrypted Vault Initialized!", "success");
        unlockSession();
    } catch (e) {
        console.error(e);
        showToast("Vault setup failed. Check console.", "danger");
    }
}

/**
 * Tries to verify password and decrypt database.
 */
async function handleVaultLogin(password) {
    try {
        const metadataRaw = localStorage.getItem('securospace_metadata');
        if (!metadataRaw) return;
        
        const metadata = JSON.parse(metadataRaw);
        addSecurityLog("Verifying Master Password with validation challenge...", 'info');
        
        // Attempt decryption of challenge
        const decCheck = await SecuroCrypto.decrypt(
            metadata.checkValue.ciphertext,
            metadata.checkValue.salt,
            metadata.checkValue.iv,
            password
        );

        if (decCheck === "verified") {
            addSecurityLog("Authentication success. Master Key verified.", "success");
            masterPassword = password;
            
            // Decrypt local database payload
            await loadEncryptedDatabase();
            showToast("Vault Unlocked", "success");
            unlockSession();
        } else {
            throw new Error("Challenge validation mismatch");
        }
    } catch (e) {
        addSecurityLog("Authentication failure. Master key rejected.", 'warn');
        showToast("Incorrect Master Password!", "danger");
        document.getElementById('login-password').value = '';
        document.getElementById('login-password').focus();
    }
}

/**
 * Loads and decrypts database payload from localstorage.
 */
async function loadEncryptedDatabase() {
    const rawVault = localStorage.getItem('securospace_vault');
    if (!rawVault) {
        // Fallback for new empty db
        decryptedDb = { tasks: [], habits: [], transactions: [], vault: [] };
        return;
    }

    try {
        addSecurityLog("Retrieving database cipher payload...", 'info');
        const encryptedPayload = JSON.parse(rawVault);
        
        const plainJson = await SecuroCrypto.decrypt(
            encryptedPayload.ciphertext,
            encryptedPayload.salt,
            encryptedPayload.iv,
            masterPassword
        );
        
        decryptedDb = JSON.parse(plainJson);
        addSecurityLog("Database ciphertext decrypted using AES-GCM.", 'success');
    } catch (e) {
        console.error(e);
        addSecurityLog("Corrupt database cipher. Wiping session state.", 'danger');
        lockSession();
        throw new Error("Failed to load vault. Corrupted data.");
    }
}

/**
 * Encrypts and writes database payload back to localstorage.
 */
async function saveEncryptedDatabase() {
    if (!masterPassword) return;

    try {
        const json = JSON.stringify(decryptedDb);
        addSecurityLog("Encrypting database model using AES-GCM-256...", 'info');
        
        const encryptedPayload = await SecuroCrypto.encrypt(json, masterPassword);
        
        localStorage.setItem('securospace_vault', JSON.stringify(encryptedPayload));
        addSecurityLog("Cipher block successfully written to localStorage.", 'success');
    } catch (e) {
        console.error("Encryption save failed:", e);
        addSecurityLog("Failed to write encrypted payload to storage.", 'danger');
    }
}

// ----------------------------------------------------
// Session Management & Autolock
// ----------------------------------------------------

function unlockSession() {
    document.getElementById('auth-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('auth-overlay').style.display = 'none';
    }, 300);

    // Clear login input values
    document.getElementById('login-password').value = '';
    document.getElementById('setup-password').value = '';
    document.getElementById('setup-confirm').value = '';

    resetInactivityTimer();
    startAutoLockCountdown();
    
    // Render all elements
    renderAllViews();
}

function lockSession() {
    // Flush key and state
    masterPassword = '';
    decryptedDb = { tasks: [], habits: [], transactions: [], vault: [] };
    
    // Stop timers
    stopAutoLockCountdown();
    
    addSecurityLog("Session lock invoked. Transient memory cleared.", 'warn');
    
    // Clear DOM inputs and components to prevent visual caching
    clearDOMState();
    
    // Show overlay
    document.getElementById('auth-overlay').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('auth-overlay').style.opacity = '1';
    }, 50);
    
    initializeApp();
}

function clearDOMState() {
    document.getElementById('todo-list').innerHTML = '';
    document.getElementById('habit-list').innerHTML = '';
    document.getElementById('transaction-list').innerHTML = '';
    document.getElementById('vault-grid').innerHTML = '';
    document.getElementById('expense-chart').innerHTML = '';
    
    document.getElementById('finance-total').innerText = '$0.00';
    document.getElementById('finance-income').innerText = '+$0.00';
    document.getElementById('finance-expense').innerText = '-$0.00';
    document.getElementById('stat-tasks-total').innerText = '0';
    document.getElementById('stat-tasks-done').innerText = '0';
    document.getElementById('stat-habits-active').innerText = '0';
}

function resetInactivityTimer() {
    secondsRemaining = CONFIG.AUTO_LOCK_SECONDS;
    updateAutoLockUI();
}

function updateAutoLockUI() {
    const indicator = document.getElementById('auto-lock-indicator');
    if (!indicator) return;
    
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    indicator.innerText = `Auto-Lock: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (secondsRemaining <= 30) {
        indicator.style.color = 'var(--color-danger)';
    } else {
        indicator.style.color = 'var(--text-secondary)';
    }
}

function startAutoLockCountdown() {
    stopAutoLockCountdown();
    autoLockTimer = setInterval(() => {
        secondsRemaining--;
        updateAutoLockUI();
        if (secondsRemaining <= 0) {
            addSecurityLog("Inactivity threshold reached. Auto-lock triggered.", 'warn');
            lockSession();
            showToast("Vault auto-locked due to inactivity.", "warning");
        }
    }, 1000);
}

function stopAutoLockCountdown() {
    if (autoLockTimer) {
        clearInterval(autoLockTimer);
        autoLockTimer = null;
    }
}

// Activity listeners to reset the auto-lock countdown
const activityEvents = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
activityEvents.forEach(evt => {
    window.addEventListener(evt, () => {
        if (masterPassword) {
            resetInactivityTimer();
        }
    });
});

// ----------------------------------------------------
// UI Render Engines & Feature Logic
// ----------------------------------------------------

function renderAllViews() {
    renderPlanner();
    renderFinances();
    renderVault();
    renderDiagnostics();
}

/* 1. PLANNER VIEW & OPERATIONS */
function renderPlanner() {
    // Tasks List
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    
    let doneCount = 0;
    decryptedDb.tasks.forEach(task => {
        if (task.completed) doneCount++;
        
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <div class="todo-left">
                <div class="checkbox-custom ${task.completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
                <span class="todo-text">${escapeHtml(task.text)}</span>
            </div>
            <button class="btn btn-danger btn-icon" onclick="deleteTask(${task.id})" style="padding: 0.3rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>
        `;
        todoList.appendChild(li);
    });

    document.getElementById('stat-tasks-total').innerText = decryptedDb.tasks.length;
    document.getElementById('stat-tasks-done').innerText = doneCount;

    // Habits List
    const habitList = document.getElementById('habit-list');
    habitList.innerHTML = '';
    
    let activeStreaks = 0;
    decryptedDb.habits.forEach(habit => {
        if (habit.streak > 0) activeStreaks++;
        
        const isCompletedToday = checkIfCompletedToday(habit.lastCompleted);
        const li = document.createElement('li');
        li.className = 'habit-item';
        
        li.innerHTML = `
            <div class="habit-left">
                <div class="checkbox-custom ${isCompletedToday ? 'checked' : ''}" onclick="toggleHabit(${habit.id})"></div>
                <span>${escapeHtml(habit.name)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="habit-streak">${habit.streak} 🔥</span>
                <button class="btn btn-danger btn-icon" onclick="deleteHabit(${habit.id})" style="padding: 0.3rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;
        habitList.appendChild(li);
    });

    document.getElementById('stat-habits-active').innerText = activeStreaks;
}

function checkIfCompletedToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
}

async function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false
    };

    decryptedDb.tasks.push(newTask);
    input.value = '';
    
    await saveEncryptedDatabase();
    renderPlanner();
    showToast("Encrypted task added", "success");
}

async function toggleTask(id) {
    const task = decryptedDb.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        await saveEncryptedDatabase();
        renderPlanner();
    }
}

async function deleteTask(id) {
    decryptedDb.tasks = decryptedDb.tasks.filter(t => t.id !== id);
    await saveEncryptedDatabase();
    renderPlanner();
    showToast("Task deleted", "warning");
}

async function addHabit() {
    const input = document.getElementById('habit-input');
    const name = input.value.trim();
    if (!name) return;

    const newHabit = {
        id: Date.now(),
        name: name,
        streak: 0,
        lastCompleted: null
    };

    decryptedDb.habits.push(newHabit);
    input.value = '';
    
    await saveEncryptedDatabase();
    renderPlanner();
    showToast("Habit tracker initialized", "success");
}

async function toggleHabit(id) {
    const habit = decryptedDb.habits.find(h => h.id === id);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (habit.lastCompleted === today) {
        // Undo today's completion
        habit.lastCompleted = null;
        habit.streak = Math.max(0, habit.streak - 1);
    } else {
        // Increment streak if completed on consecutive day
        if (habit.lastCompleted === yesterday || habit.lastCompleted === null) {
            habit.streak += 1;
        } else {
            // Missed a day, reset streak
            habit.streak = 1;
        }
        habit.lastCompleted = today;
    }

    await saveEncryptedDatabase();
    renderPlanner();
}

async function deleteHabit(id) {
    decryptedDb.habits = decryptedDb.habits.filter(h => h.id !== id);
    await saveEncryptedDatabase();
    renderPlanner();
    showToast("Habit deleted", "warning");
}

/* 2. FINANCES VIEW & OPERATIONS */
function renderFinances() {
    let incomeSum = 0;
    let expenseSum = 0;

    decryptedDb.transactions.forEach(t => {
        if (t.type === 'income') {
            incomeSum += t.amount;
        } else {
            expenseSum += t.amount;
        }
    });

    const balance = incomeSum - expenseSum;

    document.getElementById('finance-total').innerText = `$${balance.toFixed(2)}`;
    document.getElementById('finance-income').innerText = `+$${incomeSum.toFixed(2)}`;
    document.getElementById('finance-expense').innerText = `-$${expenseSum.toFixed(2)}`;

    // Render Transaction Ledger
    const transList = document.getElementById('transaction-list');
    transList.innerHTML = '';
    
    decryptedDb.transactions.slice().reverse().forEach(t => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        
        li.innerHTML = `
            <div class="transaction-details">
                <span class="transaction-desc">${escapeHtml(t.desc)}</span>
                <span class="transaction-date">${t.date}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span class="transaction-amount ${t.type === 'income' ? 'income' : 'expense'}">
                    ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                </span>
                <button class="btn btn-danger btn-icon" onclick="deleteTransaction(${t.id})" style="padding: 0.3rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;
        transList.appendChild(li);
    });

    // Render Graph Layout
    renderFinanceChart(incomeSum, expenseSum);
}

function renderFinanceChart(income, expense) {
    const chartContainer = document.getElementById('expense-chart');
    chartContainer.innerHTML = '';

    const maxVal = Math.max(income, expense, 100);
    const incomePercent = (income / maxVal) * 80; // Scale to 80% max height
    const expensePercent = (expense / maxVal) * 80;

    chartContainer.innerHTML = `
        <div class="chart-bar-wrapper">
            <div class="chart-bar income" data-value="+$${income.toFixed(2)}" style="height: ${incomePercent}%;"></div>
            <span class="chart-label">Income</span>
        </div>
        <div class="chart-bar-wrapper">
            <div class="chart-bar expense" data-value="-$${expense.toFixed(2)}" style="height: ${expensePercent}%;"></div>
            <span class="chart-label">Expenses</span>
        </div>
    `;
}

async function addTransaction() {
    const descInput = document.getElementById('finance-desc');
    const amtInput = document.getElementById('finance-amount');
    const typeInput = document.querySelector('input[name="finance-type"]:checked');

    const desc = descInput.value.trim();
    const amount = Math.round(parseFloat(amtInput.value) * 100) / 100;
    if (!desc || isNaN(amount) || amount <= 0) return;

    const newTrans = {
        id: Date.now(),
        desc,
        amount,
        type: typeInput.value,
        date: new Date().toISOString().split('T')[0]
    };

    decryptedDb.transactions.push(newTrans);
    descInput.value = '';
    amtInput.value = '';

    await saveEncryptedDatabase();
    renderFinances();
    showToast("Financial log encrypted", "success");
}

async function deleteTransaction(id) {
    decryptedDb.transactions = decryptedDb.transactions.filter(t => t.id !== id);
    await saveEncryptedDatabase();
    renderFinances();
    showToast("Transaction removed", "warning");
}

/* 3. VAULT SECURE CREDENTIALS & NOTES */
let activeVaultFilter = 'all';

function renderVault() {
    const grid = document.getElementById('vault-grid');
    grid.innerHTML = '';

    const filtered = decryptedDb.vault.filter(item => {
        if (activeVaultFilter === 'all') return true;
        return item.type === activeVaultFilter;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
                No items found. Click 'Secure Credential / Note' to insert cryptography data.
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'vault-card';
        
        let contents = '';
        if (item.type === 'credential') {
            contents = `
                <div class="vault-field">
                    <span class="vault-field-value mono">${escapeHtml(item.user || '')}</span>
                    <button class="btn btn-icon" style="padding: 0.1rem;" onclick="copyVaultField(${item.id}, 'user')">
                        Copy
                    </button>
                </div>
                <div class="vault-field">
                    <span id="vault-pass-${item.id}" class="vault-field-value mono">••••••••••••</span>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-icon" style="padding: 0.1rem;" onclick="revealVaultField(${item.id}, 'password')">
                            👁
                        </button>
                        <button class="btn btn-icon" style="padding: 0.1rem;" onclick="copyVaultField(${item.id}, 'pass')">
                            Copy
                        </button>
                    </div>
                </div>
            `;
        } else {
            contents = `
                <div class="vault-field" style="align-items: flex-start; flex-direction: column; gap: 0.5rem;">
                    <span id="vault-note-${item.id}" class="vault-field-value" style="white-space: pre-wrap; max-width: 100%;">[Content Locked]</span>
                    <button class="btn btn-icon" onclick="revealVaultField(${item.id}, 'note')">
                        Toggle Secret Value
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="vault-card-header">
                <span class="vault-card-title">${escapeHtml(item.name)}</span>
                <span class="vault-type-badge vault-type-${item.type}">${item.type}</span>
            </div>
            ${contents}
            <div style="margin-top: 1rem; display: flex; justify-content: flex-end;">
                <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="deleteVaultItem(${item.id})">
                    Delete
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function revealVaultField(id, type) {
    const item = decryptedDb.vault.find(v => v.id === id);
    if (!item) return;

    const el = document.getElementById(type === 'password' ? `vault-pass-${id}` : `vault-note-${id}`);
    if (!el) return;

    if (el.classList.contains('revealed')) {
        el.classList.remove('revealed');
        el.innerText = type === 'password' ? '••••••••••••' : '[Content Locked]';
        addSecurityLog(`Transient vault field ${id} locked visually.`, 'info');
    } else {
        el.classList.add('revealed');
        el.innerText = type === 'password' ? item.pass : item.note;
        addSecurityLog(`Transient vault field ${id} visually revealed.`, 'warn');
        
        // Auto mask password after 15 seconds
        if (type === 'password') {
            setTimeout(() => {
                if (el.classList.contains('revealed')) {
                    el.classList.remove('revealed');
                    el.innerText = '••••••••••••';
                    addSecurityLog(`Auto-mask active for credentials block ${id}.`, 'info');
                }
            }, 15000);
        }
    }
}

function copyVaultField(id, field) {
    const item = decryptedDb.vault.find(v => v.id === id);
    if (!item) return;
    const value = field === 'user' ? item.user : item.pass;
    if (value) {
        copyToClipboard(value);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Copied to clipboard", "success");
        addSecurityLog("Data copied to system clipboard.", 'warn');
    }).catch(err => {
        showToast("Copy failed", "danger");
    });
}

async function addVaultItem(item) {
    decryptedDb.vault.push(item);
    await saveEncryptedDatabase();
    renderVault();
    showToast("Cryptographic record added to vault", "success");
}

async function deleteVaultItem(id) {
    if (confirm("Are you sure you want to permanently delete this vault item?")) {
        decryptedDb.vault = decryptedDb.vault.filter(item => item.id !== id);
        await saveEncryptedDatabase();
        renderVault();
        showToast("Item deleted", "warning");
    }
}

/* 4. DIAGNOSTICS VIEW & SETTINGS */
function renderDiagnostics() {
    // 1. Calculate security health index
    let score = 100;
    let issues = [];

    // Master password strength checks
    const mpStrength = SecuroCrypto.analyzePasswordStrength(masterPassword);
    if (mpStrength.strength === 'Weak') {
        score -= 30;
        issues.push("Weak Master Password used to derive the database key.");
    } else if (mpStrength.strength === 'Medium') {
        score -= 15;
        issues.push("Medium strength Master Password. Consider upgrading length.");
    }

    // Individual password strength checks in vault
    let weakSaved = 0;
    decryptedDb.vault.forEach(item => {
        if (item.type === 'credential' && item.pass) {
            const strAnalysis = SecuroCrypto.analyzePasswordStrength(item.pass);
            if (strAnalysis.strength === 'Weak') {
                weakSaved++;
            }
        }
    });

    if (weakSaved > 0) {
        score -= Math.min(25, weakSaved * 5);
        issues.push(`Detected ${weakSaved} weak passwords saved in the vault.`);
    }

    // Set gauge UI
    score = Math.max(10, score);
    const dashOffset = 377 - (377 * score) / 100;
    document.getElementById('security-score-gauge').style.strokeDashoffset = dashOffset;
    document.getElementById('security-score-val').innerText = `${score}%`;

    const descEl = document.getElementById('security-score-desc');
    if (score >= 90) {
        document.getElementById('security-score-gauge').style.stroke = 'var(--color-success)';
        descEl.innerHTML = `<span style="color: var(--color-success); font-weight: 700;">Excellent security.</span> All cryptographic nodes compliant.`;
    } else if (score >= 60) {
        document.getElementById('security-score-gauge').style.stroke = 'var(--color-warning)';
        descEl.innerHTML = `<span style="color: var(--color-warning); font-weight: 700;">Medium Risk.</span> Warnings:<br>${issues.join('<br>')}`;
    } else {
        document.getElementById('security-score-gauge').style.stroke = 'var(--color-danger)';
        descEl.innerHTML = `<span style="color: var(--color-danger); font-weight: 700;">Vulnerable.</span> Action required:<br>${issues.join('<br>')}`;
    }

    // 2. Storage capacity measurement
    const totalChars = JSON.stringify(decryptedDb).length + (localStorage.getItem('securospace_metadata') || '').length;
    // ~5MB local storage is 5,242,880 chars
    const percentStorage = Math.max(0.01, (totalChars / 5242880) * 100);
    const storeOffset = 377 - (377 * percentStorage) / 100;
    
    document.getElementById('storage-load-gauge').style.strokeDashoffset = storeOffset;
    document.getElementById('storage-load-val').innerText = `${percentStorage.toFixed(2)}%`;
}

// ----------------------------------------------------
// UI Navigation & Modals Binding
// ----------------------------------------------------

// Tab switching controller
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        const sectionId = tab.getAttribute('data-target');
        document.getElementById(sectionId).classList.add('active');
        
        // Refresh dynamic components
        if (sectionId === 'view-security') {
            renderDiagnostics();
        } else if (sectionId === 'view-vault') {
            renderVault();
        } else if (sectionId === 'view-finances') {
            renderFinances();
        } else if (sectionId === 'view-planner') {
            renderPlanner();
        }
    });
});

// Vault items filter buttons
document.querySelectorAll('.vault-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.vault-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeVaultFilter = btn.getAttribute('data-filter');
        renderVault();
    });
});

// Add Item Modal toggles
document.getElementById('btn-new-vault-item').addEventListener('click', () => {
    document.getElementById('modal-add-vault').classList.add('open');
});

document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('modal-add-vault').classList.remove('open');
        document.getElementById('vault-item-form').reset();
        document.getElementById('vault-fields-credential').style.display = 'block';
        document.getElementById('vault-fields-note').style.display = 'none';
    });
});

// Toggle Modal fields on Type selection
document.getElementById('vault-item-type').addEventListener('change', (e) => {
    if (e.target.value === 'credential') {
        document.getElementById('vault-fields-credential').style.display = 'block';
        document.getElementById('vault-fields-note').style.display = 'none';
    } else {
        document.getElementById('vault-fields-credential').style.display = 'none';
        document.getElementById('vault-fields-note').style.display = 'block';
    }
});

// Password Generator trigger in Modal
document.getElementById('btn-generate-pass').addEventListener('click', (e) => {
    e.preventDefault();
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const len = 16;
    let generatedPass = '';
    const randomArray = new Uint32Array(len);
    window.crypto.getRandomValues(randomArray);
    for (let i = 0; i < len; i++) {
        generatedPass += chars[randomArray[i] % chars.length];
    }
    document.getElementById('vault-item-pass').value = generatedPass;
    showToast("Generated secure key", "success");
    addSecurityLog("Cryptographic random password generated client-side.", "info");
});

// Save from Modal Submit
document.getElementById('vault-item-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type = document.getElementById('vault-item-type').value;
    const name = document.getElementById('vault-item-name').value.trim();

    if (!name) return;

    let item = {
        id: Date.now(),
        type,
        name
    };

    if (type === 'credential') {
        item.user = document.getElementById('vault-item-user').value.trim();
        item.pass = document.getElementById('vault-item-pass').value;
    } else {
        item.note = document.getElementById('vault-item-note').value;
    }

    await addVaultItem(item);
    
    // Close & reset
    document.getElementById('modal-add-vault').classList.remove('open');
    document.getElementById('vault-item-form').reset();
    document.getElementById('vault-fields-credential').style.display = 'block';
    document.getElementById('vault-fields-note').style.display = 'none';
});

// Setup Form Handler
document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('setup-password').value;
    const p2 = document.getElementById('setup-confirm').value;

    if (p1 !== p2) {
        showToast("Passwords do not match!", "danger");
        return;
    }

    const strCheck = SecuroCrypto.analyzePasswordStrength(p1);
    if (strCheck.strength === 'Weak') {
        if (!confirm("This password is weak. Brute force decryption would be easier. Continue anyway?")) {
            return;
        }
    }

    await handleVaultSetup(p1);
});

// Setup Form real-time entropy checker
document.getElementById('setup-password').addEventListener('input', (e) => {
    const pwd = e.target.value;
    const result = SecuroCrypto.analyzePasswordStrength(pwd);
    
    const bar = document.getElementById('setup-strength-bar');
    const label = document.getElementById('setup-strength-label');
    const rating = document.getElementById('setup-strength-rating');

    label.innerText = `Entropy: ${result.entropy} bits`;
    rating.innerText = result.strength;
    rating.style.color = result.color;

    // Render bar width & color
    let percent = 0;
    if (pwd.length > 0) {
        percent = Math.min(100, (result.entropy / 90) * 100);
    }
    bar.style.width = `${percent}%`;
    bar.style.backgroundColor = result.color;
});

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = document.getElementById('login-password').value;
    if (val) {
        await handleVaultLogin(val);
    }
});

// Manual Lock Click
document.getElementById('btn-lock').addEventListener('click', () => {
    lockSession();
});

// Factory / Emergency Reset
document.getElementById('btn-emergency-reset').addEventListener('click', () => {
    if (confirm("DANGER: This will delete ALL local encrypted vaults and tasks. This action is permanent and cannot be undone. Are you sure?")) {
        localStorage.clear();
        addSecurityLog("System factory wipe executed.", 'danger');
        showToast("Vault and local database wiped completely.", "warning");
        setTimeout(() => location.reload(), 1000);
    }
});

// Security Core Purge Button
document.getElementById('btn-purge-all').addEventListener('click', () => {
    if (confirm("Delete the encrypted data structure from storage? All items will be deleted permanently.")) {
        localStorage.clear();
        showToast("Vault purged.", "danger");
        lockSession();
    }
});

// Data Portability Backups
document.getElementById('btn-export').addEventListener('click', () => {
    const meta = localStorage.getItem('securospace_metadata');
    const vault = localStorage.getItem('securospace_vault');

    if (!meta || !vault) {
        showToast("No vault data exists to export", "warning");
        return;
    }

    const payload = {
        meta: JSON.parse(meta),
        vault: JSON.parse(vault),
        exportDate: new Date().toISOString()
    };

    const strJson = JSON.stringify(payload, null, 2);
    const blob = new Blob([strJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `securospace_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addSecurityLog("Database backup downloaded.", 'success');
    showToast("Encrypted Backup exported!", "success");
});

document.getElementById('btn-import-trigger').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.meta && data.meta.salt && data.meta.checkValue && data.vault) {
                // Save imported components to storage
                localStorage.setItem('securospace_metadata', JSON.stringify(data.meta));
                localStorage.setItem('securospace_vault', JSON.stringify(data.vault));
                
                addSecurityLog("Imported backup payload verified and written to storage.", 'success');
                showToast("Backup imported successfully!", "success");
                
                // Force reload or lock system
                setTimeout(() => location.reload(), 1500);
            } else {
                throw new Error("Invalid structure");
            }
        } catch (err) {
            addSecurityLog("Backup validation failed: Invalid schema.", 'danger');
            showToast("Failed to parse file. Invalid backup JSON structure.", "danger");
        }
    };
    reader.readAsText(file);
});

// Form input hooks for tasks & habits
document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addTask();
});

document.getElementById('habit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addHabit();
});

document.getElementById('finance-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addTransaction();
});

// ----------------------------------------------------
// Global Escaping Helpers
// ----------------------------------------------------

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// ----------------------------------------------------
// Start Application Lifecycle
// ----------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

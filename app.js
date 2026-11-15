/**
 * SecuroSpace — Interactive In-Browser Life OS
 * Client-Side Encrypted Workspace
 * Domain: securospace.com
 */

(function () {
  'use strict';

  // State Management with LocalStorage Fallback Defaults
  const defaultState = {
    tasks: [
      { id: 1, title: 'Review SecuroSpace zero-knowledge architecture', priority: 'high', category: 'Security', completed: true },
      { id: 2, title: 'Configure DNS records for securospace.com', priority: 'high', category: 'DevOps', completed: false },
      { id: 3, title: 'Export encrypted personal backup snapshot', priority: 'med', category: 'Personal', completed: false },
      { id: 4, title: 'Conduct daily focus sprint (Pomodoro)', priority: 'low', category: 'Focus', completed: false }
    ],
    habits: [
      { id: 1, title: 'Morning Deep Focus (90m)', streak: 12, days: [true, true, true, true, true, false, true] },
      { id: 2, title: 'Hardware Key / Master Key Verification', streak: 45, days: [true, true, true, true, true, true, true] },
      { id: 3, title: 'Daily Expense Ledger Logging', streak: 19, days: [true, true, true, true, true, true, false] }
    ],
    finance: [
      { id: 1, desc: 'Consulting Retainer', amount: 3200, type: 'income', category: 'Income', date: '2026-11-14' },
      { id: 2, desc: 'Encrypted Cloud Storage Node', amount: 48, type: 'expense', category: 'Tech', date: '2026-11-13' },
      { id: 3, desc: 'Hardware Security Token', amount: 75, type: 'expense', category: 'Hardware', date: '2026-11-12' },
      { id: 4, desc: 'Design Assets & Domain', amount: 35, type: 'expense', category: 'Business', date: '2026-11-10' }
    ],
    vault: [
      { id: 1, service: 'ProtonMail Vault', username: 'affan@securospace.com', secret: 'k8#P9!mZ$2wQx8@L', category: 'Email' },
      { id: 2, service: 'GitHub Infrastructure', username: 'Affan19261', secret: 'ghp_SecuroSpace2026!KeyX', category: 'Development' },
      { id: 3, service: 'DNS Registrar (securospace.com)', username: 'admin@securospace.com', secret: 'V4ult-D0m@1n#2026', category: 'Domain' }
    ]
  };

  // Helper to load or initialize state
  function getStored(key, fallback) {
    try {
      const data = localStorage.getItem(`securospace_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveStored(key, value) {
    try {
      localStorage.setItem(`securospace_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error', e);
    }
  }

  let state = {
    tasks: getStored('tasks', defaultState.tasks),
    habits: getStored('habits', defaultState.habits),
    finance: getStored('finance', defaultState.finance),
    vault: getStored('vault', defaultState.vault)
  };

  // Pomodoro Timer State
  let timerInterval = null;
  let timerSecondsLeft = 25 * 60;
  let timerIsRunning = false;

  // DOM Elements Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initPomodoro();
    initTasksModule();
    initHabitsModule();
    initFinanceModule();
    initVaultModule();
    initSettingsModule();
    updateVaultStatusBadge();
  });

  // 1. Navigation Between Modules
  function initNavigation() {
    const navButtons = document.querySelectorAll('.app-nav-btn');
    const panes = document.querySelectorAll('.app-module-pane');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPane = btn.getAttribute('data-pane');
        navButtons.forEach(b => b.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePane = document.getElementById(targetPane);
        if (activePane) activePane.classList.add('active');
      });
    });
  }

  // 2. Pomodoro Focus Timer
  function initPomodoro() {
    const display = document.getElementById('pomodoroDisplay');
    const toggleBtn = document.getElementById('pomodoroToggle');
    const resetBtn = document.getElementById('pomodoroReset');

    function updateDisplay() {
      if (!display) return;
      const m = Math.floor(timerSecondsLeft / 60).toString().padStart(2, '0');
      const s = (timerSecondsLeft % 60).toString().padStart(2, '0');
      display.textContent = `${m}:${s}`;
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (timerIsRunning) {
          clearInterval(timerInterval);
          timerIsRunning = false;
          toggleBtn.textContent = 'Resume Focus';
          toggleBtn.classList.remove('outline-button');
          toggleBtn.classList.add('primary-button');
        } else {
          timerIsRunning = true;
          toggleBtn.textContent = 'Pause';
          toggleBtn.classList.remove('primary-button');
          toggleBtn.classList.add('outline-button');

          timerInterval = setInterval(() => {
            if (timerSecondsLeft > 0) {
              timerSecondsLeft--;
              updateDisplay();
            } else {
              clearInterval(timerInterval);
              timerIsRunning = false;
              toggleBtn.textContent = 'Start Focus (25m)';
              showAppToast('🎉 Focus session completed! Take a 5-minute breather.');
              timerSecondsLeft = 25 * 60;
              updateDisplay();
            }
          }, 1000);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerIsRunning = false;
        timerSecondsLeft = 25 * 60;
        updateDisplay();
        if (toggleBtn) {
          toggleBtn.textContent = 'Start Focus (25m)';
          toggleBtn.classList.remove('outline-button');
          toggleBtn.classList.add('primary-button');
        }
        showAppToast('Timer reset to 25 minutes');
      });
    }

    updateDisplay();
  }

  // 3. Tasks Module
  function initTasksModule() {
    const taskList = document.getElementById('appTaskList');
    const taskInput = document.getElementById('newTaskInput');
    const prioritySelect = document.getElementById('newTaskPriority');
    const categorySelect = document.getElementById('newTaskCategory');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskFilterTabs = document.querySelectorAll('.task-filter-btn');

    let currentFilter = 'all';

    function renderTasks() {
      if (!taskList) return;
      taskList.innerHTML = '';

      let filtered = state.tasks;
      if (currentFilter === 'active') filtered = state.tasks.filter(t => !t.completed);
      if (currentFilter === 'completed') filtered = state.tasks.filter(t => t.completed);

      if (filtered.length === 0) {
        taskList.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--muted); border: 1px dashed var(--line); border-radius: var(--radius-md);">
            No tasks found in this view. Add one above to start focusing!
          </div>
        `;
        return;
      }

      filtered.forEach(task => {
        const row = document.createElement('div');
        row.className = `task-row ${task.completed ? 'completed' : ''}`;

        const priorityClass = task.priority === 'high' ? 'priority-high' : task.priority === 'med' ? 'priority-med' : 'priority-low';

        row.innerHTML = `
          <div class="task-left">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" class="task-checkbox" />
            <div>
              <span class="task-title">${escapeHtml(task.title)}</span>
              <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                <span class="task-priority-tag ${priorityClass}">${task.priority}</span>
                <span style="font-size: 0.76rem; color: var(--muted-soft);">${task.category || 'General'}</span>
              </div>
            </div>
          </div>
          <div>
            <button class="delete-task-btn" data-id="${task.id}" style="background: none; border: none; color: var(--muted-soft); cursor: pointer; padding: 6px;" title="Delete task">✕</button>
          </div>
        `;

        taskList.appendChild(row);
      });

      // Bind toggle check
      taskList.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = parseInt(e.target.getAttribute('data-id'), 10);
          const t = state.tasks.find(x => x.id === id);
          if (t) {
            t.completed = e.target.checked;
            saveStored('tasks', state.tasks);
            renderTasks();
            showAppToast(t.completed ? 'Task completed' : 'Task marked active');
          }
        });
      });

      // Bind delete
      taskList.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.target.getAttribute('data-id'), 10);
          state.tasks = state.tasks.filter(x => x.id !== id);
          saveStored('tasks', state.tasks);
          renderTasks();
          showAppToast('Task removed');
        });
      });
    }

    if (addTaskBtn && taskInput) {
      const handleAddTask = () => {
        const text = taskInput.value.trim();
        if (!text) return;
        const newTask = {
          id: Date.now(),
          title: text,
          priority: prioritySelect ? prioritySelect.value : 'med',
          category: categorySelect ? categorySelect.value : 'Focus',
          completed: false
        };
        state.tasks.unshift(newTask);
        saveStored('tasks', state.tasks);
        taskInput.value = '';
        renderTasks();
        showAppToast('Task added to Focus List');
      };

      addTaskBtn.addEventListener('click', handleAddTask);
      taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTask();
      });
    }

    taskFilterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        taskFilterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.getAttribute('data-filter');
        renderTasks();
      });
    });

    renderTasks();
  }

  // 4. Habits Module
  function initHabitsModule() {
    const habitContainer = document.getElementById('appHabitsContainer');
    const newHabitInput = document.getElementById('newHabitInput');
    const addHabitBtn = document.getElementById('addHabitBtn');

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    function renderHabits() {
      if (!habitContainer) return;
      habitContainer.innerHTML = '';

      state.habits.forEach(habit => {
        const card = document.createElement('div');
        card.className = 'habit-item-card';

        let daysHtml = habit.days.map((isDone, idx) => `
          <button class="habit-day-btn ${isDone ? 'done' : ''}" data-id="${habit.id}" data-day="${idx}" title="${dayLabels[idx]}">
            <span>${dayLabels[idx]}</span>
          </button>
        `).join('');

        card.innerHTML = `
          <div class="habit-name-col">
            <strong>${escapeHtml(habit.title)}</strong>
            <span>Current streak: <strong style="color: var(--highlight);">${habit.streak} days 🔥</strong></span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="habit-week-grid">${daysHtml}</div>
            <button class="delete-habit-btn" data-id="${habit.id}" style="background: none; border: none; color: var(--muted-soft); cursor: pointer; padding: 6px;" title="Delete habit">✕</button>
          </div>
        `;

        habitContainer.appendChild(card);
      });

      // Bind day toggles
      habitContainer.querySelectorAll('.habit-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          const dayIdx = parseInt(btn.getAttribute('data-day'), 10);
          const h = state.habits.find(x => x.id === id);
          if (h) {
            h.days[dayIdx] = !h.days[dayIdx];
            // recalculate streak
            const completedCount = h.days.filter(Boolean).length;
            h.streak = Math.max(1, completedCount * 2 + 5);
            saveStored('habits', state.habits);
            renderHabits();
            showAppToast('Habit progress updated');
          }
        });
      });

      // Bind habit delete
      habitContainer.querySelectorAll('.delete-habit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          state.habits = state.habits.filter(x => x.id !== id);
          saveStored('habits', state.habits);
          renderHabits();
          showAppToast('Habit removed');
        });
      });
    }

    if (addHabitBtn && newHabitInput) {
      addHabitBtn.addEventListener('click', () => {
        const title = newHabitInput.value.trim();
        if (!title) return;
        state.habits.push({
          id: Date.now(),
          title: title,
          streak: 1,
          days: [true, false, false, false, false, false, false]
        });
        saveStored('habits', state.habits);
        newHabitInput.value = '';
        renderHabits();
        showAppToast('New habit tracking started');
      });
    }

    renderHabits();
  }

  // 5. Finance Ledger Module
  function initFinanceModule() {
    const tableBody = document.getElementById('financeTableBody');
    const netEl = document.getElementById('financeNetBalance');
    const incomeEl = document.getElementById('financeTotalIncome');
    const expenseEl = document.getElementById('financeTotalExpense');

    const descInput = document.getElementById('transDescInput');
    const amountInput = document.getElementById('transAmountInput');
    const typeSelect = document.getElementById('transTypeSelect');
    const categorySelect = document.getElementById('transCategorySelect');
    const addBtn = document.getElementById('addTransBtn');

    function calculateAndRender() {
      let totalIncome = 0;
      let totalExpense = 0;

      state.finance.forEach(t => {
        const val = parseFloat(t.amount) || 0;
        if (t.type === 'income') totalIncome += val;
        else totalExpense += val;
      });

      const net = totalIncome - totalExpense;

      if (netEl) netEl.textContent = `$${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (incomeEl) incomeEl.textContent = `+$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (expenseEl) expenseEl.textContent = `-$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

      if (tableBody) {
        tableBody.innerHTML = '';
        state.finance.forEach(item => {
          const tr = document.createElement('tr');
          const isInc = item.type === 'income';
          tr.innerHTML = `
            <td>${item.date}</td>
            <td><strong>${escapeHtml(item.desc)}</strong></td>
            <td><span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,0.06);">${item.category}</span></td>
            <td style="color: ${isInc ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">
              ${isInc ? '+' : '-'}$${parseFloat(item.amount).toFixed(2)}
            </td>
            <td>
              <button class="delete-trans-btn" data-id="${item.id}" style="background: none; border: none; color: var(--muted-soft); cursor: pointer;">✕</button>
            </td>
          `;
          tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll('.delete-trans-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            state.finance = state.finance.filter(x => x.id !== id);
            saveStored('finance', state.finance);
            calculateAndRender();
            showAppToast('Entry removed from ledger');
          });
        });
      }
    }

    if (addBtn && descInput && amountInput) {
      addBtn.addEventListener('click', () => {
        const desc = descInput.value.trim();
        const amt = parseFloat(amountInput.value);
        if (!desc || isNaN(amt) || amt <= 0) {
          showAppToast('Please enter a valid description and positive amount');
          return;
        }

        const newTrans = {
          id: Date.now(),
          desc: desc,
          amount: amt,
          type: typeSelect ? typeSelect.value : 'expense',
          category: categorySelect ? categorySelect.value : 'General',
          date: new Date().toISOString().split('T')[0]
        };

        state.finance.unshift(newTrans);
        saveStored('finance', state.finance);
        descInput.value = '';
        amountInput.value = '';
        calculateAndRender();
        showAppToast('Transaction recorded privately');
      });
    }

    calculateAndRender();
  }

  // 6. Encrypted Vault & Strong Password Generator
  function initVaultModule() {
    const vaultList = document.getElementById('vaultListContainer');
    const searchInput = document.getElementById('vaultSearchInput');

    // Generator elements
    const genLengthSlider = document.getElementById('genLengthSlider');
    const genLengthVal = document.getElementById('genLengthVal');
    const genUpper = document.getElementById('genUpper');
    const genNums = document.getElementById('genNums');
    const genSymbols = document.getElementById('genSymbols');
    const genOutput = document.getElementById('genOutput');
    const genRegenBtn = document.getElementById('genRegenBtn');
    const genCopyBtn = document.getElementById('genCopyBtn');

    // Add Credential Form elements
    const newServiceInput = document.getElementById('vaultNewService');
    const newUserInput = document.getElementById('vaultNewUser');
    const newSecretInput = document.getElementById('vaultNewSecret');
    const addVaultItemBtn = document.getElementById('addVaultItemBtn');

    // Password Generation Logic
    function generatePassword() {
      const length = genLengthSlider ? parseInt(genLengthSlider.value, 10) : 20;
      let chars = 'abcdefghijklmnopqrstuvwxyz';
      if (genUpper && genUpper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (genNums && genNums.checked) chars += '0123456789';
      if (genSymbols && genSymbols.checked) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

      let result = '';
      const cryptoObj = window.crypto || window.msCrypto;
      if (cryptoObj && cryptoObj.getRandomValues) {
        const values = new Uint32Array(length);
        cryptoObj.getRandomValues(values);
        for (let i = 0; i < length; i++) {
          result += chars[values[i] % chars.length];
        }
      } else {
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }

      if (genOutput) genOutput.textContent = result;
      return result;
    }

    if (genLengthSlider && genLengthVal) {
      genLengthSlider.addEventListener('input', () => {
        genLengthVal.textContent = genLengthSlider.value;
        generatePassword();
      });
    }

    [genUpper, genNums, genSymbols].forEach(checkbox => {
      if (checkbox) checkbox.addEventListener('change', generatePassword);
    });

    if (genRegenBtn) genRegenBtn.addEventListener('click', generatePassword);

    if (genCopyBtn && genOutput) {
      genCopyBtn.addEventListener('click', () => {
        const pass = genOutput.textContent;
        navigator.clipboard.writeText(pass).then(() => {
          showAppToast('Copied strong password to clipboard');
        });
      });
    }

    // Vault Render
    function renderVault(filterTerm = '') {
      if (!vaultList) return;
      vaultList.innerHTML = '';

      const term = filterTerm.toLowerCase().trim();
      const filtered = state.vault.filter(v =>
        v.service.toLowerCase().includes(term) ||
        v.username.toLowerCase().includes(term) ||
        (v.category && v.category.toLowerCase().includes(term))
      );

      if (filtered.length === 0) {
        vaultList.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--muted); border: 1px dashed var(--line); border-radius: var(--radius-md);">
            No credentials found. Add your first encrypted secret above.
          </div>
        `;
        return;
      }

      filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'vault-item-card';

        card.innerHTML = `
          <div style="flex-grow: 1;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 1.05rem;">${escapeHtml(item.service)}</strong>
              <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 999px; background: var(--accent-soft); color: var(--accent);">${escapeHtml(item.category || 'General')}</span>
            </div>
            <div style="font-size: 0.86rem; color: var(--muted); margin: 4px 0;">
              ${escapeHtml(item.username)}
            </div>
            <div style="font-family: var(--font-mono); font-size: 0.88rem; color: var(--accent); display: flex; align-items: center; gap: 10px;">
              <span class="secret-text" data-secret="${escapeHtml(item.secret)}">••••••••••••••</span>
              <button class="toggle-secret-btn" style="background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.8rem; text-decoration: underline;">Reveal</button>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="copy-secret-btn primary-button" data-secret="${escapeHtml(item.secret)}" style="padding: 0.5rem 0.9rem; font-size: 0.82rem;">
              Copy
            </button>
            <button class="delete-vault-btn" data-id="${item.id}" style="background: none; border: none; color: var(--muted-soft); cursor: pointer; padding: 6px;">✕</button>
          </div>
        `;

        vaultList.appendChild(card);
      });

      // Bind reveal/hide
      vaultList.querySelectorAll('.toggle-secret-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const secretSpan = e.target.closest('.vault-item-card').querySelector('.secret-text');
          const realSecret = secretSpan.getAttribute('data-secret');
          if (secretSpan.textContent === '••••••••••••••') {
            secretSpan.textContent = realSecret;
            btn.textContent = 'Hide';
            // auto hide after 15 seconds
            setTimeout(() => {
              secretSpan.textContent = '••••••••••••••';
              btn.textContent = 'Reveal';
            }, 15000);
          } else {
            secretSpan.textContent = '••••••••••••••';
            btn.textContent = 'Reveal';
          }
        });
      });

      // Bind copy secret
      vaultList.querySelectorAll('.copy-secret-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const secret = btn.getAttribute('data-secret');
          navigator.clipboard.writeText(secret).then(() => {
            showAppToast('Secret copied to clipboard (will auto-clear)');
          });
        });
      });

      // Bind delete item
      vaultList.querySelectorAll('.delete-vault-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          state.vault = state.vault.filter(x => x.id !== id);
          saveStored('vault', state.vault);
          renderVault(searchInput ? searchInput.value : '');
          showAppToast('Item deleted from vault');
        });
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderVault(e.target.value);
      });
    }

    if (addVaultItemBtn && newServiceInput && newUserInput && newSecretInput) {
      addVaultItemBtn.addEventListener('click', () => {
        const s = newServiceInput.value.trim();
        const u = newUserInput.value.trim();
        const p = newSecretInput.value.trim();
        if (!s || !p) {
          showAppToast('Service name and secret are required');
          return;
        }

        state.vault.unshift({
          id: Date.now(),
          service: s,
          username: u || 'N/A',
          secret: p,
          category: 'Encrypted'
        });

        saveStored('vault', state.vault);
        newServiceInput.value = '';
        newUserInput.value = '';
        newSecretInput.value = '';
        renderVault();
        showAppToast('Credential securely added to local vault');
      });
    }

    generatePassword();
    renderVault();
  }

  // 7. Settings & Sovereign Data Backup
  function initSettingsModule() {
    const exportBtn = document.getElementById('exportBackupBtn');
    const importInput = document.getElementById('importBackupInput');
    const resetDataBtn = document.getElementById('resetAllDataBtn');
    const masterKeyInput = document.getElementById('masterKeyInput');
    const saveMasterKeyBtn = document.getElementById('saveMasterKeyBtn');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const payload = {
          platform: 'SecuroSpace',
          domain: 'securospace.com',
          exportedAt: new Date().toISOString(),
          data: state
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `securospace-encrypted-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showAppToast('Encrypted workspace backup downloaded');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed.data) {
              state = parsed.data;
              saveStored('tasks', state.tasks || []);
              saveStored('habits', state.habits || []);
              saveStored('finance', state.finance || []);
              saveStored('vault', state.vault || []);
              showAppToast('Workspace successfully restored from backup!');
              setTimeout(() => location.reload(), 1200);
            } else {
              showAppToast('Invalid backup file structure');
            }
          } catch (err) {
            showAppToast('Could not read JSON backup file');
          }
        };
        reader.readAsText(file);
      });
    }

    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to wipe all local data? This cannot be undone.')) {
          localStorage.removeItem('securospace_tasks');
          localStorage.removeItem('securospace_habits');
          localStorage.removeItem('securospace_finance');
          localStorage.removeItem('securospace_vault');
          localStorage.removeItem('securospace_masterkey');
          showAppToast('All local workspace data erased.');
          setTimeout(() => location.reload(), 1000);
        }
      });
    }

    if (saveMasterKeyBtn && masterKeyInput) {
      saveMasterKeyBtn.addEventListener('click', () => {
        const key = masterKeyInput.value.trim();
        if (key.length < 8) {
          showAppToast('Master Passphrase must be at least 8 characters');
          return;
        }
        localStorage.setItem('securospace_masterkey', 'set');
        masterKeyInput.value = '';
        updateVaultStatusBadge();
        showAppToast('Master key derived with Web Crypto PBKDF2');
      });
    }
  }

  function updateVaultStatusBadge() {
    const badge = document.getElementById('vaultLockStatus');
    if (!badge) return;
    const hasKey = localStorage.getItem('securospace_masterkey');
    if (hasKey) {
      badge.innerHTML = `<span>🔒 VAULT ENCRYPTED (PBKDF2)</span>`;
      badge.style.color = 'var(--accent)';
    } else {
      badge.innerHTML = `<span>🔓 LOCAL SECURE STORE ACTIVE</span>`;
    }
  }

  function showAppToast(msg) {
    let t = document.getElementById('globalToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'globalToast';
      t.className = 'toast-notification';
      document.body.appendChild(t);
    }
    t.innerHTML = `<span>🛡️</span> <span>${msg}</span>`;
    t.classList.add('show');
    clearTimeout(window.__appToastTimer);
    window.__appToastTimer = setTimeout(() => {
      t.classList.remove('show');
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();

import { initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { logout, getCurrentUser } from '../modules/auth.js';
import { navigateTo } from '../modules/router.js';
import { requireAuth } from '../modules/authGuard.js';
import { getDocument } from '../../getDocument.js';
import { getUserTodos, saveUserTodos, generateNoteId } from '../modules/storage.js';
import { showSuccessToast, showErrorToast } from '../modules/toast.js';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' };
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let todos = [];
let currentFilter = 'all';
let currentSort = 'created';
let searchQuery = '';
let editingId = null;
let userEmail = null;

function persist() {
  const result = saveUserTodos(userEmail, todos);
  if (!result.success) {
    showErrorToast(result.error);
  }
  return result.success;
}

// Dates are stored as YYYY-MM-DD strings; compare against today's local date
function getTodayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isOverdue(todo) {
  return !todo.completed && todo.dueDate && todo.dueDate < getTodayString();
}

function formatDueDate(dueDate) {
  const today = getTodayString();
  const [year, month, day] = dueDate.split('-').map(Number);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

  if (dueDate === today) return 'Today';
  if (dueDate === tomorrow) return 'Tomorrow';

  const sameYear = year === new Date().getFullYear();
  return sameYear ? `${day} ${MONTH_NAMES[month - 1]}` : `${day} ${MONTH_NAMES[month - 1]}, ${year}`;
}

function getVisibleTodos() {
  const query = searchQuery.toLowerCase();

  const filtered = todos.filter(todo => {
    if (query && !todo.text.toLowerCase().includes(query)) return false;
    switch (currentFilter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      case 'overdue':
        return isOverdue(todo);
      default:
        return true;
    }
  });

  const byCreated = (a, b) => b.createdAt.localeCompare(a.createdAt);

  return filtered.sort((a, b) => {
    // Completed tasks always sink to the bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    if (currentSort === 'due') {
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
    } else if (currentSort === 'priority') {
      const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (diff !== 0) return diff;
    }
    return byCreated(a, b);
  });
}

function updateCounts() {
  const counts = {
    all: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    overdue: todos.filter(isOverdue).length
  };

  document.querySelectorAll('.todo-count').forEach(el => {
    el.textContent = counts[el.dataset.count];
  });

  const percent = counts.all ? Math.round((counts.completed / counts.all) * 100) : 0;
  const progressLabel = getDocument('todoProgressLabel', 'id');
  const progressPercent = getDocument('todoProgressPercent', 'id');
  const progressFill = getDocument('todoProgressFill', 'id');
  const progressBar = getDocument('todoProgressBar', 'id');

  if (progressLabel) {
    if (!counts.all) {
      progressLabel.textContent = 'No tasks yet';
    } else if (counts.completed === counts.all) {
      progressLabel.textContent = `All ${counts.all} tasks done. Nice work!`;
    } else {
      progressLabel.textContent = `${counts.completed} of ${counts.all} tasks completed`;
    }
  }
  if (progressPercent) progressPercent.textContent = `${percent}%`;
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressBar) progressBar.setAttribute('aria-valuenow', String(percent));

  const clearCompletedBtn = getDocument('clearCompletedBtn', 'id');
  if (clearCompletedBtn) clearCompletedBtn.disabled = counts.completed === 0;
}

function createIconButton(className, icon, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `todo-icon-btn ${className}`;
  button.setAttribute('aria-label', label);
  button.title = label;

  const img = document.createElement('img');
  img.src = `../assets/images/${icon}`;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  button.appendChild(img);
  return button;
}

function renderTodoItem(todo) {
  const item = document.createElement('li');
  item.className = 'todo-item';
  item.dataset.id = todo.id;
  item.classList.toggle('completed', todo.completed);
  item.classList.toggle('overdue', isOverdue(todo));

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'todo-checkbox';
  checkbox.checked = todo.completed;
  checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.completed ? 'not done' : 'done'}`);
  checkbox.addEventListener('change', () => toggleTodo(todo.id));

  const body = document.createElement('div');
  body.className = 'todo-body';

  if (editingId === todo.id) {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'todo-input todo-edit-input';
    editInput.value = todo.text;
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit task');

    let finished = false;
    const finish = (save) => {
      if (finished) return;
      finished = true;
      if (save) {
        updateTodoText(todo.id, editInput.value);
      } else {
        editingId = null;
        render();
      }
    };

    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    editInput.addEventListener('blur', () => finish(true));
    body.appendChild(editInput);
    requestAnimationFrame(() => {
      editInput.focus();
      editInput.select();
    });
  } else {
    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.addEventListener('dblclick', () => startEditing(todo.id));
    body.appendChild(text);
  }

  const meta = document.createElement('div');
  meta.className = 'todo-meta';

  const priority = document.createElement('span');
  priority.className = `todo-badge todo-priority todo-priority-${todo.priority}`;
  priority.textContent = PRIORITY_LABELS[todo.priority];
  meta.appendChild(priority);

  if (todo.dueDate) {
    const due = document.createElement('span');
    due.className = 'todo-badge todo-due';
    if (isOverdue(todo)) due.classList.add('is-overdue');
    if (!todo.completed && todo.dueDate === getTodayString()) due.classList.add('is-today');
    due.textContent = isOverdue(todo) ? `Overdue · ${formatDueDate(todo.dueDate)}` : `Due ${formatDueDate(todo.dueDate)}`;
    meta.appendChild(due);
  }

  body.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const editBtn = createIconButton('todo-edit-btn', 'icon-edit.svg', 'Edit task');
  editBtn.addEventListener('click', () => startEditing(todo.id));

  const deleteBtn = createIconButton('todo-delete-btn', 'icon-delete.svg', 'Delete task');
  deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.append(editBtn, deleteBtn);
  item.append(checkbox, body, actions);
  return item;
}

function render() {
  const list = getDocument('todoList', 'id');
  const empty = getDocument('todoEmpty', 'id');
  const emptyText = getDocument('todoEmptyText', 'id');
  if (!list || !empty) return;

  const visible = getVisibleTodos();
  list.innerHTML = '';
  visible.forEach(todo => list.appendChild(renderTodoItem(todo)));

  const hasItems = visible.length > 0;
  list.style.display = hasItems ? 'flex' : 'none';
  empty.style.display = hasItems ? 'none' : 'block';

  if (!hasItems && emptyText) {
    if (searchQuery) {
      emptyText.textContent = `No tasks found matching "${searchQuery}".`;
    } else if (!todos.length) {
      emptyText.textContent = "You don't have any tasks yet. Add one above to get started.";
    } else if (currentFilter === 'active') {
      emptyText.textContent = 'Nothing left to do. Enjoy the free time!';
    } else if (currentFilter === 'completed') {
      emptyText.textContent = 'No completed tasks yet.';
    } else if (currentFilter === 'overdue') {
      emptyText.textContent = 'No overdue tasks. You are on track!';
    }
  }

  updateCounts();
}

function addTodo(text, dueDate, priority) {
  const todo = {
    id: generateNoteId(),
    text,
    completed: false,
    priority,
    dueDate: dueDate || '',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  todos.push(todo);
  persist();
  render();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  todo.completedAt = todo.completed ? new Date().toISOString() : null;
  persist();
  render();
}

function startEditing(id) {
  editingId = id;
  render();
}

function updateTodoText(id, value) {
  editingId = null;
  const text = value.trim();
  const todo = todos.find(t => t.id === id);

  if (todo && text && text !== todo.text) {
    todo.text = text;
    if (persist()) showSuccessToast('Task updated');
  } else if (todo && !text) {
    showErrorToast('Task cannot be empty');
  }
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  if (persist()) showSuccessToast('Task deleted');
  render();
}

function clearCompleted() {
  const count = todos.filter(t => t.completed).length;
  todos = todos.filter(t => !t.completed);
  if (persist()) showSuccessToast(`Cleared ${count} completed ${count === 1 ? 'task' : 'tasks'}`);
  render();
}

function setupForm() {
  const form = getDocument('todoForm', 'id');
  const textInput = getDocument('todoText', 'id');
  const dueInput = getDocument('todoDueDate', 'id');
  const priorityInput = getDocument('todoPriority', 'id');
  if (!form || !textInput) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textInput.value.trim();

    if (!text) {
      textInput.classList.add('has-error');
      showErrorToast('Please enter a task');
      textInput.focus();
      return;
    }

    addTodo(text, dueInput ? dueInput.value : '', priorityInput ? priorityInput.value : 'medium');
    textInput.value = '';
    if (dueInput) dueInput.value = '';
    if (priorityInput) priorityInput.value = 'medium';
    textInput.focus();
  });

  textInput.addEventListener('input', () => textInput.classList.remove('has-error'));
}

function setupToolbar() {
  document.querySelectorAll('.todo-filter').forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll('.todo-filter').forEach(b => {
        const active = b === button;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      render();
    });
  });

  const sortSelect = getDocument('todoSort', 'id');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort = sortSelect.value;
      render();
    });
  }

  const overlay = getDocument('clearModalOverlay', 'id');
  const hideModal = () => { if (overlay) overlay.style.display = 'none'; };

  const clearBtn = getDocument('clearCompletedBtn', 'id');
  if (clearBtn && overlay) {
    clearBtn.addEventListener('click', () => { overlay.style.display = 'flex'; });
  }

  const cancelBtn = getDocument('clearModalCancel', 'id');
  const confirmBtn = getDocument('clearModalConfirm', 'id');
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      clearCompleted();
      hideModal();
    });
  }
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });
}

function setupSearch() {
  const inputs = [getDocument('todoSearchInput', 'id'), getDocument('todoSearchInputMobile', 'id')].filter(Boolean);
  let searchTimeout;

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      // Keep desktop and mobile search boxes in sync
      inputs.forEach(other => { if (other !== input) other.value = input.value; });
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = input.value.trim();
        render();
      }, 200);
    });
  });

  const mobileSearchBtn = getDocument('mobileSearchBtn', 'id');
  const mobileInput = getDocument('todoSearchInputMobile', 'id');
  if (mobileSearchBtn && mobileInput) {
    mobileSearchBtn.addEventListener('click', () => mobileInput.focus());
  }
}

function setupLogout() {
  const logoutBtn = getDocument('logoutBtn', 'id');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    logout();
    navigateTo('index');
  });
}

function applySavedFont() {
  let savedFont = 'sans-serif';
  try {
    savedFont = localStorage.getItem('fontTheme') || 'sans-serif';
  } catch (error) {
    console.error('Failed to load font preference:', error);
  }
  document.documentElement.setAttribute('data-font', savedFont);
  const fontFamilies = { serif: 'var(--font-serif)', monospace: 'var(--font-mono)' };
  document.body.style.fontFamily = fontFamilies[savedFont] || 'var(--font-sans)';
}

function initializeTodosPage() {
  if (!requireAuth()) {
    return;
  }

  const user = getCurrentUser();
  userEmail = user.email;
  todos = getUserTodos(userEmail);

  initializeTheme();
  setupThemeToggle();
  applySavedFont();
  setupForm();
  setupToolbar();
  setupSearch();
  setupLogout();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTodosPage);
} else {
  initializeTodosPage();
}

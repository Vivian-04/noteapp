const NOTES_STORAGE_KEY = 'notes-user-notes';
const SAMPLE_NOTES_LOADED_KEY = 'notes-sample-loaded';
const TODOS_STORAGE_KEY = 'notes-user-todos';

function getUserNotes(email) {
  try {
    const notesJson = localStorage.getItem(`${NOTES_STORAGE_KEY}-${email}`);
    return notesJson ? JSON.parse(notesJson) : [];
  } catch (error) {
    console.error('Failed to load user notes:', error);
    return [];
  }
}

function saveUserNotes(email, notes) {
  try {
    const notesJson = JSON.stringify(notes);
    localStorage.setItem(`${NOTES_STORAGE_KEY}-${email}`, notesJson);
    return { success: true };
  } catch (error) {
    console.error('Failed to save user notes:', error);
    // Check if it's a quota exceeded error
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return { success: false, error: 'Storage quota exceeded. Please delete some notes or clear your browser storage.' };
    }
    return { success: false, error: 'Failed to save notes. Please try again.' };
  }
}

function getUserTodos(email) {
  try {
    const todosJson = localStorage.getItem(`${TODOS_STORAGE_KEY}-${email}`);
    return todosJson ? JSON.parse(todosJson) : [];
  } catch (error) {
    console.error('Failed to load user todos:', error);
    return [];
  }
}

function saveUserTodos(email, todos) {
  try {
    localStorage.setItem(`${TODOS_STORAGE_KEY}-${email}`, JSON.stringify(todos));
    return { success: true };
  } catch (error) {
    console.error('Failed to save user todos:', error);
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return { success: false, error: 'Storage quota exceeded. Please delete some tasks or clear your browser storage.' };
    }
    return { success: false, error: 'Failed to save tasks. Please try again.' };
  }
}

function getSampleNotesLoaded() {
  try {
    const loaded = localStorage.getItem(SAMPLE_NOTES_LOADED_KEY);
    return loaded === 'true';
  } catch (error) {
    return false;
  }
}

function setSampleNotesLoaded(loaded) {
  try {
    localStorage.setItem(SAMPLE_NOTES_LOADED_KEY, loaded ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to save sample notes loaded state:', error);
  }
}

async function loadSampleNotes() {
  try {
    const response = await fetch('../data.json');
    if (!response.ok) {
      throw new Error('Failed to load sample notes');
    }
    const data = await response.json();
    return data.notes || [];
  } catch (error) {
    console.error('Failed to load sample notes:', error);
    return [];
  }
}

function generateNoteId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export {
  getUserNotes,
  saveUserNotes,
  getUserTodos,
  saveUserTodos,
  getSampleNotesLoaded,
  setSampleNotesLoaded,
  loadSampleNotes,
  generateNoteId
};


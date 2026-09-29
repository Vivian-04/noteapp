import { initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { logout, getCurrentUser } from '../modules/auth.js';
import { navigateTo } from '../modules/router.js';
import { requireAuth } from '../modules/authGuard.js';
import { getDocument } from '../../getDocument.js';
import {
  getUserNotes,
  saveUserNotes,
  generateNoteId
} from '../modules/storage.js';
import { setupNotesList, setupTagsManagement, setupTagInputStyling } from './notes-list.js';
import { showSuccessToast, showErrorToast } from '../modules/toast.js';

// Import formatNoteContentForQuill from notes-list.js (it's not exported, so we'll create a local version)
// This function converts plain text to HTML for Quill editor
function formatNoteContentForQuill(content) {
  if (!content) return '';
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  const lines = content.split('\n');
  let html = '';
  let currentParagraph = '';
  let inParagraph = false;
  let consecutiveEmptyLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    const isNumberedList = i > 0 && /^\d+\.\s/.test(line.trim());
    const isBulletList = /^-\s/.test(line.trim());
    
    if (!line.trim()) {
      if (inParagraph && currentParagraph) {
        html += `<p>${currentParagraph}</p>`;
        currentParagraph = '';
        inParagraph = false;
      }
      consecutiveEmptyLines++;
      if (nextLine && nextLine.trim()) {
        for (let j = 0; j < consecutiveEmptyLines; j++) {
          html += '<p><br></p>';
        }
        consecutiveEmptyLines = 0;
      } else if (!nextLine) {
        for (let j = 0; j < consecutiveEmptyLines; j++) {
          html += '<p><br></p>';
        }
        consecutiveEmptyLines = 0;
      }
      continue;
    }
    
    if (consecutiveEmptyLines > 0) {
      for (let j = 0; j < consecutiveEmptyLines; j++) {
        html += '<p><br></p>';
      }
      consecutiveEmptyLines = 0;
    }
    
    if (isNumberedList) {
      if (inParagraph && currentParagraph) {
        html += `<p>${currentParagraph}</p>`;
        currentParagraph = '';
      }
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      html += `<p>${escapeHtml(processedLine)}</p>`;
      inParagraph = false;
      continue;
    }
    
    if (isBulletList) {
      if (inParagraph && currentParagraph) {
        html += `<p>${currentParagraph}</p>`;
        currentParagraph = '';
      }
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      html += `<p>${escapeHtml(processedLine)}</p>`;
      inParagraph = false;
      continue;
    }
    
    if (!inParagraph) {
      inParagraph = true;
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      currentParagraph = escapeHtml(processedLine);
    } else {
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      currentParagraph += '<br>' + escapeHtml(processedLine);
    }
  }
  
  if (inParagraph && currentParagraph) {
    html += `<p>${currentParagraph}</p>`;
  }
  
  return html || '<p><br></p>';
}

let currentView = 'all';
let currentNoteId = null;

function updateEmptyStateMessage(view) {
  const emptyStateText = getDocument('emptyStateText', 'id');
  const emptyStateInfo = getDocument('emptyStateInfo', 'id');
  const emptyStateInfoText = getDocument('emptyStateInfoText', 'id');
  
  if (view === 'archived') {
    if (emptyStateInfo) emptyStateInfo.style.display = 'block';
    if (emptyStateInfoText) {
      emptyStateInfoText.textContent = 'All your archived notes are stored here. You can restore or delete them anytime.';
      emptyStateInfoText.style.lineHeight = '1.4';
      emptyStateInfoText.style.fontSize = '0.8rem';
    }
    if (emptyStateText) {
      emptyStateText.innerHTML = 'No notes have been archived yet. Move notes here for safekeeping, or <a href="#" id="createNoteLink" class="empty-state-link">create a new note</a>.';
      emptyStateText.style.lineHeight = '1.4';
      emptyStateText.style.fontSize = '0.8rem';
      
      const createNoteLink = getDocument('createNoteLink', 'id');
      if (createNoteLink) {
        createNoteLink.addEventListener('click', (e) => {
          e.preventDefault();
          const createNoteBtn = getDocument('createNoteBtn', 'id');
          if (createNoteBtn) createNoteBtn.click();
        });
      }
    }
  } else {
    if (emptyStateInfo) emptyStateInfo.style.display = 'none';
    if (emptyStateText) {
      emptyStateText.textContent = 'You don\'t have any notes yet. Start a new note to capture your thoughts and ideas.';
    }
  }
}

function setupNavigation() {
  const allNotesBtn = getDocument('allNotesBtn', 'id');
  const archivedNotesBtn = getDocument('archivedNotesBtn', 'id');
  const mobileHomeBtn = getDocument('mobileHomeBtn', 'id');
  const mobileArchivedBtn = getDocument('mobileArchivedBtn', 'id');
  
  function setActiveView(view) {
    currentView = view;
    window.currentView = view;
    
    const allActive = view === 'all';
    const archivedActive = view === 'archived';
    
    if (allNotesBtn) {
      allNotesBtn.classList.toggle('active', allActive);
      allNotesBtn.setAttribute('aria-current', allActive ? 'page' : null);
    }
    
    if (archivedNotesBtn) {
      archivedNotesBtn.classList.toggle('active', archivedActive);
      archivedNotesBtn.setAttribute('aria-current', archivedActive ? 'page' : null);
    }
    
    if (mobileHomeBtn) {
      mobileHomeBtn.classList.toggle('active', allActive);
      mobileHomeBtn.setAttribute('aria-current', allActive ? 'page' : null);
    }
    
    if (mobileArchivedBtn) {
      mobileArchivedBtn.classList.toggle('active', archivedActive);
      mobileArchivedBtn.setAttribute('aria-current', archivedActive ? 'page' : null);
    }
    
    const pageTitle = getDocument('pageTitle', 'id');
    const mobilePageTitle = document.querySelector('.mobile-page-title');
    
    // Clear any tag selection when switching views
    if (window.updateHeaderForTag) {
      window.updateHeaderForTag(null);
    }
    if (window.updateEmptyStateForTag) {
      window.updateEmptyStateForTag(null);
    }
    
    if (pageTitle) {
      pageTitle.textContent = allActive ? 'All Notes' : 'Archived Notes';
    }
    
    if (mobilePageTitle) {
      mobilePageTitle.textContent = allActive ? 'All Notes' : 'Archived Notes';
    }
    
    // Hide editor when switching views if a note is selected
    if (window.currentNoteId) {
      if (window.hideEditor) {
        window.hideEditor();
      }
      // Clear current note selection
      if (window.setCurrentNoteId) {
        window.setCurrentNoteId(null);
      }
      window.currentNoteId = null;
    }
    
    updateEmptyStateMessage(view);
    if (window.renderNotes) window.renderNotes();
    
    // Update archive button text based on view
    if (window.updateArchiveButton) {
      window.updateArchiveButton();
    }
  }
  
  // Export setActiveView so it can be called from other places
  window.setActiveView = setActiveView;
  
  if (allNotesBtn) {
    allNotesBtn.addEventListener('click', () => setActiveView('all'));
  }
  
  if (archivedNotesBtn) {
    archivedNotesBtn.addEventListener('click', () => setActiveView('archived'));
  }
  
  if (mobileHomeBtn) {
    mobileHomeBtn.addEventListener('click', () => setActiveView('all'));
  }
  
  if (mobileArchivedBtn) {
    mobileArchivedBtn.addEventListener('click', () => setActiveView('archived'));
  }
}

let quillEditor = null;

function setupCreateNote() {
  const createNoteBtn = getDocument('createNoteBtn', 'id');
  const mobileCreateNoteBtn = getDocument('mobileCreateNoteBtn', 'id');
  const noteEditor = getDocument('noteEditor', 'id');
  const rightPanelEmpty = getDocument('rightPanelEmpty', 'id');
  const noteTitle = getDocument('noteTitle', 'id');
  const noteTags = getDocument('noteTags', 'id');
  const lastEdited = getDocument('lastEdited', 'id');
  const saveNoteBtn = getDocument('saveNoteBtn', 'id');
  const cancelNoteBtn = getDocument('cancelNoteBtn', 'id');
  const emptyState = getDocument('emptyState', 'id');
  const emptyStateText = getDocument('emptyStateText', 'id');
  
  // Auto-save draft functionality - defined before initializeQuill
  let draftSaveTimeout;
  
  function saveDraft() {
    const user = getCurrentUser();
    if (!user || window.currentNoteId) return; // Don't save draft for existing notes
    
    try {
      const title = noteTitle ? noteTitle.value.trim() : '';
      const tags = noteTags ? noteTags.value.trim() : '';
      const htmlContent = quillEditor ? quillEditor.root.innerHTML : '';
      const plainTextContent = convertQuillToPlainText(htmlContent);
      
      // Only save draft if there's content
      if (title || plainTextContent.trim()) {
        const draftData = {
          title,
          tags,
          content: plainTextContent,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem(`note-draft-${user.email}`, JSON.stringify(draftData));
      } else {
        // Clear draft if no content
        sessionStorage.removeItem(`note-draft-${user.email}`);
      }
    } catch (e) {
      // Handle quota exceeded or other errors silently
      if (e.name === 'QuotaExceededError') {
        console.warn('SessionStorage quota exceeded. Draft not saved.');
      }
    }
  }
  
  function debouncedSaveDraft() {
    clearTimeout(draftSaveTimeout);
    draftSaveTimeout = setTimeout(saveDraft, 1000); // Save after 1 second of inactivity
  }
  
  function initializeQuill() {
    if (!quillEditor) {
      const editorContainer = getDocument('noteContentEditor', 'id');
      // Check if Quill is already initialized by looking for .ql-container
      if (editorContainer && typeof Quill !== 'undefined' && !editorContainer.querySelector('.ql-container')) {
        quillEditor = new Quill('#noteContentEditor', {
          theme: 'snow',
          placeholder: 'Start typing your note here...',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link'],
              ['clean']
            ]
          }
        });
        window.quillEditor = quillEditor;
        
        // Set up auto-save draft on text change
        quillEditor.on('text-change', debouncedSaveDraft);
      } else if (window.quillEditor) {
        // Use existing Quill instance if available
        quillEditor = window.quillEditor;
        // Ensure auto-save is set up
        if (!quillEditor._draftListenerAdded) {
          quillEditor.on('text-change', debouncedSaveDraft);
          quillEditor._draftListenerAdded = true;
        }
      }
    } else if (window.quillEditor && !quillEditor) {
      quillEditor = window.quillEditor;
      // Ensure auto-save is set up
      if (!quillEditor._draftListenerAdded) {
        quillEditor.on('text-change', debouncedSaveDraft);
        quillEditor._draftListenerAdded = true;
      }
    }
  }
  
  function updateUntitledNote() {
    if (emptyState && emptyStateText && noteTitle) {
      const titleValue = noteTitle.value.trim();
      if (titleValue) {
        emptyStateText.textContent = titleValue;
      } else {
        emptyStateText.textContent = 'Untitled Note';
      }
      
      const createNoteBtn = getDocument('createNoteBtn', 'id');
      if (createNoteBtn && emptyStateText) {
        const buttonWidth = createNoteBtn.offsetWidth;
        emptyStateText.style.width = `${buttonWidth}px`;
        emptyStateText.style.display = 'inline-block';
      }
    }
  }
  
  window.updateUntitledNote = updateUntitledNote;
  
  function showEditor() {
    // Switch to editor view on tablet
    if (window.switchToEditorView) {
      window.switchToEditorView();
    }
    
    if (noteEditor) noteEditor.style.display = 'flex';
    if (rightPanelEmpty) rightPanelEmpty.style.display = 'none';
    
    // Show "Untitled Note" text but keep notes list visible
    const notesList = getDocument('notesList', 'id');
    if (emptyState && emptyStateText) {
      // Show empty state with "Untitled Note" text, but don't hide notes list
      // The emptyState will appear alongside the notes list
      emptyState.style.display = 'flex';
      emptyStateText.textContent = 'Untitled Note';
      const createNoteBtn = getDocument('createNoteBtn', 'id');
      if (createNoteBtn && emptyStateText) {
        const buttonWidth = createNoteBtn.offsetWidth;
        emptyStateText.style.width = `${buttonWidth}px`;
        emptyStateText.style.display = 'inline-block';
      }
      // Keep notes list visible if it has content (don't hide it)
      if (notesList && notesList.children.length > 0) {
        notesList.style.display = 'flex';
      }
      // Move emptyState to the top (before notesList) when creating a new note
      if (emptyState && notesList && emptyState.parentNode) {
        emptyState.parentNode.insertBefore(emptyState, notesList);
      }
    }
    
    // Hide action buttons when creating a new note
    const actionsSidebarContent = getDocument('actionsSidebarContent', 'id');
    if (actionsSidebarContent) {
      actionsSidebarContent.style.display = 'none';
    }
    
    // Show mobile page header control on tablet/mobile
    const width = window.innerWidth;
    const isTablet = width >= 769 && width <= 1024;
    const isMobile = width <= 768;
    
    if (isTablet || isMobile) {
      const mobilePageHeaderControl = getDocument('mobilePageHeaderControl', 'id');
      if (mobilePageHeaderControl) {
        mobilePageHeaderControl.style.display = 'flex';
        
        // Hide delete/archive buttons when creating a new note
        const deleteNoteBtnMobile = getDocument('deleteNoteBtnMobile', 'id');
        const archiveNoteBtnMobile = getDocument('archiveNoteBtnMobile', 'id');
        if (deleteNoteBtnMobile && archiveNoteBtnMobile) {
          deleteNoteBtnMobile.style.display = 'none';
          archiveNoteBtnMobile.style.display = 'none';
        }
      }
    }
    
    // Initialize Quill before clearing
    initializeQuill();
    
    // Restore draft from sessionStorage if available
    const user = getCurrentUser();
    if (user && !window.currentNoteId) {
      try {
        const draftKey = `note-draft-${user.email}`;
        const draft = sessionStorage.getItem(draftKey);
        if (draft) {
          const draftData = JSON.parse(draft);
          if (noteTitle && draftData.title) {
            noteTitle.value = draftData.title;
          }
          if (noteTags && draftData.tags) {
            noteTags.value = draftData.tags;
          }
          if (quillEditor && draftData.content) {
            const formattedContent = formatNoteContentForQuill(draftData.content);
            setTimeout(() => {
              if (quillEditor) {
                quillEditor.root.innerHTML = formattedContent;
              }
            }, 0);
          }
          updateUntitledNote();
        } else {
          // No draft - clear fields
          if (noteTitle) {
            noteTitle.value = '';
            noteTitle.focus();
            updateUntitledNote();
          }
          if (noteTags) noteTags.value = '';
          if (lastEdited) lastEdited.textContent = 'Not yet saved';
          if (quillEditor) quillEditor.setText('');
        }
      } catch (e) {
        console.warn('Could not restore draft:', e);
        // Clear fields on error
        if (noteTitle) {
          noteTitle.value = '';
          noteTitle.focus();
          updateUntitledNote();
        }
        if (noteTags) noteTags.value = '';
        if (lastEdited) lastEdited.textContent = 'Not yet saved';
        if (quillEditor) quillEditor.setText('');
      }
    } else {
      // Editing existing note - clear fields
      if (noteTitle) {
        noteTitle.value = '';
        noteTitle.focus();
        updateUntitledNote();
      }
      if (noteTags) noteTags.value = '';
      if (lastEdited) lastEdited.textContent = 'Not yet saved';
      if (quillEditor) quillEditor.setText('');
    }
  }
  
  // Auto-save draft on input (debounced) - functions already defined above
  if (noteTitle && emptyStateText) {
    noteTitle.addEventListener('input', () => {
      updateUntitledNote();
      debouncedSaveDraft();
    });
    noteTitle.addEventListener('keyup', () => {
      updateUntitledNote();
      debouncedSaveDraft();
    });
    noteTitle.addEventListener('paste', () => {
      setTimeout(() => {
        updateUntitledNote();
        debouncedSaveDraft();
      }, 0);
    });
  }
  
  // Auto-save draft when Quill content changes (will be set up in initializeQuill)
  
  function hideEditor() {
    // Switch back to list view on tablet
    if (window.switchToListView) {
      window.switchToListView();
    }
    
    // Hide mobile page header control
    const width = window.innerWidth;
    const isTablet = width >= 769 && width <= 1024;
    const isMobile = width <= 768;
    
    if (isTablet || isMobile) {
      const mobilePageHeaderControl = getDocument('mobilePageHeaderControl', 'id');
      if (mobilePageHeaderControl) {
        mobilePageHeaderControl.style.display = 'none';
      }
    }
    
    if (noteEditor) noteEditor.style.display = 'none';
    if (rightPanelEmpty) rightPanelEmpty.style.display = 'flex';
    // Clear the flag when hiding editor
    window.isCreatingNewNote = false;
    if (emptyState && emptyStateText) {
      updateEmptyStateMessage(currentView);
    }
  }
  
  window.hideEditor = hideEditor;
  
  function handleCreateNote() {
    if (window.setCurrentNoteId) window.setCurrentNoteId(null);
    window.currentNoteId = null;
    // Set flag to indicate we're creating a new note
    window.isCreatingNewNote = true;
    showEditor();
  }
  
  // Convert Quill HTML content to plain text (like data.json format)
  // Preserves: newlines, numbering (1. ), bullet lists (- ), tabs
  function convertQuillToPlainText(htmlContent) {
    if (!htmlContent) return '';
    
    // Create a temporary div to parse HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Convert to plain text, preserving structure
    let plainText = '';
    const nodes = tempDiv.childNodes;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      if (node.nodeType === Node.TEXT_NODE) {
        // Plain text node - preserve as is
        plainText += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        const textContent = node.textContent || '';
        
        if (tagName === 'p') {
          // Check if it's just a line break (empty paragraph)
          if (textContent.trim() === '') {
            plainText += '\n';
          } else {
            // Regular paragraph - add text and newline
            // Preserve tabs (convert &nbsp; back to tabs if needed)
            let lineText = textContent;
            // Convert multiple non-breaking spaces back to tabs (4 spaces = 1 tab)
            lineText = lineText.replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, '\t');
            lineText = lineText.replace(/&nbsp;/g, ' ');
            plainText += lineText + '\n';
          }
        } else if (tagName === 'br') {
          // Line break
          plainText += '\n';
        } else {
          // Other elements (like strong, em, etc.) - just get text content
          let text = node.textContent || '';
          text = text.replace(/&nbsp;&nbsp;&nbsp;&nbsp;/g, '\t');
          text = text.replace(/&nbsp;/g, ' ');
          plainText += text;
        }
      }
    }
    
    // Clean up: normalize multiple consecutive newlines (max 2)
    plainText = plainText.replace(/\n{3,}/g, '\n\n');
    // Remove trailing newlines
    plainText = plainText.replace(/\n+$/, '');
    
    return plainText;
  }
  
  function handleSaveNote() {
    // Clear the flag when saving
    window.isCreatingNewNote = false;
    const title = noteTitle ? noteTitle.value.trim() : '';
    const tagsInput = noteTags ? noteTags.value.trim() : '';
    
    // Ensure Quill is initialized
    if (!quillEditor && window.quillEditor) {
      quillEditor = window.quillEditor;
    }
    
    // Get HTML from Quill and convert to plain text for storage
    const htmlContent = quillEditor ? quillEditor.root.innerHTML : '';
    const plainTextContent = convertQuillToPlainText(htmlContent);
    
    // Form validation: require at least title or content
    if (!title && !plainTextContent.trim()) {
      showErrorToast('Note must have at least a title or content');
      return;
    }
    
    const user = getCurrentUser();
    if (!user) {
      showErrorToast('User not found. Please log in again.');
      return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    const now = new Date().toISOString();
    
    let userNotes = getUserNotes(user.email);
    
    try {
      if (window.currentNoteId) {
        // Update existing note
        const noteIndex = userNotes.findIndex(n => n.id === window.currentNoteId);
        if (noteIndex !== -1) {
          userNotes[noteIndex] = {
            ...userNotes[noteIndex],
            title: title || 'Untitled Note',
            tags,
            content: plainTextContent, // Save as plain text, not HTML
            lastEdited: now
          };
        } else {
          console.error('Note not found for update');
          return;
        }
      } else {
        // Create new note
        const newNote = {
          id: generateNoteId(),
          title: title || 'Untitled Note',
          tags,
          content: plainTextContent, // Save as plain text, not HTML
          lastEdited: now,
          isArchived: false,
          deleted: false
        };
        userNotes.push(newNote);
        if (window.setCurrentNoteId) window.setCurrentNoteId(newNote.id);
        window.currentNoteId = newNote.id;
      }
      
      // Save to localStorage
      const saveResult = saveUserNotes(user.email, userNotes);
      if (!saveResult.success) {
        console.error('Failed to save note:', saveResult.error);
        showErrorToast(saveResult.error || 'Failed to save note. Please try again.');
        return;
      }
      
      // Show success message
      if (window.currentNoteId) {
        showSuccessToast('Note updated successfully');
      } else {
        showSuccessToast('Note created successfully');
      }
      
      // Clear any draft in sessionStorage after successful save
      try {
        sessionStorage.removeItem(`note-draft-${user.email}`);
      } catch (e) {
        console.warn('Could not clear draft:', e);
      }
      
      // Update last edited display
      if (lastEdited) {
        const date = new Date(now);
        const day = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        lastEdited.textContent = `${day} ${month}, ${year}`;
      }
      
      // Refresh notes list and tags
      if (window.renderNotes) window.renderNotes();
      if (window.updateSidebarTags) window.updateSidebarTags();
      
      // Show action buttons after saving (note is now in the list)
      const actionsSidebarContent = getDocument('actionsSidebarContent', 'id');
      if (actionsSidebarContent && window.currentNoteId) {
        actionsSidebarContent.style.display = 'flex';
      }
      
      // Don't hide editor immediately - let user see their saved note
      // Only hide on mobile/tablet if they want to go back to list
      const width = window.innerWidth;
      const isTablet = width >= 769 && width <= 1024;
      const isMobile = width <= 768;
      
      // On desktop, keep editor open. On mobile/tablet, user can use go back button
      if (isMobile || isTablet) {
        // On mobile/tablet, we keep the editor open but user can navigate back
        // The note is saved and visible in the list
      }
      
    } catch (error) {
      console.error('Error saving note:', error);
      showErrorToast('An error occurred while saving the note. Please try again.');
    }
  }
  
  function handleCancelNote() {
    hideEditor();
  }
  
  if (createNoteBtn) {
    createNoteBtn.addEventListener('click', handleCreateNote);
  }
  
  if (mobileCreateNoteBtn) {
    mobileCreateNoteBtn.addEventListener('click', handleCreateNote);
  }
  
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', handleSaveNote);
  }
  
  if (cancelNoteBtn) {
    cancelNoteBtn.addEventListener('click', handleCancelNote);
  }
}

function setupNoteActions() {
  const archiveNoteBtn = getDocument('archiveNoteBtn', 'id');
  const deleteNoteBtn = getDocument('deleteNoteBtn', 'id');
  const archiveModalOverlay = getDocument('archiveModalOverlay', 'id');
  const deleteModalOverlay = getDocument('deleteModalOverlay', 'id');
  const archiveModalCancel = getDocument('archiveModalCancel', 'id');
  const archiveModalConfirm = getDocument('archiveModalConfirm', 'id');
  const deleteModalCancel = getDocument('deleteModalCancel', 'id');
  const deleteModalConfirm = getDocument('deleteModalConfirm', 'id');
  
  function showArchiveModal() {
    if (archiveModalOverlay) {
      archiveModalOverlay.style.display = 'flex';
    }
  }
  
  function hideArchiveModal() {
    if (archiveModalOverlay) {
      archiveModalOverlay.style.display = 'none';
    }
  }
  
  function showDeleteModal() {
    if (deleteModalOverlay) {
      deleteModalOverlay.style.display = 'flex';
    }
  }
  
  function hideDeleteModal() {
    if (deleteModalOverlay) {
      deleteModalOverlay.style.display = 'none';
    }
  }
  
  function handleArchiveNote() {
    const user = getCurrentUser();
    if (!user || !window.currentNoteId) return;
    
    const userNotes = getUserNotes(user.email);
    const noteIndex = userNotes.findIndex(n => n.id === window.currentNoteId);
    
    if (noteIndex !== -1) {
      const currentView = window.currentView || 'all';
      const isArchivedView = currentView === 'archived';
      
      // Toggle archive status: if in archived view, restore it; otherwise archive it
      userNotes[noteIndex] = {
        ...userNotes[noteIndex],
        isArchived: !isArchivedView,
        lastEdited: new Date().toISOString()
      };
      
      const saveResult = saveUserNotes(user.email, userNotes);
      
      if (saveResult.success) {
        if (isArchivedView) {
          showSuccessToast('Note restored successfully');
          
          // If restoring from archived view, switch to all notes view
          if (window.currentView === 'archived') {
            // Switch to all notes view
            if (window.setActiveView && typeof window.setActiveView === 'function') {
              window.setActiveView('all');
            } else {
              // Fallback: manually switch view
              const allNotesBtn = getDocument('allNotesBtn', 'id');
              if (allNotesBtn) {
                allNotesBtn.click();
              } else {
                window.currentView = 'all';
                if (window.renderNotes) window.renderNotes();
              }
            }
          }
        } else {
          showSuccessToast('Note archived successfully');
        }
        
        // Hide editor and refresh notes list
        if (window.hideEditor) window.hideEditor();
        if (window.renderNotes) window.renderNotes();
        if (window.updateSidebarTags) window.updateSidebarTags();
        
        // Hide action buttons
        const actionsSidebarContent = getDocument('actionsSidebarContent', 'id');
        if (actionsSidebarContent) {
          actionsSidebarContent.style.display = 'none';
        }
      } else {
        const errorMsg = isArchivedView 
          ? 'Failed to restore note. Please try again.'
          : 'Failed to archive note. Please try again.';
        showErrorToast(saveResult.error || errorMsg);
      }
    }
    
    hideArchiveModal();
  }
  
  // Function to update archive button text and modal based on current view
  function updateArchiveButton() {
    const archiveNoteBtn = getDocument('archiveNoteBtn', 'id');
    const archiveNoteBtnMobile = getDocument('archiveNoteBtnMobile', 'id');
    const archiveModalTitle = document.querySelector('#archiveModalOverlay .modal-title');
    const archiveModalMessage = document.querySelector('#archiveModalOverlay .modal-message');
    const archiveModalConfirm = getDocument('archiveModalConfirm', 'id');
    const archiveModalIcon = document.querySelector('#archiveModalOverlay .modal-icon');
    
    const currentView = window.currentView || 'all';
    const isArchivedView = currentView === 'archived';
    
    if (archiveNoteBtn) {
      const buttonText = archiveNoteBtn.querySelector('span');
      if (buttonText) {
        buttonText.textContent = isArchivedView ? 'Restore Note' : 'Archive Note';
      }
      archiveNoteBtn.setAttribute('aria-label', isArchivedView ? 'Restore note' : 'Archive note');
    }
    
    if (archiveNoteBtnMobile) {
      archiveNoteBtnMobile.setAttribute('aria-label', isArchivedView ? 'Restore note' : 'Archive note');
    }
    
    if (archiveModalTitle) {
      archiveModalTitle.textContent = isArchivedView ? 'Restore Note' : 'Archive Note';
    }
    
    if (archiveModalMessage) {
      archiveModalMessage.textContent = isArchivedView
        ? 'Are you sure you want to restore this note? It will be moved back to All Notes.'
        : 'Are you sure you want to archive this note? You can find it in the Archived Notes section and restore it anytime.';
    }
    
    if (archiveModalConfirm) {
      archiveModalConfirm.textContent = isArchivedView ? 'Restore Note' : 'Archive Note';
    }
    
    // Update modal icon - use restore icon in archived view, archive icon otherwise
    if (archiveModalIcon) {
      const currentSrc = archiveModalIcon.getAttribute('src') || '';
      const basePath = currentSrc.includes('../') ? '../assets/images/' : './assets/images/';
      
      if (isArchivedView) {
        archiveModalIcon.setAttribute('src', `${basePath}icon-restore.svg`);
      } else {
        archiveModalIcon.setAttribute('src', `${basePath}icon-archive.svg`);
      }
    }
    
    // Update desktop archive button icon
    if (archiveNoteBtn) {
      const buttonIcon = archiveNoteBtn.querySelector('img');
      if (buttonIcon) {
        const currentSrc = buttonIcon.getAttribute('src') || '';
        const basePath = currentSrc.includes('../') ? '../assets/images/' : './assets/images/';
        
        if (isArchivedView) {
          buttonIcon.setAttribute('src', `${basePath}icon-restore.svg`);
        } else {
          buttonIcon.setAttribute('src', `${basePath}icon-archive.svg`);
        }
      }
    }
    
    // Update mobile archive button icon
    if (archiveNoteBtnMobile) {
      const buttonIcon = archiveNoteBtnMobile.querySelector('img');
      if (buttonIcon) {
        const currentSrc = buttonIcon.getAttribute('src') || '';
        const basePath = currentSrc.includes('../') ? '../assets/images/' : './assets/images/';
        
        if (isArchivedView) {
          buttonIcon.setAttribute('src', `${basePath}icon-restore.svg`);
        } else {
          buttonIcon.setAttribute('src', `${basePath}icon-archive.svg`);
        }
      }
    }
  }
  
  function handleDeleteNote() {
    const user = getCurrentUser();
    if (!user || !window.currentNoteId) return;
    
    const userNotes = getUserNotes(user.email);
    const noteIndex = userNotes.findIndex(n => n.id === window.currentNoteId);
    
    if (noteIndex !== -1) {
      // Set deleted to true instead of removing the note
      userNotes[noteIndex] = {
        ...userNotes[noteIndex],
        deleted: true,
        lastEdited: new Date().toISOString()
      };
      
      const saveResult = saveUserNotes(user.email, userNotes);
      
      if (saveResult.success) {
        showSuccessToast('Note deleted successfully');
        
        // Hide editor and refresh notes list
        if (window.hideEditor) window.hideEditor();
        if (window.renderNotes) window.renderNotes();
        if (window.updateSidebarTags) window.updateSidebarTags();
        
        // Hide action buttons
        const actionsSidebarContent = getDocument('actionsSidebarContent', 'id');
        if (actionsSidebarContent) {
          actionsSidebarContent.style.display = 'none';
        }
      } else {
        showErrorToast(saveResult.error || 'Failed to delete note. Please try again.');
      }
    }
    
    hideDeleteModal();
  }
  
  // Archive button click handler
  if (archiveNoteBtn) {
    archiveNoteBtn.addEventListener('click', showArchiveModal);
  }
  
  // Export updateArchiveButton function
  window.updateArchiveButton = updateArchiveButton;
  
  // Initialize archive button text on page load
  updateArchiveButton();
  
  // Delete button click handler
  if (deleteNoteBtn) {
    deleteNoteBtn.addEventListener('click', showDeleteModal);
  }
  
  // Archive modal handlers
  if (archiveModalCancel) {
    archiveModalCancel.addEventListener('click', hideArchiveModal);
  }
  
  if (archiveModalConfirm) {
    archiveModalConfirm.addEventListener('click', handleArchiveNote);
  }
  
  // Delete modal handlers
  if (deleteModalCancel) {
    deleteModalCancel.addEventListener('click', hideDeleteModal);
  }
  
  if (deleteModalConfirm) {
    deleteModalConfirm.addEventListener('click', handleDeleteNote);
  }
  
  // Close modals when clicking overlay
  if (archiveModalOverlay) {
    archiveModalOverlay.addEventListener('click', (e) => {
      if (e.target === archiveModalOverlay) {
        hideArchiveModal();
      }
    });
  }
  
  if (deleteModalOverlay) {
    deleteModalOverlay.addEventListener('click', (e) => {
      if (e.target === deleteModalOverlay) {
        hideDeleteModal();
      }
    });
  }
  
  // Close modals with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideArchiveModal();
      hideDeleteModal();
    }
  });
}

function setupTabletNavigation() {
  // Mobile/Tablet Go Back Button (in page header control)
  const goBackBtnMobile = getDocument('goBackBtnMobile', 'id');
  
  if (goBackBtnMobile) {
    goBackBtnMobile.addEventListener('click', () => {
      // Switch back to list view first
      if (window.switchToListView) {
        window.switchToListView();
      }
      
      // Hide editor
      if (window.hideEditor) {
        window.hideEditor();
      }
      
      // Clear current note selection
      if (window.setCurrentNoteId) {
        window.setCurrentNoteId(null);
      }
      window.currentNoteId = null;
      
      // Re-render notes to update active state
      if (window.renderNotes) {
        window.renderNotes();
      }
    });
  }
  
  // Mobile/Tablet Cancel Button (in page header control)
  const cancelNoteBtnMobile = getDocument('cancelNoteBtnMobile', 'id');
  
  if (cancelNoteBtnMobile) {
    cancelNoteBtnMobile.addEventListener('click', () => {
      if (window.hideEditor) {
        window.hideEditor();
      }
    });
  }
  
  // Mobile/Tablet Save Button (in page header control)
  const saveNoteBtnMobile = getDocument('saveNoteBtnMobile', 'id');
  
  if (saveNoteBtnMobile) {
    saveNoteBtnMobile.addEventListener('click', () => {
      const saveNoteBtn = getDocument('saveNoteBtn', 'id');
      if (saveNoteBtn) {
        saveNoteBtn.click();
      }
    });
  }
  
  // Mobile/Tablet Delete Button (in page header control)
  const deleteNoteBtnMobile = getDocument('deleteNoteBtnMobile', 'id');
  
  if (deleteNoteBtnMobile) {
    deleteNoteBtnMobile.addEventListener('click', () => {
      const deleteNoteBtn = getDocument('deleteNoteBtn', 'id');
      if (deleteNoteBtn) {
        deleteNoteBtn.click();
      }
    });
  }
  
  // Mobile/Tablet Archive Button (in page header control)
  const archiveNoteBtnMobile = getDocument('archiveNoteBtnMobile', 'id');
  
  if (archiveNoteBtnMobile) {
    archiveNoteBtnMobile.addEventListener('click', () => {
      const archiveNoteBtn = getDocument('archiveNoteBtn', 'id');
      if (archiveNoteBtn) {
        archiveNoteBtn.click();
      }
    });
  }
  
  // Handle window resize to update view state
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      const isTablet = width >= 769 && width <= 1024;
      const isMobile = width <= 768;
      const contentWrapper = document.querySelector('.notes-content-wrapper');
      
      if (contentWrapper) {
        if (isTablet) {
          // If no note is selected, ensure we're in list view
          if (!window.currentNoteId) {
            contentWrapper.classList.remove('tablet-view-editor');
            contentWrapper.classList.add('tablet-view-list');
          }
          // Remove mobile classes
          contentWrapper.classList.remove('mobile-view-list', 'mobile-view-editor');
        } else if (isMobile) {
          // If no note is selected, ensure we're in list view
          if (!window.currentNoteId) {
            contentWrapper.classList.remove('mobile-view-editor');
            contentWrapper.classList.add('mobile-view-list');
          }
          // Remove tablet classes
          contentWrapper.classList.remove('tablet-view-list', 'tablet-view-editor');
        } else {
          // Desktop - remove all view classes
          contentWrapper.classList.remove('tablet-view-list', 'tablet-view-editor', 'mobile-view-list', 'mobile-view-editor');
        }
        
        // Hide mobile page header control if no note selected
        if (!window.currentNoteId) {
          const mobilePageHeaderControl = getDocument('mobilePageHeaderControl', 'id');
          if (mobilePageHeaderControl) {
            mobilePageHeaderControl.style.display = 'none';
          }
        }
      }
    }, 250);
  });
}

function setupMobileNavigation() {
  const mobileSearchBtn = getDocument('mobileSearchBtn', 'id');
  const mobileTagsBtn = getDocument('mobileTagsBtn', 'id');
  const mobileSettingsBtn = getDocument('mobileSettingsBtn', 'id');
  const mobileSearchInput = getDocument('mobileSearchInput', 'id');
  const mobileTagsPanel = getDocument('mobileTagsPanel', 'id');
  const mobileTagsList = getDocument('mobileTagsList', 'id');
  const searchInput = getDocument('searchInput', 'id');
  
  // Mirror the mobile search box into the desktop one, which drives the search logic
  if (mobileSearchInput && searchInput) {
    mobileSearchInput.addEventListener('input', () => {
      searchInput.value = mobileSearchInput.value;
      searchInput.dispatchEvent(new Event('input'));
    });
    
    mobileSearchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        mobileSearchInput.value = '';
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    });
  }
  
  function focusMobileSearch() {
    if (window.switchToListView) window.switchToListView();
    if (mobileSearchInput) {
      mobileSearchInput.focus();
      mobileSearchInput.scrollIntoView({ block: 'center' });
    }
  }
  
  // Build tag chips from the (hidden on mobile) sidebar tag buttons so both share one filter state
  function renderMobileTags() {
    const sidebarTagsList = getDocument('sidebarTagsList', 'id');
    if (!mobileTagsList || !sidebarTagsList) return;
    
    mobileTagsList.innerHTML = '';
    const sidebarTags = sidebarTagsList.querySelectorAll('.sidebar-tag-item');
    
    if (!sidebarTags.length) {
      const emptyText = document.createElement('p');
      emptyText.className = 'mobile-tags-empty';
      emptyText.textContent = 'No tags yet. Add tags to a note to filter by them.';
      mobileTagsList.appendChild(emptyText);
      return;
    }
    
    sidebarTags.forEach(sidebarTag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mobile-tag-chip';
      chip.classList.toggle('active', sidebarTag.classList.contains('active'));
      chip.textContent = sidebarTag.querySelector('.nav-text').textContent;
      chip.addEventListener('click', () => {
        sidebarTag.click();
        renderMobileTags();
      });
      mobileTagsList.appendChild(chip);
    });
  }
  
  function toggleMobileTags(forceOpen) {
    if (!mobileTagsPanel) return;
    const open = forceOpen === undefined ? mobileTagsPanel.hidden : forceOpen;
    mobileTagsPanel.hidden = !open;
    if (mobileTagsBtn) mobileTagsBtn.classList.toggle('active', open);
    if (open) {
      if (window.switchToListView) window.switchToListView();
      renderMobileTags();
    }
  }
  
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', focusMobileSearch);
  }
  
  if (mobileTagsBtn) {
    mobileTagsBtn.addEventListener('click', () => toggleMobileTags());
  }
  
  if (mobileSettingsBtn) {
    mobileSettingsBtn.addEventListener('click', () => {
      navigateTo('settings');
    });
  }
  
  window.focusMobileSearch = focusMobileSearch;
  window.toggleMobileTags = toggleMobileTags;
}

// Deep links from other pages, e.g. notes.html#archived
function applyHashRoute() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return;
  
  if (hash === 'archived' && window.setActiveView) {
    window.setActiveView('archived');
  } else if (hash === 'search') {
    const isDesktop = window.innerWidth > 1024;
    const input = getDocument(isDesktop ? 'searchInput' : 'mobileSearchInput', 'id');
    if (input) input.focus();
  } else if (hash === 'tags' && window.toggleMobileTags) {
    window.toggleMobileTags(true);
  }
  
  history.replaceState(null, '', window.location.pathname);
}

function setupSearch() {
  const searchInput = getDocument('searchInput', 'id');
  const pageTitle = getDocument('pageTitle', 'id');
  const mobilePageTitle = document.querySelector('.mobile-page-title');
  
  if (!searchInput) return;
  
  let searchTimeout;
  
  function performSearch(query) {
    const trimmedQuery = query.trim();
    
    // Update page title to show search results
    if (trimmedQuery) {
      if (pageTitle) {
        pageTitle.textContent = `Showing results for: ${trimmedQuery}`;
      }
      if (mobilePageTitle) {
        mobilePageTitle.textContent = `Showing results for: ${trimmedQuery}`;
      }
    } else {
      // Reset to current view title
      const currentView = window.currentView || 'all';
      const allActive = currentView === 'all';
      if (pageTitle) {
        pageTitle.textContent = allActive ? 'All Notes' : 'Archived Notes';
      }
      if (mobilePageTitle) {
        mobilePageTitle.textContent = allActive ? 'All Notes' : 'Archived Notes';
      }
    }
    
    // Clear any selected tag when searching
    if (trimmedQuery && window.setSelectedTag) {
      window.setSelectedTag(null);
      // Clear active tag in sidebar
      const sidebarTagsList = getDocument('sidebarTagsList', 'id');
      if (sidebarTagsList) {
        const activeTag = sidebarTagsList.querySelector('.sidebar-tag-item.active');
        if (activeTag) {
          activeTag.classList.remove('active');
        }
      }
    }
    
    // Render notes with search query
    if (window.renderNotes) {
      const selectedTag = trimmedQuery ? null : (window.getSelectedTag ? window.getSelectedTag() : null);
      window.renderNotes(selectedTag, trimmedQuery || null);
    }
    
    // Update empty state message for search
    if (trimmedQuery) {
      const emptyStateText = getDocument('emptyStateText', 'id');
      if (emptyStateText) {
        emptyStateText.textContent = `No notes found matching "${trimmedQuery}". Try a different search term.`;
      }
    } else {
      // Reset empty state message
      if (window.updateEmptyStateMessage) {
        window.updateEmptyStateMessage(window.currentView || 'all');
      }
    }
  }
  
  searchInput.addEventListener('input', (event) => {
    const query = event.target.value;
    
    // Debounce search to avoid too many renders
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });
  
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      searchInput.value = '';
      searchInput.blur();
      clearTimeout(searchTimeout);
      performSearch('');
      
      // Reset header for tag if one was selected
      if (window.updateHeaderForTag) {
        const selectedTag = window.getSelectedTag ? window.getSelectedTag() : null;
        window.updateHeaderForTag(selectedTag);
      }
    }
  });
  
  // Clear search when clicking outside or when view changes
  const handleViewChange = () => {
    if (searchInput.value.trim()) {
      searchInput.value = '';
      performSearch('');
    }
  };
  
  // Store the handler so we can call it from other places if needed
  window.clearSearch = handleViewChange;
}

function setupLogout() {
  const logoutBtn = getDocument('logoutBtn', 'id');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', () => {
    logout();
    navigateTo('index');
  });
}

function initializeNotesPage() {
  if (!requireAuth()) {
    return;
  }
  
  initializeTheme();
  setupThemeToggle();
  
  // Initialize font theme from localStorage
  let savedFont = 'sans-serif';
  try {
    savedFont = localStorage.getItem('fontTheme') || 'sans-serif';
  } catch (error) {
    console.error('Failed to load font preference:', error);
  }
  
  // Apply font on page load
  document.documentElement.setAttribute('data-font', savedFont);
  const getFontFamily = (fontType) => {
    switch (fontType) {
      case 'serif':
        return 'var(--font-serif)';
      case 'monospace':
        return 'var(--font-mono)';
      default:
        return 'var(--font-sans)';
    }
  };
  document.body.style.fontFamily = getFontFamily(savedFont);
  
  setupNavigation();
  setupCreateNote();
  setupMobileNavigation();
  setupSearch();
  setupLogout();
  
  const { renderNotes, loadNoteIntoEditor } = setupNotesList();
  const { updateSidebarTags } = setupTagsManagement();
  setupTagInputStyling();
  setupNoteActions();
  setupTabletNavigation();
  
  window.renderNotes = renderNotes;
  window.updateSidebarTags = updateSidebarTags;
  window.loadNoteIntoEditor = loadNoteIntoEditor;
  window.currentView = currentView;
  window.quillEditor = quillEditor;
  
  renderNotes();
  updateSidebarTags();
  
  updateEmptyStateMessage(currentView);
  
  // Initialize tablet/mobile view state
  const width = window.innerWidth;
  const isTablet = width >= 769 && width <= 1024;
  const isMobile = width <= 768;
  const contentWrapper = document.querySelector('.notes-content-wrapper');
  
  if (isTablet && contentWrapper) {
    contentWrapper.classList.add('tablet-view-list');
  }
  
  if (isMobile && contentWrapper) {
    contentWrapper.classList.add('mobile-view-list');
  }
  
  applyHashRoute();
  window.addEventListener('hashchange', applyHashRoute);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotesPage);
} else {
  initializeNotesPage();
}

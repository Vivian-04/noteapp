import { getCurrentUser } from '../modules/auth.js';
import {
  getUserNotes,
  saveUserNotes,
  getSampleNotesLoaded,
  setSampleNotesLoaded,
  loadSampleNotes,
  generateNoteId
} from '../modules/storage.js';
import { getDocument } from '../../getDocument.js';

let sampleNotesLoaded = false;
let currentNoteId = null;
let allUserNotes = [];
let sampleNotes = [];

/**
 * Converts plain text content with newlines and tabs to HTML format for Quill editor
 * Handles:
 * - Single \n = line break (<br>)
 * - Double \n\n = two line breaks (paragraph spacing)
 * - Multiple \n = multiple line breaks
 * - Tabs = preserved as spacing
 * - Numbered lists (lines starting with "1. ", "2. ", etc. - must be preceded by at least one \n)
 * - Bullet lists (lines starting with "- " after a newline)
 */
function formatNoteContentForQuill(content) {
  if (!content) return '';
  
  // Escape HTML to prevent XSS and preserve original text
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Process the content line by line
  const lines = content.split('\n');
  let html = '';
  let currentParagraph = '';
  let inParagraph = false;
  let consecutiveEmptyLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    const prevLine = i > 0 ? lines[i - 1] : null;
    
    // Check if this is a numbered list item (must be preceded by at least one \n)
    // This means the previous line must exist (i > 0) and can be empty or have content
    const isNumberedList = i > 0 && /^\d+\.\s/.test(line.trim());
    
    // Check if this is a bullet list item (starts with "- ")
    const isBulletList = /^-\s/.test(line.trim());
    
    // Handle empty lines (newlines)
    if (!line.trim()) {
      // Close current paragraph if we have one
      if (inParagraph && currentParagraph) {
        html += `<p>${currentParagraph}</p>`;
        currentParagraph = '';
        inParagraph = false;
      }
      
      // Count consecutive empty lines
      consecutiveEmptyLines++;
      
      // If next line is not empty or we're at the end, add the line breaks
      if (nextLine && nextLine.trim()) {
        // Add line breaks based on consecutive empty lines count
        for (let j = 0; j < consecutiveEmptyLines; j++) {
          html += '<p><br></p>';
        }
        consecutiveEmptyLines = 0;
      } else if (!nextLine) {
        // Last line is empty, add line breaks
        for (let j = 0; j < consecutiveEmptyLines; j++) {
          html += '<p><br></p>';
        }
        consecutiveEmptyLines = 0;
      }
      continue;
    }
    
    // Reset consecutive empty lines counter when we hit a non-empty line
    if (consecutiveEmptyLines > 0) {
      // Add line breaks for the consecutive empty lines we encountered
      for (let j = 0; j < consecutiveEmptyLines; j++) {
        html += '<p><br></p>';
      }
      consecutiveEmptyLines = 0;
    }
    
    // If we encounter a numbered list item, close current paragraph and start new one
    if (isNumberedList) {
      if (inParagraph && currentParagraph) {
        html += `<p>${currentParagraph}</p>`;
        currentParagraph = '';
      }
      // Replace tabs with non-breaking spaces and escape HTML
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      html += `<p>${escapeHtml(processedLine)}</p>`;
      inParagraph = false;
      continue;
    }
    
    // If we encounter a bullet list item, close current paragraph and start new one
    if (isBulletList) {
      if (inParagraph && currentParagraph) {
        html += `<p>${currentParagraph}</p>`;
        currentParagraph = '';
      }
      // Replace tabs with non-breaking spaces and escape HTML
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      html += `<p>${escapeHtml(processedLine)}</p>`;
      inParagraph = false;
      continue;
    }
    
    // Regular line - add to current paragraph with line break
    if (!inParagraph) {
      inParagraph = true;
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      currentParagraph = escapeHtml(processedLine);
    } else {
      // Replace tabs with non-breaking spaces
      const processedLine = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      currentParagraph += '<br>' + escapeHtml(processedLine);
    }
  }
  
  // Close any remaining paragraph
  if (inParagraph && currentParagraph) {
    html += `<p>${currentParagraph}</p>`;
  }
  
  return html || '<p><br></p>';
}

function setupNotesList() {
  const notesList = getDocument('notesList', 'id');
  const emptyState = getDocument('emptyState', 'id');
  const loadSampleNotesBtn = getDocument('loadSampleNotesBtn', 'id');
  
  function renderNotes(selectedTag = null, searchQuery = null) {
    if (!notesList || !emptyState) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    const loaded = window.sampleNotesLoaded || sampleNotesLoaded;
    const userNotes = getUserNotes(user.email);
    const allNotes = [...userNotes, ...(loaded ? (window.sampleNotes || sampleNotes) : [])];
    allUserNotes = allNotes;
    window.allUserNotes = allUserNotes;
    
    const currentView = window.currentView || 'all';
    let filteredNotes = allNotes.filter(note => {
      // Exclude deleted notes from all views (they'll be shown in settings page)
      if (note.deleted === true) {
        return false;
      }
      if (currentView === 'archived') {
        return note.isArchived === true;
      }
      return note.isArchived !== true;
    });
    
    // Filter by search query if provided
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filteredNotes = filteredNotes.filter(note => {
        // Search in title (case-insensitive, partial match)
        const titleMatch = note.title && 
          note.title.toString().toLowerCase().includes(query);
        
        // Search in content (case-insensitive, partial match)
        const contentMatch = note.content && 
          note.content.toString().toLowerCase().includes(query);
        
        // Search in tags (case-insensitive, partial match, handles whitespace)
        // This is the special part - search checks if query matches any tag
        let tagsMatch = false;
        if (note.tags && Array.isArray(note.tags) && note.tags.length > 0) {
          tagsMatch = note.tags.some(tag => {
            if (!tag) return false;
            // Convert tag to string, trim whitespace, and normalize to lowercase
            const normalizedTag = String(tag).trim().toLowerCase();
            // Check if the query is contained in the tag (partial match)
            // This allows searching for "dev" to find tags like "Dev", "Development", etc.
            return normalizedTag.includes(query);
          });
        }
        
        // Return true if query matches in title, content, OR tags
        return titleMatch || contentMatch || tagsMatch;
      });
    }
    
    // Filter by selected tag if one is selected (and no search query)
    if (selectedTag && !searchQuery) {
      filteredNotes = filteredNotes.filter(note => {
        if (!note.tags || !Array.isArray(note.tags)) return false;
        return note.tags.some(tag => tag.trim().toLowerCase() === selectedTag.toLowerCase());
      });
    }
    
    if (filteredNotes.length === 0) {
      notesList.style.display = 'none';
      emptyState.style.display = 'flex';
      // If filtering by tag, show tag-specific message
      if (selectedTag && window.updateEmptyStateForTag) {
        window.updateEmptyStateForTag(selectedTag);
      } else if (window.updateEmptyStateMessage) {
        window.updateEmptyStateMessage(currentView);
      }
    } else {
      notesList.style.display = 'flex';
      // Don't hide emptyState if we're creating a new note (to show "Untitled Note")
      if (!window.isCreatingNewNote) {
        emptyState.style.display = 'none';
      }
      
      notesList.innerHTML = '';
      
      // Set notes list width to match button width (only on desktop/tablet, not mobile)
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        const createNoteBtn = getDocument('createNoteBtn', 'id');
        if (createNoteBtn) {
          const buttonWidth = createNoteBtn.offsetWidth;
          notesList.style.width = `${buttonWidth}px`;
          notesList.style.maxWidth = `${buttonWidth}px`;
        }
      } else {
        // On mobile, ensure full width
        notesList.style.width = '100%';
        notesList.style.maxWidth = '100%';
      }
      
      filteredNotes.forEach((note, index) => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        // Check both window.currentNoteId and local currentNoteId
        const noteId = window.currentNoteId || currentNoteId;
        // Only mark as active if IDs match exactly
        if (noteId && noteId === note.id) {
          noteItem.classList.add('active');
        } else {
          noteItem.classList.remove('active');
        }
        
        const noteTitle = document.createElement('h3');
        noteTitle.className = 'note-item-title';
        noteTitle.textContent = note.title || 'Untitled Note';
        
        const noteTagsContainer = document.createElement('div');
        noteTagsContainer.className = 'note-item-tags';
        
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'note-tag';
            tagElement.textContent = tag;
            noteTagsContainer.appendChild(tagElement);
          });
        }
        
        const noteDate = document.createElement('span');
        noteDate.className = 'note-item-date';
        if (note.lastEdited) {
          const date = new Date(note.lastEdited);
          const day = date.getDate();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = monthNames[date.getMonth()];
          const year = date.getFullYear();
          noteDate.textContent = `${day} ${month}, ${year}`;
        } else {
          noteDate.textContent = 'Not yet saved';
        }
        
        noteItem.appendChild(noteTitle);
        if (noteTagsContainer.children.length > 0) {
          noteItem.appendChild(noteTagsContainer);
        }
        noteItem.appendChild(noteDate);
        
        noteItem.addEventListener('click', () => {
          if (window.loadNoteIntoEditor) {
            window.loadNoteIntoEditor(note);
          }
        });
        
        notesList.appendChild(noteItem);
        
        // Add separator after the note item (outside the container)
        if (index < filteredNotes.length - 1) {
          const separator = document.createElement('div');
          separator.className = 'note-item-separator';
          const isMobile = window.innerWidth <= 768;
          if (!isMobile) {
            const createNoteBtn = getDocument('createNoteBtn', 'id');
            if (createNoteBtn) {
              const buttonWidth = createNoteBtn.offsetWidth;
              separator.style.width = `${buttonWidth}px`;
              separator.style.maxWidth = `${buttonWidth}px`;
            }
          } else {
            // On mobile, separator takes full width
            separator.style.width = '100%';
            separator.style.maxWidth = '100%';
          }
          notesList.appendChild(separator);
        }
      });
    }
  }
  
  function loadNoteIntoEditor(note) {
    currentNoteId = note.id;
    window.currentNoteId = note.id;
    const noteTitle = getDocument('noteTitle', 'id');
    const noteTags = getDocument('noteTags', 'id');
    const lastEdited = getDocument('lastEdited', 'id');
    const noteEditor = getDocument('noteEditor', 'id');
    const rightPanelEmpty = getDocument('rightPanelEmpty', 'id');
    const emptyStateText = getDocument('emptyStateText', 'id');
    
    // Switch to editor view on tablet
    if (window.switchToEditorView) {
      window.switchToEditorView();
    }
    
    // Show editor first
    if (noteEditor) noteEditor.style.display = 'flex';
    if (rightPanelEmpty) rightPanelEmpty.style.display = 'none';
    
    // Initialize Quill if not already initialized (use the one from notes.js if available)
    const editorContainer = getDocument('noteContentEditor', 'id');
    if (editorContainer && typeof Quill !== 'undefined') {
      // Check if Quill is already initialized by looking for .ql-container
      if (!editorContainer.querySelector('.ql-container')) {
        if (!window.quillEditor) {
          // Create new Quill instance only if it doesn't exist
          window.quillEditor = new Quill('#noteContentEditor', {
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
        }
        // If window.quillEditor exists but container doesn't have Quill, don't reinitialize
      }
    }
    
    if (noteTitle) {
      noteTitle.value = note.title || '';
    }
    if (noteTags) noteTags.value = note.tags ? note.tags.join(', ') : '';
    if (lastEdited && note.lastEdited) {
      const date = new Date(note.lastEdited);
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      lastEdited.textContent = `${day} ${month}, ${year}`;
    }
    
    // Set content in Quill editor
    // Ensure Quill is initialized before setting content
    if (!window.quillEditor && typeof Quill !== 'undefined') {
      const editorContainer = getDocument('noteContentEditor', 'id');
      if (editorContainer && !editorContainer.querySelector('.ql-container')) {
        window.quillEditor = new Quill('#noteContentEditor', {
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
      }
    }
    
    // Set content after ensuring Quill is ready
    if (window.quillEditor) {
      if (note.content && note.content.trim()) {
        // Convert plain text with newlines/tabs to HTML for Quill
        const formattedContent = formatNoteContentForQuill(note.content);
        // Use a small delay to ensure Quill is fully initialized
        setTimeout(() => {
          if (window.quillEditor) {
            window.quillEditor.root.innerHTML = formattedContent;
          }
        }, 0);
      } else {
        // Clear editor if no content
        window.quillEditor.setText('');
      }
    } else {
      console.warn('Quill editor not initialized. Content may not display correctly.');
    }
    
    if (emptyStateText) {
      emptyStateText.textContent = note.title || 'Untitled Note';
      const createNoteBtn = getDocument('createNoteBtn', 'id');
      if (createNoteBtn) {
        const buttonWidth = createNoteBtn.offsetWidth;
        emptyStateText.style.width = `${buttonWidth}px`;
      }
    }
    
    // Show action buttons when a note is loaded
    const actionsSidebarContent = getDocument('actionsSidebarContent', 'id');
    if (actionsSidebarContent) {
      actionsSidebarContent.style.display = 'flex';
    }
    
    // Update archive button text based on current view
    if (window.updateArchiveButton) {
      window.updateArchiveButton();
    }
    
    if (window.updateUntitledNote) window.updateUntitledNote();
    // Re-render notes to update active state - use window version to ensure it gets the updated currentNoteId
    if (window.renderNotes) {
      window.renderNotes();
    } else {
      renderNotes();
    }
  }
  
  async function handleLoadSampleNotes() {
    const loaded = window.sampleNotesLoaded || sampleNotesLoaded;
    if (loaded) {
      sampleNotes = [];
      window.sampleNotes = [];
      sampleNotesLoaded = false;
      window.sampleNotesLoaded = false;
      setSampleNotesLoaded(false);
      if (loadSampleNotesBtn) {
        loadSampleNotesBtn.querySelector('span').textContent = 'Load Sample Notes';
      }
    } else {
      const notes = await loadSampleNotes();
      sampleNotes = notes;
      window.sampleNotes = notes;
      sampleNotesLoaded = true;
      window.sampleNotesLoaded = true;
      setSampleNotesLoaded(true);
      if (loadSampleNotesBtn) {
        loadSampleNotesBtn.querySelector('span').textContent = 'Clear loaded notes';
      }
    }
    renderNotes();
    if (window.updateSidebarTags) {
      window.updateSidebarTags();
    }
  }
  
  if (loadSampleNotesBtn) {
    loadSampleNotesBtn.addEventListener('click', handleLoadSampleNotes);
    
    if (getSampleNotesLoaded()) {
      sampleNotesLoaded = true;
      window.sampleNotesLoaded = true;
        loadSampleNotes().then(notes => {
        sampleNotes = notes;
        window.sampleNotes = notes;
        loadSampleNotesBtn.querySelector('span').textContent = 'Clear loaded notes';
        renderNotes();
        if (window.updateSidebarTags) {
          window.updateSidebarTags();
        }
      });
    }
  }
  
  function switchToEditorView() {
    const width = window.innerWidth;
    const isTablet = width >= 769 && width <= 1024;
    const isMobile = width <= 768;
    
    if (isTablet || isMobile) {
      const contentWrapper = document.querySelector('.notes-content-wrapper');
      if (contentWrapper) {
        if (isTablet) {
          contentWrapper.classList.remove('tablet-view-list');
          contentWrapper.classList.add('tablet-view-editor');
        }
        if (isMobile) {
          contentWrapper.classList.remove('mobile-view-list');
          contentWrapper.classList.add('mobile-view-editor');
        }
      }
      
      // Show mobile page header control (go back, delete, archive, cancel, save)
      const mobilePageHeaderControl = getDocument('mobilePageHeaderControl', 'id');
      if (mobilePageHeaderControl) {
        mobilePageHeaderControl.style.display = 'flex';
        
        // Show delete/archive buttons only if editing an existing note
        const deleteNoteBtnMobile = getDocument('deleteNoteBtnMobile', 'id');
        const archiveNoteBtnMobile = getDocument('archiveNoteBtnMobile', 'id');
        if (deleteNoteBtnMobile && archiveNoteBtnMobile) {
          if (currentNoteId) {
            deleteNoteBtnMobile.style.display = 'flex';
            archiveNoteBtnMobile.style.display = 'flex';
          } else {
            deleteNoteBtnMobile.style.display = 'none';
            archiveNoteBtnMobile.style.display = 'none';
          }
        }
      }
    }
  }
  
  function switchToListView() {
    const width = window.innerWidth;
    const isTablet = width >= 769 && width <= 1024;
    const isMobile = width <= 768;
    
    if (isTablet || isMobile) {
      const contentWrapper = document.querySelector('.notes-content-wrapper');
      if (contentWrapper) {
        if (isTablet) {
          contentWrapper.classList.remove('tablet-view-editor');
          contentWrapper.classList.add('tablet-view-list');
        }
        if (isMobile) {
          contentWrapper.classList.remove('mobile-view-editor');
          contentWrapper.classList.add('mobile-view-list');
        }
      }
      
      // Hide mobile page header control
      const mobilePageHeaderControl = getDocument('mobilePageHeaderControl', 'id');
      if (mobilePageHeaderControl) {
        mobilePageHeaderControl.style.display = 'none';
      }
    }
  }
  
  window.loadNoteIntoEditor = loadNoteIntoEditor;
  window.currentNoteId = currentNoteId;
  window.sampleNotesLoaded = sampleNotesLoaded;
  window.setCurrentNoteId = (id) => { currentNoteId = id; window.currentNoteId = id; };
  window.setSampleNotesLoaded = (loaded) => { sampleNotesLoaded = loaded; window.sampleNotesLoaded = loaded; };
  window.switchToEditorView = switchToEditorView;
  window.switchToListView = switchToListView;
  return { renderNotes, loadNoteIntoEditor };
}

function setupTagsManagement() {
  const sidebarTagsList = getDocument('sidebarTagsList', 'id');
  let selectedTag = null;
  
  function updateHeaderForTag(tag) {
    const pageTitle = getDocument('pageTitle', 'id');
    const mobilePageTitle = document.querySelector('.mobile-page-title');
    
    if (tag) {
      if (pageTitle) {
        pageTitle.textContent = `Notes Tagged: ${tag}`;
      }
      if (mobilePageTitle) {
        mobilePageTitle.textContent = `Notes Tagged: ${tag}`;
      }
    } else {
      // Reset to current view
      const currentView = window.currentView || 'all';
      const allActive = currentView === 'all';
      if (pageTitle) {
        pageTitle.textContent = allActive ? 'All Notes' : 'Archived Notes';
      }
      if (mobilePageTitle) {
        mobilePageTitle.textContent = allActive ? 'All Notes' : 'Archived Notes';
      }
    }
  }
  
  function updateEmptyStateForTag(tag) {
    const emptyStateText = getDocument('emptyStateText', 'id');
    if (!emptyStateText) return;
    
    if (tag) {
      emptyStateText.textContent = `All notes with the "${tag}" tag are shown here.`;
    } else {
      // Reset to default message based on current view
      const currentView = window.currentView || 'all';
      if (currentView === 'archived') {
        emptyStateText.innerHTML = 'No notes have been archived yet. Move notes here for safekeeping, or <a href="#" id="createNoteLink" class="empty-state-link">create a new note</a>.';
        const createNoteLink = getDocument('createNoteLink', 'id');
        if (createNoteLink) {
          createNoteLink.addEventListener('click', (e) => {
            e.preventDefault();
            const createNoteBtn = getDocument('createNoteBtn', 'id');
            if (createNoteBtn) createNoteBtn.click();
          });
        }
      } else {
        emptyStateText.textContent = 'You don\'t have any notes yet. Start a new note to capture your thoughts and ideas.';
      }
    }
  }
  
  function updateSidebarTags() {
    if (!sidebarTagsList) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    const loaded = window.sampleNotesLoaded || sampleNotesLoaded;
    const userNotes = getUserNotes(user.email);
    const allNotes = [...userNotes, ...(loaded ? (window.sampleNotes || sampleNotes) : [])];
    
    const allTags = new Set();
    allNotes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
    });
    
    sidebarTagsList.innerHTML = '';
    
    const sortedTags = Array.from(allTags).sort();
    sortedTags.forEach(tag => {
      const tagItem = document.createElement('button');
      tagItem.type = 'button';
      tagItem.className = 'sidebar-tag-item';
      tagItem.setAttribute('aria-label', `Filter by ${tag} tag`);
      
      const tagIcon = document.createElement('img');
      tagIcon.src = '../assets/images/icon-tag.svg';
      tagIcon.alt = '';
      tagIcon.className = 'nav-icon';
      tagIcon.setAttribute('aria-hidden', 'true');
      
      const tagText = document.createElement('span');
      tagText.className = 'nav-text';
      tagText.textContent = tag;
      
      const tagChevron = document.createElement('img');
      tagChevron.src = '../assets/images/icon-chevron-right.svg';
      tagChevron.alt = '';
      tagChevron.className = 'nav-chevron';
      tagChevron.setAttribute('aria-hidden', 'true');
      
      tagItem.appendChild(tagIcon);
      tagItem.appendChild(tagText);
      tagItem.appendChild(tagChevron);
      
      // Set active state if this is the selected tag
      if (selectedTag && selectedTag.toLowerCase() === tag.toLowerCase()) {
        tagItem.classList.add('active');
      }
      
      tagItem.addEventListener('click', () => {
        const currentSelected = sidebarTagsList.querySelector('.sidebar-tag-item.active');
        if (currentSelected && currentSelected === tagItem) {
          // Deselect if clicking the same tag
          selectedTag = null;
          tagItem.classList.remove('active');
        } else {
          // Select new tag
          if (currentSelected) currentSelected.classList.remove('active');
          selectedTag = tag;
          tagItem.classList.add('active');
        }
        
        // Clear search when selecting a tag
        const searchInput = getDocument('searchInput', 'id');
        if (searchInput) {
          searchInput.value = '';
        }
        
        // Update header and empty state message
        updateHeaderForTag(selectedTag);
        updateEmptyStateForTag(selectedTag);
        
        // Re-render notes with the selected tag filter (no search query)
        if (window.renderNotes) {
          window.renderNotes(selectedTag, null);
        }
      });
      
      sidebarTagsList.appendChild(tagItem);
    });
  }
  
  // Export functions and selectedTag for external use
  window.updateHeaderForTag = updateHeaderForTag;
  window.updateEmptyStateForTag = updateEmptyStateForTag;
  window.getSelectedTag = () => selectedTag;
  window.setSelectedTag = (tag) => { selectedTag = tag; };
  
  return { updateSidebarTags };
}

function setupTagInputStyling() {
  const noteTags = getDocument('noteTags', 'id');
  if (!noteTags) return;
  
  function checkExistingTags() {
    const user = getCurrentUser();
    if (!user) return;
    
    const loaded = window.sampleNotesLoaded || sampleNotesLoaded;
    const userNotes = getUserNotes(user.email);
    const allNotes = [...userNotes, ...(loaded ? (window.sampleNotes || sampleNotes) : [])];
    
    const allTags = new Set();
    allNotes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim().toLowerCase());
          }
        });
      }
    });
    
    const inputValue = noteTags.value;
    const tags = inputValue.split(',').map(t => t.trim()).filter(t => t);
    
    noteTags.classList.remove('has-existing-tags');
    
    if (tags.length > 0) {
      const hasExisting = tags.some(tag => allTags.has(tag.toLowerCase()));
      if (hasExisting) {
        noteTags.classList.add('has-existing-tags');
      }
    }
  }
  
  noteTags.addEventListener('input', checkExistingTags);
  noteTags.addEventListener('blur', checkExistingTags);
}

export { setupNotesList, setupTagsManagement, setupTagInputStyling };


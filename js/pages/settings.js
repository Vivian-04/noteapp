import { getCurrentUser, logout, changePassword } from '../modules/auth.js';
import { getCurrentTheme, setTheme, initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { getDocument } from '../../getDocument.js';
import { setupTagsManagement } from './notes-list.js';
import { createPasswordInput } from '../modules/passwordInput.js';
import { showSuccessToast, showErrorToast } from '../modules/toast.js';

let currentView = 'menu'; // 'menu', 'colorTheme', 'fontTheme', 'changePassword'
let selectedTheme = null;
let selectedFont = null;

// Shared function to get font family CSS variable
function getFontFamily(fontType) {
  switch (fontType) {
    case 'serif':
      return 'var(--font-serif)';
    case 'monospace':
      return 'var(--font-mono)';
    default:
      return 'var(--font-sans)';
  }
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = './auth/login.html';
    return false;
  }
  return true;
}

function setupSettingsNavigation() {
  const colorThemeBtn = getDocument('colorThemeBtn', 'id');
  const fontThemeBtn = getDocument('fontThemeBtn', 'id');
  const changePasswordBtn = getDocument('changePasswordBtn', 'id');
  const settingsLogoutBtn = getDocument('settingsLogoutBtn', 'id');
  const backToSettingsBtn = getDocument('backToSettingsBtn', 'id');
  const backToSettingsFromFontBtn = getDocument('backToSettingsFromFontBtn', 'id');
  
  if (colorThemeBtn) {
    colorThemeBtn.addEventListener('click', () => {
      showColorThemeView();
    });
  }
  
  if (fontThemeBtn) {
    fontThemeBtn.addEventListener('click', () => {
      showFontThemeView();
    });
  }
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      showChangePasswordView();
    });
  }
  
  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', () => {
      logout();
      window.location.href = './index.html';
    });
  }
  
  if (backToSettingsBtn) {
    backToSettingsBtn.addEventListener('click', () => {
      showMenuView();
    });
  }
  
  if (backToSettingsFromFontBtn) {
    backToSettingsFromFontBtn.addEventListener('click', () => {
      showMenuView();
    });
  }
}

function isDesktop() {
  return window.innerWidth >= 1025;
}

function isTablet() {
  return window.innerWidth >= 769 && window.innerWidth <= 1024;
}

function isMobile() {
  return window.innerWidth <= 768;
}

function updateActiveMenuItem(activeId) {
  const menuItems = document.querySelectorAll('.settings-menu-item');
  menuItems.forEach(item => {
    item.classList.remove('active');
  });
  const activeBtn = getDocument(activeId, 'id');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

function showMenuView() {
  currentView = 'menu';
  const settingsMenu = getDocument('settingsMenu', 'id');
  const settingsMenuPanel = document.querySelector('.settings-menu-panel');
  const settingsContentPanel = document.querySelector('.settings-content-panel');
  const colorThemeView = getDocument('colorThemeView', 'id');
  const fontThemeView = getDocument('fontThemeView', 'id');
  const changePasswordView = getDocument('changePasswordView', 'id');
  const backToSettingsBtn = getDocument('backToSettingsBtn', 'id');
  const backToSettingsFromFontBtn = getDocument('backToSettingsFromFontBtn', 'id');
  const backToSettingsFromPasswordBtn = getDocument('backToSettingsFromPasswordBtn', 'id');
  
  if (isDesktop()) {
    // Desktop: Show menu, hide all content views
    if (settingsMenu) settingsMenu.style.display = 'flex';
    if (settingsMenuPanel) settingsMenuPanel.style.display = 'block';
    if (settingsContentPanel) settingsContentPanel.style.display = 'block';
    if (colorThemeView) {
      colorThemeView.style.display = 'none';
      colorThemeView.classList.remove('active');
    }
    if (fontThemeView) {
      fontThemeView.style.display = 'none';
      fontThemeView.classList.remove('active');
    }
    if (changePasswordView) {
      changePasswordView.style.display = 'none';
      changePasswordView.classList.remove('active');
    }
    updateActiveMenuItem(null);
  } else {
    // Mobile/Tablet: Show menu panel, hide content panel completely
    if (settingsMenu) settingsMenu.style.display = 'flex';
    if (settingsMenuPanel) settingsMenuPanel.style.display = 'block';
    if (settingsContentPanel) settingsContentPanel.style.display = 'none';
    if (colorThemeView) colorThemeView.style.display = 'none';
    if (fontThemeView) fontThemeView.style.display = 'none';
    if (changePasswordView) changePasswordView.style.display = 'none';
    if (backToSettingsBtn) backToSettingsBtn.style.display = 'none';
    if (backToSettingsFromFontBtn) backToSettingsFromFontBtn.style.display = 'none';
    if (backToSettingsFromPasswordBtn) backToSettingsFromPasswordBtn.style.display = 'none';
  }
}

function showColorThemeView() {
  currentView = 'colorTheme';
  const settingsMenu = getDocument('settingsMenu', 'id');
  const settingsMenuPanel = document.querySelector('.settings-menu-panel');
  const settingsContentPanel = document.querySelector('.settings-content-panel');
  const colorThemeView = getDocument('colorThemeView', 'id');
  const fontThemeView = getDocument('fontThemeView', 'id');
  const changePasswordView = getDocument('changePasswordView', 'id');
  const backToSettingsBtn = getDocument('backToSettingsBtn', 'id');
  
  if (isDesktop()) {
    // Desktop: Keep menu visible, show color theme view
    if (settingsMenu) settingsMenu.style.display = 'flex';
    if (settingsMenuPanel) settingsMenuPanel.style.display = 'block';
    if (settingsContentPanel) settingsContentPanel.style.display = 'block';
    if (colorThemeView) {
      colorThemeView.style.display = 'block';
      colorThemeView.classList.add('active');
    }
    if (fontThemeView) {
      fontThemeView.style.display = 'none';
      fontThemeView.classList.remove('active');
    }
    if (changePasswordView) {
      changePasswordView.style.display = 'none';
      changePasswordView.classList.remove('active');
    }
    updateActiveMenuItem('colorThemeBtn');
  } else {
    // Mobile/Tablet: Hide menu panel completely, show content panel
    if (settingsMenuPanel) {
      settingsMenuPanel.style.display = 'none';
      settingsMenuPanel.classList.add('hide-menu');
    }
    if (settingsContentPanel) {
      settingsContentPanel.style.display = 'block';
      settingsContentPanel.classList.add('show-content');
    }
    if (colorThemeView) colorThemeView.style.display = 'block';
    if (fontThemeView) fontThemeView.style.display = 'none';
    if (changePasswordView) changePasswordView.style.display = 'none';
    if (backToSettingsBtn) backToSettingsBtn.style.display = 'flex';
  }
  
  // Set selected theme based on current theme
  const currentTheme = getCurrentTheme();
  selectedTheme = currentTheme;
  updateThemeSelection(currentTheme);
}

function showFontThemeView() {
  currentView = 'fontTheme';
  const settingsMenu = getDocument('settingsMenu', 'id');
  const settingsMenuPanel = document.querySelector('.settings-menu-panel');
  const settingsContentPanel = document.querySelector('.settings-content-panel');
  const colorThemeView = getDocument('colorThemeView', 'id');
  const fontThemeView = getDocument('fontThemeView', 'id');
  const changePasswordView = getDocument('changePasswordView', 'id');
  const backToSettingsFromFontBtn = getDocument('backToSettingsFromFontBtn', 'id');
  
  if (isDesktop()) {
    // Desktop: Keep menu visible, show font theme view
    if (settingsMenu) settingsMenu.style.display = 'flex';
    if (settingsMenuPanel) settingsMenuPanel.style.display = 'block';
    if (settingsContentPanel) settingsContentPanel.style.display = 'block';
    if (colorThemeView) {
      colorThemeView.style.display = 'none';
      colorThemeView.classList.remove('active');
    }
    if (changePasswordView) {
      changePasswordView.style.display = 'none';
      changePasswordView.classList.remove('active');
    }
    if (fontThemeView) {
      fontThemeView.style.display = 'block';
      fontThemeView.classList.add('active');
    }
    updateActiveMenuItem('fontThemeBtn');
  } else {
    // Mobile/Tablet: Hide menu panel completely, show content panel
    if (settingsMenuPanel) {
      settingsMenuPanel.style.display = 'none';
      settingsMenuPanel.classList.add('hide-menu');
    }
    if (settingsContentPanel) {
      settingsContentPanel.style.display = 'block';
      settingsContentPanel.classList.add('show-content');
    }
    if (colorThemeView) colorThemeView.style.display = 'none';
    if (changePasswordView) changePasswordView.style.display = 'none';
    if (fontThemeView) fontThemeView.style.display = 'block';
    if (backToSettingsFromFontBtn) backToSettingsFromFontBtn.style.display = 'flex';
    updateActiveMenuItem('fontThemeBtn');
  }
  
  // Set selected font based on current font
  const currentFont = document.documentElement.getAttribute('data-font') || 'sans-serif';
  selectedFont = currentFont;
  updateFontSelection(currentFont);
}

function showChangePasswordView() {
  currentView = 'changePassword';
  const settingsMenu = getDocument('settingsMenu', 'id');
  const settingsMenuPanel = document.querySelector('.settings-menu-panel');
  const settingsContentPanel = document.querySelector('.settings-content-panel');
  const colorThemeView = getDocument('colorThemeView', 'id');
  const fontThemeView = getDocument('fontThemeView', 'id');
  const changePasswordView = getDocument('changePasswordView', 'id');
  const backToSettingsFromPasswordBtn = getDocument('backToSettingsFromPasswordBtn', 'id');
  
  if (isDesktop()) {
    // Desktop: Keep menu visible, show change password view
    if (settingsMenu) settingsMenu.style.display = 'flex';
    if (settingsMenuPanel) settingsMenuPanel.style.display = 'block';
    if (settingsContentPanel) settingsContentPanel.style.display = 'block';
    if (colorThemeView) {
      colorThemeView.style.display = 'none';
      colorThemeView.classList.remove('active');
    }
    if (fontThemeView) {
      fontThemeView.style.display = 'none';
      fontThemeView.classList.remove('active');
    }
    if (changePasswordView) {
      changePasswordView.style.display = 'block';
      changePasswordView.classList.add('active');
    }
    updateActiveMenuItem('changePasswordBtn');
  } else {
    // Mobile/Tablet: Hide menu panel completely, show content panel
    if (settingsMenuPanel) {
      settingsMenuPanel.style.display = 'none';
      settingsMenuPanel.classList.add('hide-menu');
    }
    if (settingsContentPanel) {
      settingsContentPanel.style.display = 'block';
      settingsContentPanel.classList.add('show-content');
    }
    if (colorThemeView) colorThemeView.style.display = 'none';
    if (fontThemeView) fontThemeView.style.display = 'none';
    if (changePasswordView) changePasswordView.style.display = 'block';
    if (backToSettingsFromPasswordBtn) backToSettingsFromPasswordBtn.style.display = 'flex';
    updateActiveMenuItem('changePasswordBtn');
  }
  
  // Initialize password inputs if not already created
  initializePasswordInputs();
}

function setupThemeOptions() {
  const lightThemeOption = getDocument('lightThemeOption', 'id');
  const darkThemeOption = getDocument('darkThemeOption', 'id');
  const systemThemeOption = getDocument('systemThemeOption', 'id');
  const applyThemeChangesBtn = getDocument('applyThemeChangesBtn', 'id');
  
  if (lightThemeOption) {
    lightThemeOption.addEventListener('click', () => {
      selectedTheme = 'light';
      updateThemeSelection('light');
    });
  }
  
  if (darkThemeOption) {
    darkThemeOption.addEventListener('click', () => {
      selectedTheme = 'dark';
      updateThemeSelection('dark');
    });
  }
  
  if (systemThemeOption) {
    systemThemeOption.addEventListener('click', () => {
      selectedTheme = 'system';
      updateThemeSelection('system');
    });
  }
  
  if (applyThemeChangesBtn) {
    applyThemeChangesBtn.addEventListener('click', () => {
      if (selectedTheme) {
        setTheme(selectedTheme);
        // On desktop, keep the view visible. On mobile/tablet, go back to menu
        if (!isDesktop()) {
          setTimeout(() => {
            showMenuView();
          }, 300);
        }
      }
    });
  }
}

function updateThemeSelection(theme) {
  const lightThemeOption = getDocument('lightThemeOption', 'id');
  const darkThemeOption = getDocument('darkThemeOption', 'id');
  const systemThemeOption = getDocument('systemThemeOption', 'id');
  
  // Remove active class from all options
  [lightThemeOption, darkThemeOption, systemThemeOption].forEach(option => {
    if (option) {
      option.classList.remove('theme-option-active');
      const radioOuter = option.querySelector('.theme-radio-outer');
      const radioInner = option.querySelector('.theme-radio-inner');
      if (radioOuter) {
        radioOuter.style.backgroundColor = 'var(--neutral-200)';
        radioOuter.style.borderRadius = theme === 'system' ? '12px' : '999px';
      }
      if (radioInner) {
        radioInner.style.backgroundColor = '#FFFFFF';
        radioInner.style.borderRadius = theme === 'system' ? '12px' : '999px';
        radioInner.style.width = theme === 'system' ? '12px' : '12px';
        radioInner.style.height = theme === 'system' ? '12px' : '12px';
        radioInner.style.marginLeft = theme === 'system' ? '2px' : '2px';
        radioInner.style.marginTop = theme === 'system' ? '2px' : '2px';
      }
    }
  });
  
  // Add active class to selected option
  let selectedOption = null;
  if (theme === 'light' && lightThemeOption) {
    selectedOption = lightThemeOption;
  } else if (theme === 'dark' && darkThemeOption) {
    selectedOption = darkThemeOption;
  } else if (theme === 'system' && systemThemeOption) {
    selectedOption = systemThemeOption;
  }
  
  if (selectedOption) {
    selectedOption.classList.add('theme-option-active');
    const radioOuter = selectedOption.querySelector('.theme-radio-outer');
    const radioInner = selectedOption.querySelector('.theme-radio-inner');
    if (radioOuter) {
      radioOuter.style.backgroundColor = 'var(--accent-color)';
      radioOuter.style.borderRadius = '12px';
    }
    if (radioInner) {
      radioInner.style.backgroundColor = '#FFFFFF';
      radioInner.style.borderRadius = '16px';
      radioInner.style.width = '8px';
      radioInner.style.height = '8px';
      radioInner.style.marginLeft = '4px';
      radioInner.style.marginTop = '4px';
    }
  }
}

function setupFontOptions() {
  const sansSerifOption = getDocument('sansSerifOption', 'id');
  const serifOption = getDocument('serifOption', 'id');
  const monospaceOption = getDocument('monospaceOption', 'id');
  const applyFontChangesBtn = getDocument('applyFontChangesBtn', 'id');

  if (sansSerifOption) {
    sansSerifOption.addEventListener('click', () => {
      selectedFont = 'sans-serif';
      updateFontSelection('sans-serif');
    });
  }

  if (serifOption) {
    serifOption.addEventListener('click', () => {
      selectedFont = 'serif';
      updateFontSelection('serif');
    });
  }

  if (monospaceOption) {
    monospaceOption.addEventListener('click', () => {
      selectedFont = 'monospace';
      updateFontSelection('monospace');
    });
  }

  if (applyFontChangesBtn) {
    applyFontChangesBtn.addEventListener('click', () => {
      if (selectedFont) {
        // Apply font to document
        document.documentElement.setAttribute('data-font', selectedFont);
        
        // Save to localStorage
        localStorage.setItem('fontTheme', selectedFont);
        
        // Apply font to body and all elements
        document.body.style.fontFamily = getFontFamily(selectedFont);
        
        // Force reflow to ensure font is applied
        document.body.offsetHeight;
        
        // Show success toast
        const fontName = selectedFont === 'sans-serif' ? 'Sans-serif' : selectedFont === 'serif' ? 'Serif' : 'Monospace';
        showSuccessToast(`Font changed to ${fontName}`);
        
        // On desktop, keep the view visible. On mobile/tablet, go back to menu
        if (!isDesktop()) {
          setTimeout(() => {
            showMenuView();
          }, 300);
        }
      }
    });
  }
}

function updateFontSelection(font) {
  const sansSerifOption = getDocument('sansSerifOption', 'id');
  const serifOption = getDocument('serifOption', 'id');
  const monospaceOption = getDocument('monospaceOption', 'id');

  // Remove active class from all options
  [sansSerifOption, serifOption, monospaceOption].forEach(option => {
    if (option) {
      option.classList.remove('font-option-active');
      const radioOuter = option.querySelector('.font-radio-outer');
      const radioInner = option.querySelector('.font-radio-inner');
      if (radioOuter) {
        radioOuter.style.backgroundColor = 'var(--neutral-200)';
        radioOuter.style.borderRadius = '12px';
      }
      if (radioInner) {
        radioInner.style.backgroundColor = '#FFFFFF';
        radioInner.style.borderRadius = '12px';
        radioInner.style.width = '12px';
        radioInner.style.height = '12px';
        radioInner.style.marginLeft = '2px';
        radioInner.style.marginTop = '2px';
      }
    }
  });

  // Add active class to selected option
  let selectedOption = null;
  if (font === 'sans-serif' && sansSerifOption) {
    selectedOption = sansSerifOption;
  } else if (font === 'serif' && serifOption) {
    selectedOption = serifOption;
  } else if (font === 'monospace' && monospaceOption) {
    selectedOption = monospaceOption;
  }

  if (selectedOption) {
    selectedOption.classList.add('font-option-active');
    const radioOuter = selectedOption.querySelector('.font-radio-outer');
    const radioInner = selectedOption.querySelector('.font-radio-inner');
    if (radioOuter) {
      radioOuter.style.backgroundColor = 'var(--accent-color)';
      radioOuter.style.borderRadius = '12px';
    }
    if (radioInner) {
      radioInner.style.backgroundColor = '#FFFFFF';
      radioInner.style.borderRadius = '16px';
      radioInner.style.width = '8px';
      radioInner.style.height = '8px';
      radioInner.style.marginLeft = '4px';
      radioInner.style.marginTop = '4px';
    }
  }
}

let oldPasswordInput = null;
let newPasswordInput = null;
let confirmPasswordInput = null;

function initializePasswordInputs() {
  const oldPasswordGroup = getDocument('oldPasswordGroup', 'id');
  const newPasswordGroup = getDocument('newPasswordGroup', 'id');
  const confirmPasswordGroup = getDocument('confirmPasswordGroup', 'id');

  if (oldPasswordGroup && !oldPasswordInput) {
    oldPasswordInput = createPasswordInput({
      id: 'oldPassword',
      name: 'oldPassword',
      label: 'Old Password',
      placeholder: '',
      required: true,
      minLength: 8,
      showHint: false
    });
    oldPasswordGroup.appendChild(oldPasswordInput.element);
  }

  if (newPasswordGroup && !newPasswordInput) {
    newPasswordInput = createPasswordInput({
      id: 'newPassword',
      name: 'newPassword',
      label: 'New Password',
      placeholder: '',
      required: true,
      minLength: 8,
      showHint: true
    });
    newPasswordGroup.appendChild(newPasswordInput.element);
  }

  if (confirmPasswordGroup && !confirmPasswordInput) {
    confirmPasswordInput = createPasswordInput({
      id: 'confirmPassword',
      name: 'confirmPassword',
      label: 'Confirm New Password',
      placeholder: '',
      required: true,
      minLength: 8,
      showHint: false
    });
    confirmPasswordGroup.appendChild(confirmPasswordInput.element);
    
    // Add validation for password match
    const confirmInput = confirmPasswordInput.input;
    const newInput = newPasswordInput ? newPasswordInput.input : null;
    
    if (confirmInput && newInput) {
      confirmInput.addEventListener('blur', () => {
        if (confirmInput.value && confirmInput.value !== newInput.value) {
          const errorElement = confirmPasswordInput.element.querySelector('.form-error');
          if (errorElement) {
            errorElement.textContent = 'Passwords do not match';
            confirmInput.setAttribute('aria-invalid', 'true');
          }
        }
      });
      
      confirmInput.addEventListener('input', () => {
        if (confirmInput.getAttribute('aria-invalid') === 'true' && confirmInput.value === newInput.value) {
          const errorElement = confirmPasswordInput.element.querySelector('.form-error');
          if (errorElement) {
            errorElement.textContent = '';
            confirmInput.setAttribute('aria-invalid', 'false');
          }
        }
      });
    }
  }
}

function setupChangePasswordForm() {
  const changePasswordForm = getDocument('changePasswordForm', 'id');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (!oldPasswordInput || !newPasswordInput || !confirmPasswordInput) {
        return;
      }
      
      const oldPasswordValid = oldPasswordInput.validate();
      const newPasswordValid = newPasswordInput.validate();
      const confirmPasswordValid = confirmPasswordInput.validate();
      
      if (newPasswordInput.getValue() !== confirmPasswordInput.getValue()) {
        const errorElement = confirmPasswordInput.element.querySelector('.form-error');
        if (errorElement) {
          errorElement.textContent = 'Passwords do not match';
          confirmPasswordInput.input.setAttribute('aria-invalid', 'true');
        }
        return;
      }
      
      if (oldPasswordValid && newPasswordValid && confirmPasswordValid) {
        const user = getCurrentUser();
        const result = user
          ? changePassword(user.email, oldPasswordInput.getValue(), newPasswordInput.getValue())
          : { success: false, error: 'Please log in again.' };
        
        if (!result.success) {
          showErrorToast(result.error);
          return;
        }
        
        oldPasswordInput.clear();
        newPasswordInput.clear();
        confirmPasswordInput.clear();
        showSuccessToast('Password updated successfully');
        // On mobile/tablet, go back to menu after success
        if (!isDesktop()) {
          setTimeout(() => {
            showMenuView();
          }, 300);
        }
      }
    });
  }
}

function setupLogout() {
  const logoutBtn = getDocument('logoutBtn', 'id');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      window.location.href = './index.html';
    });
  }
}

function setupSidebarNavigation() {
  const allNotesBtn = getDocument('allNotesBtn', 'id');
  const archivedNotesBtn = getDocument('archivedNotesBtn', 'id');
  
  if (allNotesBtn) {
    allNotesBtn.addEventListener('click', () => {
      window.location.href = './notes/notes.html';
    });
  }
  
  if (archivedNotesBtn) {
    archivedNotesBtn.addEventListener('click', () => {
      window.location.href = './notes/notes.html#archived';
    });
  }
}

function initializeSettingsPage() {
  if (!requireAuth()) {
    return;
  }
  
  initializeTheme();
  setupThemeToggle();
  setupSettingsNavigation();
  setupThemeOptions();
  setupFontOptions();
  setupChangePasswordForm();
  setupLogout();
  setupSidebarNavigation();
  
  // Setup tags management for sidebar
  const { updateSidebarTags } = setupTagsManagement();
  if (updateSidebarTags) {
    updateSidebarTags();
  }
  
  // Set initial selected theme
  const currentTheme = getCurrentTheme();
  selectedTheme = currentTheme;
  
  // Set initial selected font from localStorage or default
  let savedFont = 'sans-serif';
  try {
    savedFont = localStorage.getItem('fontTheme') || 'sans-serif';
  } catch (error) {
    console.error('Failed to load font preference:', error);
  }
  
  // Apply font on page load
  document.documentElement.setAttribute('data-font', savedFont);
  document.body.style.fontFamily = getFontFamily(savedFont);
  
  const currentFont = savedFont;
  selectedFont = currentFont;
  
  // On desktop, show Color Theme by default
  // On mobile/tablet, show menu by default
  if (isDesktop()) {
    showColorThemeView();
  } else {
    showMenuView();
  }
  
  // Handle window resize to reset view state
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Reset view based on new screen size
      if (isDesktop()) {
        // If we were on a content view, keep it visible
        if (currentView !== 'menu') {
          if (currentView === 'colorTheme') {
            showColorThemeView();
          } else if (currentView === 'fontTheme') {
            showFontThemeView();
          } else if (currentView === 'changePassword') {
            showChangePasswordView();
          }
        } else {
          showColorThemeView();
        }
      } else {
        // On mobile/tablet, always start with menu
        showMenuView();
      }
    }, 250);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSettingsPage);
} else {
  initializeSettingsPage();
}

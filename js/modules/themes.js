import { getDocument } from '../../getDocument.js';

const THEME_STORAGE_KEY = 'notes-theme';
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

function getCurrentTheme() {
  const htmlElement = document.documentElement;
  return htmlElement.getAttribute('data-theme') || THEMES.SYSTEM;
}

function setTheme(theme) {
  const htmlElement = document.documentElement;
  htmlElement.setAttribute('data-theme', theme);
  
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Failed to save theme preference:', error);
  }
  
  updateLogo(theme);
  updateThemeIcon(theme);
  updateIconColors(theme);
}

function updateLogo(theme) {
  const logos = document.querySelectorAll('.nav-logo img, .footer-logo img, .login-logo img, .auth-logo img, .mobile-logo-img');
  
  const isDark = theme === THEMES.DARK || 
                 (theme === THEMES.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  logos.forEach(logo => {
    if (!logo) return;
    
    const currentSrc = logo.getAttribute('src') || '';
    let newSrc;
    
    if (isDark) {
      if (currentSrc.includes('logo.svg') && !currentSrc.includes('logo-dark')) {
        newSrc = currentSrc.replace('logo.svg', 'logo-dark.svg');
      } else if (!currentSrc.includes('logo-dark')) {
        const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
        newSrc = basePath + 'logo-dark.svg';
      } else {
        newSrc = currentSrc;
      }
    } else {
      if (currentSrc.includes('logo-dark.svg')) {
        newSrc = currentSrc.replace('logo-dark.svg', 'logo.svg');
      } else if (!currentSrc.includes('logo.svg')) {
        const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
        newSrc = basePath + 'logo.svg';
      } else {
        newSrc = currentSrc;
      }
    }
    
    if (newSrc !== currentSrc) {
      logo.setAttribute('src', newSrc);
    }
  });
}

function updateThemeIcon(theme) {
  const themeToggle = getDocument('themeToggle', 'id');
  const mobileThemeToggle = getDocument('mobileThemeToggle', 'id');
  
  const isDark = theme === THEMES.DARK || 
                 (theme === THEMES.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const nextTheme = isDark ? THEMES.LIGHT : THEMES.DARK;
  
  // Update desktop theme toggle
  if (themeToggle) {
    const themeIcon = themeToggle.querySelector('.theme-icon, img');
    if (themeIcon) {
      const currentSrc = themeIcon.getAttribute('src') || '';
      const basePath = currentSrc.includes('../') 
        ? '../assets/images/'
        : './assets/images/';
      
      const iconPath = isDark 
        ? `${basePath}icon-sun.svg`
        : `${basePath}icon-moon.svg`;
      
      themeIcon.setAttribute('src', iconPath);
      themeIcon.setAttribute('alt', `Switch to ${nextTheme} mode`);
      themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    }
  }
  
  // Update mobile theme toggle
  if (mobileThemeToggle) {
    const mobileThemeIcon = mobileThemeToggle.querySelector('.mobile-theme-icon, img');
    if (mobileThemeIcon) {
      const currentSrc = mobileThemeIcon.getAttribute('src') || '';
      const basePath = currentSrc.includes('../') 
        ? '../assets/images/'
        : './assets/images/';
      
      const iconPath = isDark 
        ? `${basePath}icon-sun.svg`
        : `${basePath}icon-moon.svg`;
      
      mobileThemeIcon.setAttribute('src', iconPath);
      mobileThemeIcon.setAttribute('alt', `Switch to ${nextTheme} mode`);
      mobileThemeToggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    }
  }
}

function toggleTheme() {
  const currentTheme = getCurrentTheme();
  let nextTheme;
  
  if (currentTheme === THEMES.LIGHT) {
    nextTheme = THEMES.DARK;
  } else if (currentTheme === THEMES.DARK) {
    nextTheme = THEMES.LIGHT;
  } else {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    nextTheme = systemPrefersDark ? THEMES.LIGHT : THEMES.DARK;
  }
  
  setTheme(nextTheme);
}

function initializeTheme() {
  let savedTheme;
  
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to load theme preference:', error);
  }
  
  const initialTheme = savedTheme || THEMES.SYSTEM;
  setTheme(initialTheme);
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (getCurrentTheme() === THEMES.SYSTEM) {
      updateLogo(THEMES.SYSTEM);
      updateThemeIcon(THEMES.SYSTEM);
      updateIconColors(THEMES.SYSTEM);
    }
  });
  
  const observer = new MutationObserver(() => {
    updateIconColors(getCurrentTheme());
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function updateIconColors(theme) {
  const isDark = theme === THEMES.DARK || 
                 (theme === THEMES.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const allImages = document.querySelectorAll('img');
  
  allImages.forEach(img => {
    if (!img) return;
    
    const src = img.getAttribute('src') || '';
    const isLogo = src.includes('logo.svg') || src.includes('logo-dark.svg');
    
    if (!isLogo) {
      if (isDark) {
        img.classList.add('icon-theme-white');
      } else {
        img.classList.remove('icon-theme-white');
      }
    }
  });
}

function setupThemeToggle() {
  const themeToggle = getDocument('themeToggle', 'id');
  const mobileThemeToggle = getDocument('mobileThemeToggle', 'id');
  
  function attachToggleListeners(button) {
    if (!button) return;
    
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleTheme();
    });
    
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        toggleTheme();
      }
    });
  }
  
  attachToggleListeners(themeToggle);
  attachToggleListeners(mobileThemeToggle);
  
  if (!themeToggle && !mobileThemeToggle) {
    console.warn('Theme toggle button not found');
  }
}

export {
  initializeTheme,
  setupThemeToggle,
  toggleTheme,
  setTheme,
  getCurrentTheme,
  THEMES
};


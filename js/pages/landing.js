import { initializeTheme, setupThemeToggle } from '../modules/themes.js';

function initializeLandingPage() {
  initializeTheme();
  setupThemeToggle();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLandingPage);
} else {
  initializeLandingPage();
}


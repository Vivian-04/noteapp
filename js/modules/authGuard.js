import { isAuthenticated } from './auth.js';
import { navigateTo, isAuthPage, getCurrentPath } from './router.js';

function checkAuth() {
  const currentPath = getCurrentPath();
  const authenticated = isAuthenticated();
  
  if (authenticated && isAuthPage(currentPath)) {
    navigateTo('notes');
    return false;
  }
  
  if (!authenticated && !isAuthPage(currentPath) && currentPath !== 'index' && currentPath !== '') {
    navigateTo('auth/login');
    return false;
  }
  
  return true;
}

function requireAuth() {
  if (!isAuthenticated()) {
    navigateTo('auth/login');
    return false;
  }
  return true;
}

function requireGuest() {
  if (isAuthenticated()) {
    navigateTo('notes');
    return false;
  }
  return true;
}

export {
  checkAuth,
  requireAuth,
  requireGuest
};


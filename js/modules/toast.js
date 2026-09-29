/**
 * Toast Notification System
 * Provides a clean, accessible way to show notifications to users
 */

const TOAST_CONTAINER_ID = 'toast-container';

// Toast types
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Default toast duration (milliseconds)
const DEFAULT_DURATION = 4000;

/**
 * Initialize toast container if it doesn't exist
 */
function initializeToastContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Create and show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 4000)
 * @returns {HTMLElement} The toast element
 */
function showToast(message, type = TOAST_TYPES.INFO, duration = DEFAULT_DURATION) {
  const container = initializeToastContainer();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  
  // Create toast content
  const toastContent = document.createElement('div');
  toastContent.className = 'toast-content';
  
  // Create icon
  const icon = document.createElement('img');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  
  // Set icon based on type
  const getIconPath = () => {
    const path = window.location.pathname;
    const basePath = path.includes('/auth/') || path.includes('/notes/') || path.includes('/todos/') ? '../assets/images/' : './assets/images/';
    
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return `${basePath}icon-checkmark.svg`;
      case TOAST_TYPES.ERROR:
        return `${basePath}icon-cross.svg`;
      case TOAST_TYPES.WARNING:
        return `${basePath}icon-info.svg`;
      default:
        return `${basePath}icon-info.svg`;
    }
  };
  
  icon.src = getIconPath();
  icon.alt = '';
  
  // Create message text
  const messageText = document.createElement('span');
  messageText.className = 'toast-message';
  messageText.textContent = message;
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.setAttribute('aria-label', 'Close notification');
  closeButton.setAttribute('type', 'button');
  
  const closeIcon = document.createElement('img');
  const closeIconPath = window.location.pathname.includes('/auth/') || window.location.pathname.includes('/notes/') || window.location.pathname.includes('/todos/') 
    ? '../assets/images/icon-cross.svg' 
    : './assets/images/icon-cross.svg';
  closeIcon.src = closeIconPath;
  closeIcon.alt = '';
  closeIcon.setAttribute('aria-hidden', 'true');
  
  closeButton.appendChild(closeIcon);
  
  // Assemble toast
  toastContent.appendChild(icon);
  toastContent.appendChild(messageText);
  toast.appendChild(toastContent);
  toast.appendChild(closeButton);
  
  // Add to container
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });
  
  // Close handlers
  const closeToast = () => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };
  
  closeButton.addEventListener('click', closeToast);
  
  // Auto-close after duration
  if (duration > 0) {
    const timeoutId = setTimeout(closeToast, duration);
    
    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timeoutId);
    });
    
    toast.addEventListener('mouseleave', () => {
      setTimeout(closeToast, duration);
    });
  }
  
  return toast;
}

/**
 * Show success toast
 */
function showSuccessToast(message, duration = DEFAULT_DURATION) {
  return showToast(message, TOAST_TYPES.SUCCESS, duration);
}

/**
 * Show error toast
 */
function showErrorToast(message, duration = DEFAULT_DURATION) {
  return showToast(message, TOAST_TYPES.ERROR, duration);
}

/**
 * Show warning toast
 */
function showWarningToast(message, duration = DEFAULT_DURATION) {
  return showToast(message, TOAST_TYPES.WARNING, duration);
}

/**
 * Show info toast
 */
function showInfoToast(message, duration = DEFAULT_DURATION) {
  return showToast(message, TOAST_TYPES.INFO, duration);
}

export {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  TOAST_TYPES
};

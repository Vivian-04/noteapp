import { initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { requireGuest } from '../modules/authGuard.js';
import { getDocument } from '../../getDocument.js';

function setupPasswordToggle() {
  const passwordInput = getDocument('password', 'id');
  const passwordToggle = getDocument('passwordToggle', 'id');
  
  if (!passwordInput || !passwordToggle) return;
  
  const toggleIcon = passwordToggle.querySelector('.toggle-icon');
  const showIconPath = '../assets/images/icon-show-password.svg';
  const hideIconPath = '../assets/images/icon-hide-password.svg';
  
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    passwordToggle.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    
    if (toggleIcon) {
      toggleIcon.setAttribute('src', isPassword ? hideIconPath : showIconPath);
    }
  });
  
  passwordToggle.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      passwordToggle.click();
    }
  });
}

function setupFormValidation() {
  const loginForm = getDocument('loginForm', 'id');
  if (!loginForm) return;
  
  const emailInput = getDocument('email', 'id');
  const passwordInput = getDocument('password', 'id');
  const emailError = getDocument('email-error', 'id');
  const passwordError = getDocument('password-error', 'id');
  
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.setAttribute('aria-live', 'polite');
    }
  }
  
  function clearError(element) {
    if (element) {
      element.textContent = '';
    }
  }
  
  function validateField(input, errorElement, validator, errorMessage) {
    const value = input.value.trim();
    
    if (input.hasAttribute('required') && !value) {
      showError(errorElement, errorMessage);
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    if (value && !validator(value)) {
      showError(errorElement, errorMessage);
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    
    clearError(errorElement);
    input.setAttribute('aria-invalid', 'false');
    return true;
  }
  
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      validateField(
        emailInput,
        emailError,
        validateEmail,
        'Please enter a valid email address'
      );
    });
    
    emailInput.addEventListener('input', () => {
      if (emailInput.getAttribute('aria-invalid') === 'true') {
        validateField(
          emailInput,
          emailError,
          validateEmail,
          'Please enter a valid email address'
        );
      }
    });
  }
  
  if (passwordInput) {
    passwordInput.addEventListener('blur', () => {
      validateField(
        passwordInput,
        passwordError,
        (value) => value.length >= 6,
        'Password must be at least 6 characters'
      );
    });
    
    passwordInput.addEventListener('input', () => {
      if (passwordInput.getAttribute('aria-invalid') === 'true') {
        validateField(
          passwordInput,
          passwordError,
          (value) => value.length >= 6,
          'Password must be at least 6 characters'
        );
      }
    });
  }
  
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const isEmailValid = emailInput 
      ? validateField(
          emailInput,
          emailError,
          validateEmail,
          'Please enter a valid email address'
        )
      : false;
    
    const isPasswordValid = passwordInput
      ? validateField(
          passwordInput,
          passwordError,
          (value) => value.length >= 6,
          'Password must be at least 6 characters'
        )
      : false;
    
    if (isEmailValid && isPasswordValid) {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      const { login } = await import('../modules/auth.js');
      const { navigateTo } = await import('../modules/router.js');
      
      const result = login(email, password);
      
      if (result.success) {
        navigateTo('notes');
      } else {
        showError(passwordError, result.error);
        passwordInput.setAttribute('aria-invalid', 'true');
      }
    }
  });
}

function initializeLoginPage() {
  initializeTheme();
  setupThemeToggle();
  
  if (!requireGuest()) {
    return;
  }
  
  setupPasswordToggle();
  setupFormValidation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLoginPage);
} else {
  initializeLoginPage();
}


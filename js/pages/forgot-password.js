import { initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { requireGuest } from '../modules/authGuard.js';
import { getDocument } from '../../getDocument.js';

function setupFormValidation() {
  const forgotPasswordForm = getDocument('forgotPasswordForm', 'id');
  if (!forgotPasswordForm) return;
  
  const emailInput = getDocument('email', 'id');
  const emailError = getDocument('email-error', 'id');
  
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
  
  forgotPasswordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const isEmailValid = emailInput 
      ? validateField(
          emailInput,
          emailError,
          validateEmail,
          'Please enter a valid email address'
        )
      : false;
    
    if (isEmailValid) {
      const formData = {
        email: emailInput.value.trim()
      };
      
      console.log('Reset link requested for:', formData);
      // Navigate to reset password page
      window.location.href = './reset-password.html';
    }
  });
}

function initializeForgotPasswordPage() {
  initializeTheme();
  setupThemeToggle();
  
  if (!requireGuest()) {
    return;
  }
  
  setupFormValidation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForgotPasswordPage);
} else {
  initializeForgotPasswordPage();
}

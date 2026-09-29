import { initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { createPasswordInput } from '../modules/passwordInput.js';
import { signUp } from '../modules/auth.js';
import { navigateTo } from '../modules/router.js';
import { requireGuest } from '../modules/authGuard.js';
import { getDocument } from '../../getDocument.js';

let passwordComponent = null;

function setupPasswordInput() {
  const passwordContainer = getDocument('passwordContainer', 'id');
  if (!passwordContainer) {
    return;
  }
  
  try {
    passwordComponent = createPasswordInput({
      id: 'password',
      name: 'password',
      label: 'Password',
      placeholder: '',
      required: true,
      minLength: 8,
      showHint: true
    });
    
    if (passwordComponent && passwordComponent.element) {
      passwordContainer.appendChild(passwordComponent.element);
    }
  } catch (error) {
    console.error('Error creating password input:', error);
  }
}

function setupFormValidation() {
  const signupForm = getDocument('signupForm', 'id');
  if (!signupForm) return;
  
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
  
  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const isEmailValid = emailInput 
      ? validateField(
          emailInput,
          emailError,
          validateEmail,
          'Please enter a valid email address'
        )
      : false;
    
    const isPasswordValid = passwordComponent ? passwordComponent.validate() : false;
    
    if (isEmailValid && isPasswordValid) {
      const email = emailInput.value.trim();
      const password = passwordComponent.getValue();
      
      const result = signUp(email, password);
      
      if (result.success) {
        navigateTo('notes');
      } else {
        showError(emailError, result.error);
        emailInput.setAttribute('aria-invalid', 'true');
      }
    }
  });
}

function initializeSignupPage() {
  initializeTheme();
  setupThemeToggle();
  
  if (!requireGuest()) {
    return;
  }
  
  setupPasswordInput();
  setupFormValidation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSignupPage);
} else {
  initializeSignupPage();
}


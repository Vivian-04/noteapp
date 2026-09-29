import { initializeTheme, setupThemeToggle } from '../modules/themes.js';
import { createPasswordInput } from '../modules/passwordInput.js';
import { requireGuest } from '../modules/authGuard.js';
import { getDocument } from '../../getDocument.js';

let newPasswordComponent = null;
let confirmPasswordComponent = null;

function setupResetPasswordForm() {
  const resetPasswordForm = getDocument('resetPasswordForm', 'id');
  const newPasswordContainer = getDocument('newPasswordContainer', 'id');
  const confirmPasswordContainer = getDocument('confirmPasswordContainer', 'id');
  
  if (!resetPasswordForm || !newPasswordContainer || !confirmPasswordContainer) return;
  
  newPasswordComponent = createPasswordInput({
    id: 'newPassword',
    name: 'newPassword',
    label: 'New Password',
    placeholder: '',
    required: true,
    minLength: 8,
    showHint: true
  });
  
  confirmPasswordComponent = createPasswordInput({
    id: 'confirmPassword',
    name: 'confirmPassword',
    label: 'Confirm New Password',
    placeholder: '',
    required: true,
    minLength: 8,
    showHint: false
  });
  
  newPasswordContainer.appendChild(newPasswordComponent.element);
  confirmPasswordContainer.appendChild(confirmPasswordComponent.element);
  
  const confirmPasswordInput = confirmPasswordComponent.input;
  const confirmPasswordError = confirmPasswordComponent.element.querySelector('.form-error');
  
  function validatePasswordMatch() {
    const newPassword = newPasswordComponent.getValue();
    const confirmPassword = confirmPasswordComponent.getValue();
    
    if (confirmPassword && newPassword !== confirmPassword) {
      if (confirmPasswordError) {
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordInput.setAttribute('aria-invalid', 'true');
      }
      return false;
    } else {
      if (confirmPasswordError) {
        confirmPasswordError.textContent = '';
        confirmPasswordInput.setAttribute('aria-invalid', 'false');
      }
      return true;
    }
  }
  
  confirmPasswordInput.addEventListener('blur', validatePasswordMatch);
  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.getAttribute('aria-invalid') === 'true') {
      validatePasswordMatch();
    }
  });
  
  resetPasswordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const isNewPasswordValid = newPasswordComponent.validate();
    const isConfirmPasswordValid = confirmPasswordComponent.validate();
    const doPasswordsMatch = validatePasswordMatch();
    
    if (isNewPasswordValid && isConfirmPasswordValid && doPasswordsMatch) {
      const formData = {
        newPassword: newPasswordComponent.getValue(),
        confirmPassword: confirmPasswordComponent.getValue()
      };
      
      console.log('Password reset:', formData);
    }
  });
}

function initializeResetPasswordPage() {
  initializeTheme();
  setupThemeToggle();
  
  if (!requireGuest()) {
    return;
  }
  
  setupResetPasswordForm();
  
  // Focus on the first password input when page loads
  setTimeout(() => {
    if (newPasswordComponent) {
      newPasswordComponent.focus();
    }
  }, 100);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeResetPasswordPage);
} else {
  initializeResetPasswordPage();
}

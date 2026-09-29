import { getDocument } from '../../getDocument.js';

function createPasswordInput(options = {}) {
  const {
    id,
    name,
    label,
    placeholder = '',
    required = true,
    minLength = 8,
    showHint = true,
    errorId = null,
    containerClass = 'form-group'
  } = options;

  const container = document.createElement('div');
  container.className = containerClass;

  const labelElement = document.createElement('label');
  labelElement.setAttribute('for', id);
  labelElement.className = 'form-label';
  labelElement.textContent = label;

  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'form-input-wrapper';

  const input = document.createElement('input');
  input.type = 'password';
  input.id = id;
  input.name = name || id;
  input.className = 'form-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-required', required ? 'true' : 'false');
  
  const errorIdValue = errorId || `${id}-error`;
  input.setAttribute('aria-describedby', showHint ? `${id}-hint ${errorIdValue}` : errorIdValue);

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.className = 'form-toggle-password';
  toggleButton.id = `${id}-toggle`;
  toggleButton.setAttribute('aria-label', 'Show password');
  toggleButton.setAttribute('aria-pressed', 'false');
  toggleButton.setAttribute('aria-controls', id);

  const getIconPath = (filename) => {
    const path = window.location.pathname;
    if (path.includes('/auth/')) {
      return `../assets/images/${filename}`;
    }
    return `./assets/images/${filename}`;
  };
  
  const toggleIcon = document.createElement('img');
  toggleIcon.src = getIconPath('icon-show-password.svg');
  toggleIcon.alt = '';
  toggleIcon.className = 'toggle-icon';
  toggleIcon.setAttribute('aria-hidden', 'true');
  toggleButton.appendChild(toggleIcon);

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(toggleButton);

  const hintElement = showHint ? document.createElement('div') : null;
  if (hintElement) {
    hintElement.id = `${id}-hint`;
    hintElement.className = 'form-hint';
    hintElement.style.display = 'none';
    hintElement.setAttribute('role', 'status');
    hintElement.setAttribute('aria-live', 'polite');
    
    const getIconPath = (filename) => {
      const path = window.location.pathname;
      if (path.includes('/auth/')) {
        return `../assets/images/${filename}`;
      }
      return `./assets/images/${filename}`;
    };
    
    const hintIcon = document.createElement('img');
    hintIcon.src = getIconPath('icon-info.svg');
    hintIcon.alt = '';
    hintIcon.className = 'hint-icon';
    hintIcon.setAttribute('aria-hidden', 'true');
    
    const hintText = document.createElement('span');
    hintText.textContent = `At least ${minLength} characters`;
    
    hintElement.appendChild(hintIcon);
    hintElement.appendChild(hintText);
  }

  const errorElement = document.createElement('span');
  errorElement.id = errorIdValue;
  errorElement.className = 'form-error';
  errorElement.setAttribute('role', 'alert');
  errorElement.setAttribute('aria-live', 'polite');

  container.appendChild(labelElement);
  container.appendChild(inputWrapper);
  if (hintElement) {
    container.appendChild(hintElement);
  }
  container.appendChild(errorElement);

  function validatePassword(value) {
    if (required && !value.trim()) {
      return { valid: false, message: 'Password is required' };
    }
    if (value.length < minLength) {
      return { valid: false, message: `Password must be at least ${minLength} characters` };
    }
    return { valid: true, message: '' };
  }

  function displayHint() {
    if (hintElement) {
      hintElement.style.display = 'flex';
    }
  }

  function hideHint() {
    if (hintElement) {
      hintElement.style.display = 'none';
    }
  }

  function showError(message) {
    errorElement.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    hideHint();
  }

  function clearError() {
    errorElement.textContent = '';
    input.setAttribute('aria-invalid', 'false');
    updateHintVisibility();
  }

  function updateHintVisibility() {
    if (!hintElement) return;
    
    const value = input.value;
    const hasError = errorElement.textContent.trim() !== '';
    
    if (hasError) {
      hideHint();
    } else if (value.length > 0 && value.length < minLength) {
      displayHint();
    } else {
      hideHint();
    }
  }

  function setupPasswordToggle() {
    const getIconPath = (filename) => {
      const path = window.location.pathname;
      if (path.includes('/auth/')) {
        return `../assets/images/${filename}`;
      }
      return `./assets/images/${filename}`;
    };
    
    const showIconPath = getIconPath('icon-show-password.svg');
    const hideIconPath = getIconPath('icon-hide-password.svg');
    
    toggleIcon.setAttribute('src', showIconPath);

    toggleButton.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleButton.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      toggleButton.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      toggleIcon.setAttribute('src', isPassword ? hideIconPath : showIconPath);
    });

    toggleButton.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleButton.click();
      }
    });
  }

  function setupValidation() {
    input.addEventListener('blur', () => {
      const validation = validatePassword(input.value);
      if (!validation.valid) {
        showError(validation.message);
      } else {
        clearError();
      }
    });

    input.addEventListener('input', () => {
      updateHintVisibility();
      
      if (input.getAttribute('aria-invalid') === 'true') {
        const validation = validatePassword(input.value);
        if (validation.valid) {
          clearError();
        } else {
          showError(validation.message);
        }
      }
    });
  }

  setupPasswordToggle();
  setupValidation();

  return {
    element: container,
    input: input,
    validate: () => {
      const validation = validatePassword(input.value);
      if (!validation.valid) {
        showError(validation.message);
      } else {
        clearError();
      }
      updateHintVisibility();
      return validation.valid;
    },
    getValue: () => input.value,
    setValue: (value) => {
      input.value = value;
      updateHintVisibility();
    },
    clear: () => {
      input.value = '';
      clearError();
      updateHintVisibility();
    },
    focus: () => input.focus()
  };
}

export { createPasswordInput };


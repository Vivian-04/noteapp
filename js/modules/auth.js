const AUTH_STORAGE_KEY = 'notes-auth-users';
const CURRENT_USER_KEY = 'notes-current-user';

function getUsers() {
  try {
    const usersJson = localStorage.getItem(AUTH_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
  } catch (error) {
    console.error('Failed to load users:', error);
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save users:', error);
    throw new Error('Failed to save user data');
  }
}

function signUp(email, password) {
  const users = getUsers();
  const normalizedEmail = email.toLowerCase().trim();
  
  if (users[normalizedEmail]) {
    return { success: false, error: 'An account with this email already exists' };
  }
  
  users[normalizedEmail] = {
    email: normalizedEmail,
    password: password,
    createdAt: new Date().toISOString()
  };
  
  saveUsers(users);
  
  const currentUser = {
    email: normalizedEmail,
    loggedInAt: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  } catch (error) {
    console.error('Failed to save current user:', error);
  }
  
  return { success: true, user: currentUser };
}

function login(email, password) {
  const users = getUsers();
  const normalizedEmail = email.toLowerCase().trim();
  
  const user = users[normalizedEmail];
  
  if (!user) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  const currentUser = {
    email: normalizedEmail,
    loggedInAt: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  } catch (error) {
    console.error('Failed to save current user:', error);
    return { success: false, error: 'Failed to save session' };
  }
  
  return { success: true, user: currentUser };
}

function changePassword(email, currentPassword, newPassword) {
  const users = getUsers();
  const user = users[email];
  
  if (!user) {
    return { success: false, error: 'Account not found. Please log in again.' };
  }
  
  if (user.password !== currentPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }
  
  if (currentPassword === newPassword) {
    return { success: false, error: 'New password must be different from the current one' };
  }
  
  user.password = newPassword;
  
  try {
    saveUsers(users);
  } catch (error) {
    return { success: false, error: 'Failed to update password. Please try again.' };
  }
  
  return { success: true };
}

function logout() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    return { success: true };
  } catch (error) {
    console.error('Failed to logout:', error);
    return { success: false, error: 'Failed to logout' };
  }
}

function getCurrentUser() {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

function isAuthenticated() {
  const currentUser = getCurrentUser();
  return currentUser !== null;
}

export {
  signUp,
  login,
  logout,
  changePassword,
  getCurrentUser,
  isAuthenticated
};


function navigateTo(path) {
  const cleanPath = path.replace(/\.html$/, '');
  
  const currentPath = window.location.pathname.replace(/\.html$/, '');
  const targetClean = cleanPath.replace(/^\//, '');
  const currentClean = currentPath.replace(/^\//, '');
  
  if (currentClean === targetClean) {
    return;
  }
  
  let targetPath;
  
  if (cleanPath.startsWith('/')) {
    targetPath = cleanPath.endsWith('.html') ? cleanPath : `${cleanPath}.html`;
  } else {
    const currentDir = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    const isInAuth = currentDir.includes('/auth');
    const isInNotes = currentDir.includes('/notes') || currentDir.includes('/todos');
    
    if (cleanPath === 'notes') {
      targetPath = (isInAuth || isInNotes) ? '../notes/notes.html' : './notes/notes.html';
    } else if (cleanPath === 'todos') {
      targetPath = (isInAuth || isInNotes) ? '../todos/todos.html' : './todos/todos.html';
    } else if (cleanPath === 'index' || cleanPath === '') {
      targetPath = (isInAuth || isInNotes) ? '../index.html' : './index.html';
    } else if (cleanPath === 'settings') {
      targetPath = (isInAuth || isInNotes) ? '../settings.html' : './settings.html';
    } else if (cleanPath.includes('/')) {
      targetPath = (isInAuth || isInNotes) ? `../${cleanPath}.html` : `./${cleanPath}.html`;
    } else {
      targetPath = (isInAuth || isInNotes) ? `../${cleanPath}/${cleanPath}.html` : `./${cleanPath}/${cleanPath}.html`;
    }
  }
  
  window.location.href = targetPath;
}

function getCurrentPath() {
  let path = window.location.pathname.replace(/\.html$/, '').replace(/^\//, '');
  
  if (path === '' || path === 'index.html' || path === 'index') {
    return 'index';
  }
  
  return path;
}

function isAuthPage(path) {
  return path.includes('auth/login') || 
         path.includes('auth/signup') || 
         path.includes('auth/forgot-password') ||
         path.includes('auth/reset-password');
}

export {
  navigateTo,
  getCurrentPath,
  isAuthPage
};


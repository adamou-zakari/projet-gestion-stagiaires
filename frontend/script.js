// script.js - Fonctions partagées pour toute l'application

// API request avec token
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    ...options,
    headers
  });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
    throw new Error('Non autorisé');
  }
  return response;
}

// Vérifier authentification
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token || token === 'null') {
    window.location.href = 'index.html';
    return null;
  }
  return token;
}

// Récupérer l'utilisateur depuis localStorage
function getUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Déconnexion
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

// Toggle theme
function toggleTheme() {
  document.body.classList.toggle('dark');
  const icon = document.getElementById('themeIcon');
  if (icon) {
    icon.className = document.body.classList.contains('dark') ? 'fas fa-sun' : 'fas fa-moon';
  }
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

// Initialiser le thème
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'fas fa-sun';
  }
  const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if (collapsed) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('collapsed');
  }
}

// Initialiser la sidebar utilisateur
async function initSidebarUser() {
  const user = getUser();
  if (!user) return;
  const name = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || user.login || 'Utilisateur';
  const initials = getInitials(name);
  const roleText = user.role === 'admin'
    ? (typeof t === 'function' ? t('administrateur') : 'Administrateur')
    : (typeof t === 'function' ? t('agent_securite') : 'Agent de sécurité');
  
  const nameEl = document.getElementById('sidebarUserName');
  const initialsEl = document.getElementById('sidebarInitials');
  const roleEl = document.getElementById('sidebarUserRole');
  if (nameEl) nameEl.textContent = name;
  if (initialsEl) initialsEl.textContent = initials;
  if (roleEl) roleEl.textContent = roleText;
  
  // Masquer les liens admin si non admin
  const isAdmin = user.role === 'admin';
  const adminLinks = ['btnStagiaires', 'btnEmployes', 'btnSecurite'];
  adminLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isAdmin ? '' : 'none';
  });
}

function getInitials(name) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Afficher une notification toast
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.backgroundColor = type === 'error' ? '#dc2626' : '#1671d9';
  toast.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Sauvegarder la position de défilement de la sidebar.
// IMPORTANT : c'est .sidebar-nav qui a overflow-y:auto dans le CSS,
// pas .sidebar (qui a overflow:hidden). On cible donc sidebar-nav.
function saveSidebarScroll() {
  const nav = document.querySelector('.sidebar-nav');
  if (nav) {
    localStorage.setItem('sidebarScrollTop', nav.scrollTop);
  }
}

// Restaurer la position de défilement de la sidebar.
// Le double requestAnimationFrame est indispensable : si on applique
// scrollTop directement dans DOMContentLoaded, le navigateur remet
// la valeur à 0 lors de son premier rendu juste après.
function restoreSidebarScroll() {
  const savedScroll = localStorage.getItem('sidebarScrollTop');
  if (savedScroll === null) return;
  const value = parseInt(savedScroll, 10);
  if (!value) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      const nav = document.querySelector('.sidebar-nav');
      if (nav) nav.scrollTop = value;
    });
  });
}

// Intercepter les clics sur les liens de la sidebar pour sauvegarder le scroll avant navigation
document.addEventListener('DOMContentLoaded', function () {
  restoreSidebarScroll();
  initTheme();

  const nav = document.querySelector('.sidebar-nav');
  if (nav) {
    nav.addEventListener('click', function (e) {
      const link = e.target.closest('a[href]');
      if (link && !link.getAttribute('href').startsWith('#')) {
        saveSidebarScroll();
      }
    });
  }
});

// Exporter globalement
window.apiRequest = apiRequest;
window.checkAuth = checkAuth;
window.getUser = getUser;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.initSidebarUser = initSidebarUser;
window.showToast = showToast;
window.saveSidebarScroll = saveSidebarScroll;
window.restoreSidebarScroll = restoreSidebarScroll;
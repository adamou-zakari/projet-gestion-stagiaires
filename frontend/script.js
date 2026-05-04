// ─── Vérifier si l'utilisateur est connecté ──────────────────────────────────
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return null;
    }
    return token;
}

// ─── Récupérer le token ───────────────────────────────────────────────────────
function getToken() {
    return localStorage.getItem('token');
}

// ─── Récupérer l'utilisateur depuis localStorage ──────────────────────────────
function getUser() {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
        return JSON.parse(user);
    } catch (e) {
        localStorage.removeItem('user');
        return null;
    }
}

// ─── Vérifier le rôle et rediriger si non autorisé ───────────────────────────
function checkRole(allowedRoles) {
    const user = getUser();
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    if (!allowedRoles.includes(user.role)) {
        alert('Accès refusé. Vous n\'avez pas les droits nécessaires.');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// ─── Navigation (désactivée) ──────────────────────────────────────────────────
function applyNav(activePage) {
    return;
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// ─── Requêtes API authentifiées ───────────────────────────────────────────────
async function apiRequest(url, options = {}) {
    const token = getToken();

    if (!token) {
        console.error('❌ Token manquant');
        throw new Error('Non authentifié');
    }

    const mergedOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(url, mergedOptions);

        if (response.status === 401) {
            logout();
            throw new Error('Session expirée');
        }

        return response;
    } catch (error) {
        console.error('❌ Erreur API:', error);
        throw error;
    }
}

// ─── Notifications ────────────────────────────────────────────────────────────
function showNotification(message, type = 'success') {
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// ─── Formater une date ────────────────────────────────────────────────────────
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR', {
        day:   '2-digit',
        month: '2-digit',
        year:  'numeric'
    });
}

// ─── Formater une heure ───────────────────────────────────────────────────────
function formatTime(value) {
    if (!value) return '-';
    if (typeof value === 'string' && /^\d{1,2}:\d{2}/.test(value)) {
        return value.substring(0, 5);
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('fr-FR', {
            hour:   '2-digit',
            minute: '2-digit'
        });
    }
    return String(value).substring(0, 5);
}
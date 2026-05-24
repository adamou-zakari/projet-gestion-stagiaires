// notifications.js — ANSI Niger — Système de notifications temps réel

let notificationCount = 0;
let notificationsList = [];
let lastCheck = Math.floor(Date.now() / 1000);
let pollingInterval = null;
let _apiRequestFn = null;

function updateBadge() {
  document.querySelectorAll('.notif-badge').forEach(badge => {
    if (notificationCount > 0) {
      badge.textContent = notificationCount > 99 ? '99+' : notificationCount;
      badge.style.display = 'inline-flex';
      badge.classList.remove('hidden');
    } else {
      badge.style.display = 'none';
      badge.classList.add('hidden');
    }
  });
}

function saveToStorage() {
  try {
    localStorage.setItem('ansi_notifications', JSON.stringify({
      count: notificationCount,
      list: notificationsList,
      lastCheck
    }));
  } catch(e) {}
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem('ansi_notifications');
    if (saved) {
      const data = JSON.parse(saved);
      notificationCount = data.count || 0;
      notificationsList = data.list || [];
      lastCheck = data.lastCheck || Math.floor(Date.now() / 1000);
    } else {
      notificationCount = 0;
      notificationsList = [];
      lastCheck = Math.floor(Date.now() / 1000);
    }
    updateBadge();
  } catch(e) {
    notificationCount = 0;
    notificationsList = [];
    lastCheck = Math.floor(Date.now() / 1000);
  }
}

function addNotification(event) {
  let message = '';
  const prenom = event.prenom || '';
  const nom    = event.nom    || '';
  const heure  = event.heure  ? event.heure.substring(0, 5) : '?';

  if (event.message) {
    // Message direct (actions CRUD locales)
    message = event.message;
  } else if (event.type === 'visiteur_entree')  message = `Nouveau visiteur : ${prenom} ${nom} à ${heure}`;
  else if (event.type === 'visiteur_sortie')     message = `Sortie : ${prenom} ${nom} à ${heure}`;
  else if (event.type === 'stagiaire_entree')    message = `Pointage entrée : ${prenom} ${nom} à ${heure}`;
  else if (event.type === 'stagiaire_sortie')    message = `Pointage sortie : ${prenom} ${nom} à ${heure}`;
  else                                            message = `Événement : ${event.type || 'inconnu'}`;

  if (message) {
    notificationsList.unshift({ message, timestamp: Date.now(), type: event.type || 'action' });
    if (notificationsList.length > 50) notificationsList.pop();
    notificationCount++;
    updateBadge();
    saveToStorage();
    showNotifToast(message);
  }
}

function showNotifToast(msg) {
  // Supprimer les toasts de notification précédents
  document.querySelectorAll('.notif-toast').forEach(t => t.remove());

  // Injecter le style une seule fois
  if (!document.getElementById('notif-style')) {
    const style = document.createElement('style');
    style.id = 'notif-style';
    style.textContent = `
      @keyframes notifSlide {
        from { opacity:0; transform:translateX(20px); }
        to   { opacity:1; transform:translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.style.cssText = `
    position:fixed; bottom:80px; right:20px; z-index:9999;
    background:linear-gradient(135deg,#0a2540,#1671d9);
    color:#fff; padding:13px 18px; border-radius:14px;
    font-size:13px; font-weight:500;
    box-shadow:0 8px 24px rgba(22,113,217,0.4);
    display:flex; align-items:center; gap:10px;
    max-width:320px;
    animation:notifSlide .3s ease;
    font-family:'Outfit','Segoe UI',sans-serif;
  `;
  toast.innerHTML = `
    <i class="fas fa-bell" style="font-size:16px;color:#3b9eff;flex-shrink:0"></i>
    <span>${msg}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity .4s, transform .4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 420);
  }, 5000);
}

async function fetchNewNotifications() {
  if (!_apiRequestFn) return;
  try {
    const res = await _apiRequestFn(`http://localhost:3000/api/notifications/last?since=${lastCheck}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.events && data.events.length > 0) {
      data.events.forEach(event => addNotification(event));
    }
    lastCheck = Math.floor(Date.now() / 1000);
    saveToStorage();
  } catch(err) {
    // silencieux
  }
}

function showNotificationsModal() {
  document.querySelectorAll('.notif-modal-overlay').forEach(m => m.remove());

  if (notificationsList.length === 0) {
    const overlay = document.createElement('div');
    overlay.className = 'notif-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,37,64,0.5);backdrop-filter:blur(6px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;width:100%;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,0.25);overflow:hidden;font-family:'Outfit','Segoe UI',sans-serif;text-align:center;padding:40px 32px">
        <div style="width:64px;height:64px;background:rgba(22,113,217,0.08);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;font-size:28px;color:#94a3b8"><i class="fas fa-bell-slash"></i></div>
        <div style="font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:800;color:#0f172a;margin-bottom:6px">Aucune notification</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:24px">Vous êtes à jour !</div>
        <button onclick="this.closest('.notif-modal-overlay').remove()" style="padding:12px 28px;background:linear-gradient(135deg,#1671d9,#3b9eff);border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:#fff;font-family:inherit">Fermer</button>
      </div>
    `;
    overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'notif-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,37,64,0.5);backdrop-filter:blur(6px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:24px;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,0.25);overflow:hidden;font-family:\'Outfit\',\'Segoe UI\',sans-serif;';

  const header = document.createElement('div');
  header.style.cssText = 'padding:20px 22px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(22,113,217,0.05),transparent)';
  header.innerHTML = `
    <div style="width:40px;height:40px;background:linear-gradient(135deg,#1671d9,#3b9eff);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;flex-shrink:0"><i class="fas fa-bell"></i></div>
    <div>
      <div style="font-family:'Space Grotesk',sans-serif;font-size:17px;font-weight:800;color:#0f172a">Notifications</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:1px">${notificationsList.length} notification${notificationsList.length > 1 ? 's' : ''}</div>
    </div>
    <button onclick="this.closest('.notif-modal-overlay').remove()" style="margin-left:auto;background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:4px;border-radius:8px"><i class="fas fa-times"></i></button>
  `;

  const list = document.createElement('div');
  list.style.cssText = 'padding:12px 0;max-height:380px;overflow-y:auto';
  notificationsList.forEach((notif, i) => {
    const item = document.createElement('div');
    item.style.cssText = `padding:12px 22px;border-bottom:${i < notificationsList.length - 1 ? '1px solid #f0f4f9' : 'none'};display:flex;align-items:flex-start;gap:12px`;
    const time = notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '';
    const iconColor = notif.type?.includes('entree') ? '#0d9e8e' : notif.type?.includes('sortie') ? '#dc2626' : '#1671d9';
    const iconClass = notif.type?.includes('visiteur') ? 'fa-users' : notif.type?.includes('stagiaire') ? 'fa-user-graduate' : 'fa-bell';
    item.innerHTML = `
      <div style="width:34px;height:34px;border-radius:10px;background:rgba(22,113,217,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${iconColor}"><i class="fas ${iconClass}" style="font-size:13px"></i></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;color:#0f172a;line-height:1.4">${notif.message}</div>
        ${time ? `<div style="font-size:11px;color:#94a3b8;margin-top:3px">${time}</div>` : ''}
      </div>
    `;
    list.appendChild(item);
  });

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:14px 22px;border-top:1px solid #e2e8f0;display:flex;gap:8px';
  footer.innerHTML = `
    <button onclick="clearNotifications();this.closest('.notif-modal-overlay').remove()" style="flex:1;padding:11px;background:#f0f4f9;border:none;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;color:#475569;font-family:inherit">Tout effacer</button>
    <button onclick="this.closest('.notif-modal-overlay').remove()" style="flex:1;padding:11px;background:linear-gradient(135deg,#1671d9,#3b9eff);border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:#fff;font-family:inherit">Fermer</button>
  `;

  modal.appendChild(header);
  modal.appendChild(list);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  overlay.onclick = e => { if(e.target === overlay) overlay.remove(); };

  // Réinitialiser le compteur après lecture
  notificationCount = 0;
  updateBadge();
  saveToStorage();
}

function clearNotifications() {
  notificationCount = 0;
  notificationsList = [];
  updateBadge();
  saveToStorage();
}

function initNotifications(apiRequestFunction) {
  _apiRequestFn = apiRequestFunction;
  loadFromStorage();
  if (pollingInterval) clearInterval(pollingInterval);
  setTimeout(() => fetchNewNotifications(), 500);
  pollingInterval = setInterval(() => fetchNewNotifications(), 2000);
}

window.showNotificationsModal = showNotificationsModal;
window.initNotifications      = initNotifications;
window.clearNotifications     = clearNotifications;
window.addNotification        = addNotification;

// Toast warning : affiché sans badge ni liste de notifications
window.notifWarn = function(msg) {
  document.querySelectorAll('.notif-warn-toast').forEach(t => t.remove());
  if (!document.getElementById('notif-style')) {
    const style = document.createElement('style');
    style.id = 'notif-style';
    style.textContent = `@keyframes notifSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`;
    document.head.appendChild(style);
  }
  const toast = document.createElement('div');
  toast.className = 'notif-warn-toast';
  toast.style.cssText = `
    position:fixed;bottom:80px;right:20px;z-index:9999;
    background:linear-gradient(135deg,#7c3aed,#a78bfa);
    color:#fff;padding:13px 18px;border-radius:14px;
    font-size:13px;font-weight:500;
    box-shadow:0 8px 24px rgba(124,58,237,0.35);
    display:flex;align-items:center;gap:10px;
    max-width:320px;animation:notifSlide .3s ease;
    font-family:'Outfit','Segoe UI',sans-serif;
  `;
  toast.innerHTML = `<i class="fas fa-exclamation-circle" style="font-size:16px;color:#ddd6fe;flex-shrink:0"></i><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity .4s,transform .4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 420);
  }, 4000);
};
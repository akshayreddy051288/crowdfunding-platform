(function () {
  const SESSION_KEY = 'crowdhealSession';
  const TEMP_USERS_KEY = 'crowdhealTemporaryUsers';
  const encoder = new TextEncoder();
  const DEFAULT_CREDENTIALS = [
    {email: '2500032741@kluniversity.in', password: 'Klu@123', firstName: 'Akshay', lastName: 'Reddy'},
    {email: '2500032572@kluniversity.in', password: 'Klu@123', firstName: 'Pujith', lastName: 'Sai'}
  ];

  function getReturnTarget() {
    const target = new URLSearchParams(location.search).get('returnTo');
    if (target === 'create-campaign.html' || target === 'dashboard.html') return target;
    return target && /^create-campaign\.html\?edit=[A-Za-z0-9_-]{1,100}$/.test(target) ? target : 'home.html';
  }

  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return session && typeof session.email === 'string' ? session : null;
    } catch (_) {
      return null;
    }
  }

  function setSession(user) {
    const session = {email: user.email, firstName: user.firstName, lastName: user.lastName};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getTemporaryUsers() {
    try {
      const users = JSON.parse(sessionStorage.getItem(TEMP_USERS_KEY) || '[]');
      return Array.isArray(users) ? users : [];
    } catch (_) {
      return [];
    }
  }

  function toHex(bytes) {
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function createSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return toHex(bytes);
  }

  async function hashPassword(password, saltHex) {
    const salt = Uint8Array.from(saltHex.match(/.{2}/g), byte => parseInt(byte, 16));
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256'}, key, 256);
    return toHex(bits);
  }

  async function signIn({email, password}) {
    const normalizedEmail = email.trim().toLowerCase();
    const defaultUser = DEFAULT_CREDENTIALS.find(entry => entry.email === normalizedEmail && entry.password === password);
    if (defaultUser) return setSession(defaultUser);

    const temporaryUser = getTemporaryUsers().find(entry => entry.email === normalizedEmail);
    if (!temporaryUser || !crypto.subtle) throw new Error('Email or password is incorrect.');
    const passwordHash = await hashPassword(password, temporaryUser.salt);
    if (passwordHash !== temporaryUser.passwordHash) throw new Error('Email or password is incorrect.');
    return setSession(temporaryUser);
  }

  async function signUp({firstName, lastName, email, password}) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = DEFAULT_CREDENTIALS.some(entry => entry.email === normalizedEmail)
      || getTemporaryUsers().some(entry => entry.email === normalizedEmail);
    if (existing) throw new Error('An account with this email already exists. Please sign in.');
    if (!crypto.subtle) throw new Error('Secure password storage is unavailable. Open the project in a modern browser and try again.');
    const salt = createSalt();
    const user = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      salt,
      passwordHash: await hashPassword(password, salt)
    };
    const users = getTemporaryUsers();
    users.push(user);
    sessionStorage.setItem(TEMP_USERS_KEY, JSON.stringify(users));
    return setSession(user);
  }

  function logout(event) {
    if (event) event.preventDefault();
    sessionStorage.removeItem(SESSION_KEY);
    location.href = 'home.html';
  }

  function addProfileMenu(session) {
    if (!document.getElementById('crowdhealProfileStyles')) {
      const style = document.createElement('style');
      style.id = 'crowdhealProfileStyles';
      style.textContent = `
        .crowdheal-profile { position: relative; flex: 0 0 auto; z-index: 120; }
        .crowdheal-profile__trigger { display:grid; place-items:center; width:44px; height:44px; border:2px solid rgba(15,92,92,.16); border-radius:50%; background:var(--primary,#0f5c5c); color:#fff; font:800 .82rem var(--font-body,Manrope,sans-serif); cursor:pointer; box-shadow:0 3px 10px rgba(15,92,92,.16); transition:transform .18s,box-shadow .18s; }
        .crowdheal-profile__trigger:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(15,92,92,.22); }
        .crowdheal-profile__trigger:focus-visible,.crowdheal-profile__menu a:focus-visible { outline:3px solid var(--coral,#e8563e); outline-offset:3px; }
        .crowdheal-profile__menu { position:absolute; top:calc(100% + 11px); right:0; width:min(280px,calc(100vw - 32px)); padding:8px; border:1px solid var(--border,#e2e6ea); border-radius:14px; background:#fff; box-shadow:0 14px 40px rgba(27,36,48,.18); }
        .crowdheal-profile__menu[hidden] { display:none !important; }
        .crowdheal-profile__summary { padding:12px 13px; border-bottom:1px solid var(--border,#e2e6ea); margin-bottom:6px; }
        .crowdheal-profile__name,.crowdheal-profile__email { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .crowdheal-profile__name { color:var(--ink,#1b2430); font-weight:800; font-size:.9rem; }
        .crowdheal-profile__email { color:var(--muted,#6b7786); font-size:.75rem; margin-top:2px; }
        .crowdheal-profile__menu a { display:block; padding:10px 13px; border-radius:9px; color:var(--ink,#1b2430); font-size:.86rem; font-weight:700; }
        .crowdheal-profile__menu a:hover { background:#f2f7f4; color:var(--primary,#0f5c5c); text-decoration:none; }
        .crowdheal-profile__menu a[data-crowdheal-logout] { color:#a83e2b; }
        @media(max-width:960px) { .crowdheal-profile__trigger { width:40px; height:40px; } }
      `;
      document.head.appendChild(style);
    }

    document.querySelectorAll('header a[href="login.html"],header a[href^="login.html?"]').forEach(link => link.remove());

    const displayName = session ? [session.firstName, session.lastName].filter(Boolean).join(' ') || 'Your account' : '';
    const initials = session ? [session.firstName, session.lastName].filter(Boolean).map(part => part.trim().charAt(0)).join('').slice(0, 2).toUpperCase() || 'CH' : '';
    document.querySelectorAll('header .site-header__inner,header .header-inner').forEach(function (header) {
      if (header.querySelector('.crowdheal-profile')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'crowdheal-profile';
      const trigger = document.createElement('button');
      trigger.className = 'crowdheal-profile__trigger';
      trigger.type = 'button';
      if (session) trigger.textContent = initials;
      else trigger.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-4 3.6-6 8-6s7.3 2 8 6"/></svg>';
      trigger.setAttribute('aria-label', session ? 'Open profile menu' : 'Open sign in menu');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      const menu = document.createElement('div');
      menu.className = 'crowdheal-profile__menu';
      menu.hidden = true;
      if (session) {
        menu.innerHTML = `<div class="crowdheal-profile__summary"><span class="crowdheal-profile__name"></span><span class="crowdheal-profile__email"></span></div><a href="dashboard.html">Fundraiser dashboard</a><a href="home.html" data-crowdheal-logout>Log out</a>`;
        menu.querySelector('.crowdheal-profile__name').textContent = displayName;
        menu.querySelector('.crowdheal-profile__email').textContent = session.email;
        menu.querySelector('[data-crowdheal-logout]').addEventListener('click', logout);
      } else {
        menu.innerHTML = '<a href="login.html">Sign in</a><a href="signup.html">Create an account</a>';
      }
      trigger.addEventListener('click', function (event) {
        event.stopPropagation();
        const open = menu.hidden;
        menu.hidden = !open;
        trigger.setAttribute('aria-expanded', String(open));
      });
      wrapper.append(trigger, menu);
      const navToggle = header.querySelector('.nav-toggle');
      if (navToggle) header.insertBefore(wrapper, navToggle);
      else header.appendChild(wrapper);
      document.addEventListener('click', function (event) {
        if (!wrapper.contains(event.target)) {
          menu.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          menu.hidden = true;
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  window.CrowdHealAuth = {
    getSession,
    signIn,
    signUp,
    logout,
    getReturnTarget,
    getDefaultCredentials: () => DEFAULT_CREDENTIALS.map(({email, password}) => ({email, password}))
  };

  const session = getSession();
  addProfileMenu(session);
  const currentPage = location.pathname.split('/').pop();
  if (session && (currentPage === 'login.html' || currentPage === 'signup.html')) {
    location.replace(getReturnTarget());
  }
})();

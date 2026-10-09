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
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return session && typeof session.email === 'string' ? session : null;
    } catch (_) {
      return null;
    }
  }

  function setSession(user) {
    const session = {email: user.email, firstName: user.firstName, lastName: user.lastName};
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function getTemporaryUsers() {
    try {
      const users = JSON.parse(localStorage.getItem(TEMP_USERS_KEY) || '[]');
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
    localStorage.setItem(TEMP_USERS_KEY, JSON.stringify(users));
    return setSession(user);
  }

  function logout(event) {
    if (event) event.preventDefault();
    localStorage.removeItem(SESSION_KEY);
    location.href = 'home.html';
  }

  function updateSignedInLinks() {
    if (!getSession()) return;
    document.querySelectorAll('header a[href="login.html"], header a[href^="login.html?"]').forEach(function (link) {
      link.href = 'dashboard.html';
      link.textContent = 'Dashboard';
      link.removeAttribute('hidden');
      link.removeAttribute('aria-hidden');
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

  updateSignedInLinks();
  const currentPage = location.pathname.split('/').pop();
  if (getSession() && (currentPage === 'login.html' || currentPage === 'signup.html')) {
    location.replace(getReturnTarget());
  }
})();

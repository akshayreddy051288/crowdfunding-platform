// ── Auth helpers using localStorage ──────────────────────────────────────────
const SESSION_KEY = 'crowdhealSession';
const TEMP_USERS_KEY = 'crowdhealTemporaryUsers';
const encoder = new TextEncoder();

const DEFAULT_CREDENTIALS = [
  { email: '2500032741@kluniversity.in', password: 'Klu@123', firstName: 'Akshay', lastName: 'Reddy' },
  { email: '2500032572@kluniversity.in', password: 'Klu@123', firstName: 'Pujith', lastName: 'Sai' },
];

function toHex(bytes) {
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

async function hashPassword(password, saltHex) {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g), b => parseInt(b, 16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return session && typeof session.email === 'string' ? session : null;
  } catch (_) {
    return null;
  }
}

function setSession(user) {
  const session = { email: user.email, firstName: user.firstName, lastName: user.lastName };
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

export async function signIn({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const defaultUser = DEFAULT_CREDENTIALS.find(e => e.email === normalizedEmail && e.password === password);
  if (defaultUser) return setSession(defaultUser);

  const temporaryUser = getTemporaryUsers().find(e => e.email === normalizedEmail);
  if (!temporaryUser || !crypto.subtle) throw new Error('Email or password is incorrect.');
  const passwordHash = await hashPassword(password, temporaryUser.salt);
  if (passwordHash !== temporaryUser.passwordHash) throw new Error('Email or password is incorrect.');
  return setSession(temporaryUser);
}

export async function signUp({ firstName, lastName, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing =
    DEFAULT_CREDENTIALS.some(e => e.email === normalizedEmail) ||
    getTemporaryUsers().some(e => e.email === normalizedEmail);
  if (existing) throw new Error('An account with this email already exists. Please sign in.');
  if (!crypto.subtle) throw new Error('Secure password storage is unavailable.');
  const salt = createSalt();
  const user = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    salt,
    passwordHash: await hashPassword(password, salt),
  };
  const users = getTemporaryUsers();
  users.push(user);
  localStorage.setItem(TEMP_USERS_KEY, JSON.stringify(users));
  return setSession(user);
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/** Allow only in-app paths after login/signup. */
export function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

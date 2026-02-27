/**
 * Local Authentication System (Desktop/Offline)
 * Used when app runs in Electron, not connected to internet
 */

export interface LocalUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
  uid: string;
}

export interface LocalAuthSession {
  user: LocalUser;
  token: string;
  createdAt: Date;
}

const USERS_STORAGE_KEY = "pontaj_users";
const CURRENT_SESSION_KEY = "pontaj_session";

/**
 * Simple hash function (for local storage only)
 */
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function generateToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Register a new local user with username
 */
export function registerUserLocal(username: string, password: string): LocalUser {
  const users = getAllUsersLocal();

  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already taken");
  }

  if (!username || !password) {
    throw new Error("Username and password required");
  }

  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }

  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters");
  }

  const newUser: LocalUser = {
    id: `user_${Date.now()}`,
    uid: `local_${Date.now()}`,
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  };

  users.push(newUser);
  saveUsersLocal(users);
  return newUser;
}

/**
 * Login a local user with username
 */
export function loginUserLocal(username: string, password: string): LocalUser {
  const users = getAllUsersLocal();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    throw new Error("Username not found");
  }

  if (user.passwordHash !== hashPassword(password)) {
    throw new Error("Incorrect password");
  }

  user.lastLogin = new Date();
  saveUsersLocal(users);

  saveSessionLocal(user);
  return user;
}

/**
 * Logout local user
 */
export function logoutUserLocal(): void {
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

/**
 * Get current local session
 */
export function getCurrentSessionLocal(): LocalUser | null {
  const raw = localStorage.getItem(CURRENT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if local user is logged in
 */
export function isLoggedInLocal(): boolean {
  return getCurrentSessionLocal() !== null;
}

// Internal helpers
function getAllUsersLocal(): LocalUser[] {
  const raw = localStorage.getItem(USERS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsersLocal(users: LocalUser[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function saveSessionLocal(user: LocalUser): void {
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(user));
}

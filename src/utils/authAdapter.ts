/**
 * Adaptive Authentication
 * Automatically uses local auth for desktop (Electron)
 * or Firebase auth for web
 */

import { isPlatformElectron } from "./platform";
import {
  registerUserLocal,
  loginUserLocal,
  logoutUserLocal,
  getCurrentSessionLocal,
  isLoggedInLocal,
} from "./localAuth";

const isElectron = isPlatformElectron();

// Firebase imports - only used in web mode
let signInWithEmailAndPassword: any = null;
let createUserWithEmailAndPassword: any = null;
let signOut: any = null;
let onAuthStateChanged: any = null;
let auth: any = null;

if (!isElectron) {
  const fb = require("firebase/auth");
  const fbConfig = require("./firebase");
  signInWithEmailAndPassword = fb.signInWithEmailAndPassword;
  createUserWithEmailAndPassword = fb.createUserWithEmailAndPassword;
  signOut = fb.signOut;
  onAuthStateChanged = fb.onAuthStateChanged;
  auth = fbConfig.auth;
}

export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Register new user (adapts to platform)
 */
export async function registerUser(usernameOrEmail: string, password: string): Promise<AuthUser> {
  try {
    if (isElectron) {
      const user = registerUserLocal(usernameOrEmail, password);
      return { uid: user.uid, email: user.username };
    } else {
      const result = await createUserWithEmailAndPassword(auth, usernameOrEmail, password);
      return {
        uid: result.user.uid,
        email: result.user.email || undefined,
      };
    }
  } catch (err: any) {
    throw new Error(err.message || "Registration failed");
  }
}

/**
 * Login user (adapts to platform)
 */
export async function loginUser(usernameOrEmail: string, password: string): Promise<AuthUser> {
  try {
    if (isElectron) {
      const user = loginUserLocal(usernameOrEmail, password);
      return { uid: user.uid, email: user.username };
    } else {
      const result = await signInWithEmailAndPassword(auth, usernameOrEmail, password);
      return {
        uid: result.user.uid,
        email: result.user.email || undefined,
      };
    }
  } catch (err: any) {
    throw new Error(err.message || "Login failed");
  }
}

/**
 * Logout user (adapts to platform)
 */
export async function logoutUser(): Promise<void> {
  try {
    if (isElectron) {
      logoutUserLocal();
    } else {
      await signOut(auth);
    }
  } catch (err: any) {
    throw new Error(err.message || "Logout failed");
  }
}

/**
 * Get current authenticated user (adapts to platform)
 */
export function getCurrentUser(): AuthUser | null {
  if (isElectron) {
    const user = getCurrentSessionLocal();
    return user ? { uid: user.uid, email: user.username } : null;
  } else {
    const firebaseUser = auth.currentUser;
    return firebaseUser
      ? {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
        }
      : null;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  if (isElectron) {
    return isLoggedInLocal();
  } else {
    return auth.currentUser !== null;
  }
}

/**
 * Listen to auth state changes (adapts to platform)
 */
export function onAuthStateChangedListener(
  callback: (user: AuthUser | null) => void
): () => void {
  if (isElectron) {
    // For Electron, check once and return a no-op unsubscriber
    callback(getCurrentUser());
    return () => {};
  } else {
    // For web, use Firebase's real-time listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
        });
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  }
}

/**
 * Get platform info for debugging
 */
export function getAuthPlatform(): string {
  return isElectron ? "Electron (Local)" : "Web (Firebase)";
}

import { db } from "./firebase";
import { Profile } from "../types";
import { ACTIVE_PROFILE_KEY, ACTIVE_CALENDAR_KEY } from "./storage";
import { isPlatformElectron } from "./platform";

// Conditionally import Firestore functions
let collection: any = null;
let doc: any = null;
let getDoc: any = null;
let setDoc: any = null;

if (!isPlatformElectron()) {
  const firestore = require("firebase/firestore");
  collection = firestore.collection;
  doc = firestore.doc;
  getDoc = firestore.getDoc;
  setDoc = firestore.setDoc;
}

// Save all user data (profiles, calendars, entries, active selections) to Firestore under the user's UID
export async function saveUserDataToCloud(
  uid: string,
  profiles: Profile[],
  activeProfileId?: string | null,
  activeCalendarId?: string | null
) {
  if (!db || !collection || !doc || !setDoc) {
    throw new Error("Cloud sync not available");
  }
  const userDoc = doc(db, "users", uid);
  await setDoc(userDoc, {
    profiles,
    activeProfileId: activeProfileId ?? localStorage.getItem(ACTIVE_PROFILE_KEY),
    activeCalendarId: activeCalendarId ?? localStorage.getItem(ACTIVE_CALENDAR_KEY),
  });
}

// Load all user data from Firestore for the given UID
export async function loadUserDataFromCloud(uid: string): Promise<{
  profiles: Profile[];
  activeProfileId?: string;
  activeCalendarId?: string;
} | null> {
  if (!db || !collection || !doc || !getDoc) {
    throw new Error("Cloud sync not available");
  }
  const userDoc = doc(db, "users", uid);
  const snap = await getDoc(userDoc);
  if (snap.exists()) {
    const data = snap.data();
    return {
      profiles: data.profiles || [],
      activeProfileId: data.activeProfileId,
      activeCalendarId: data.activeCalendarId,
    };
  }
  return null;
}

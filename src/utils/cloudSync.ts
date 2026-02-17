import { db } from "./firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { Profile } from "../types";
import { ACTIVE_PROFILE_KEY, ACTIVE_CALENDAR_KEY } from "./storage";


// Save all user data (profiles, calendars, entries, active selections) to Firestore under the user's UID
export async function saveUserDataToCloud(
  uid: string,
  profiles: Profile[],
  activeProfileId?: string | null,
  activeCalendarId?: string | null
) {
  const userDoc = doc(collection(db, "users"), uid);
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
  const userDoc = doc(collection(db, "users"), uid);
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

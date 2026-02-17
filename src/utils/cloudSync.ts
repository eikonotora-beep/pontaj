import { db } from "./firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { Profile } from "../types";

// Save all user data (profiles, calendars, entries) to Firestore under the user's UID
export async function saveUserDataToCloud(uid: string, profiles: Profile[]) {
  const userDoc = doc(collection(db, "users"), uid);
  await setDoc(userDoc, { profiles });
}

// Load all user data from Firestore for the given UID
export async function loadUserDataFromCloud(uid: string): Promise<Profile[] | null> {
  const userDoc = doc(collection(db, "users"), uid);
  const snap = await getDoc(userDoc);
  if (snap.exists()) {
    return snap.data().profiles || [];
  }
  return null;
}

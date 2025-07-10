import { getUserFromFirestore } from "./getUserFromFirestore";

export async function getUserLevelFromFirestore(uid: string) {
  const userDoc = await getUserFromFirestore(uid);

  if (!userDoc.exists()) {
    return "none";
  }

  return userDoc.data().level;
}

import { collection, doc, getDoc } from "firebase/firestore";
import { Firestore } from "../firestore";

export async function getUserLevelFromFirestore(uid: string) {
  const db = Firestore();
  const coll = collection(db, "users");
  const ref = doc(coll, uid);

  const userDoc = await getDoc(ref);

  if (!userDoc.exists()) {
    return "none";
  }

  return userDoc.data().level;
}

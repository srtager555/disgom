import { collection, doc, DocumentReference } from "firebase/firestore";
import { Firestore } from "../firestore";
import { userDoc } from "./createUserDoc";
import { getDocFromCacheOnce } from "../firestore/fetch/getDocFromCacheOnce";

export async function getUserFromFirestore(uid: string) {
  const db = Firestore();
  const coll = collection(db, "users");
  const ref = doc(coll, uid) as DocumentReference<userDoc>;

  const userDoc = await getDocFromCacheOnce(ref);

  return userDoc;
}

import { collection, doc, DocumentReference, getDoc } from "firebase/firestore";
import { Firestore } from "../firestore";
import { userDoc } from "./createUserDoc";

export async function getUserFromFirestore(uid: string) {
  const db = Firestore();
  const coll = collection(db, "users");
  const ref = doc(coll, uid) as DocumentReference<userDoc>;

  const userDoc = await getDoc(ref);

  return userDoc;
}

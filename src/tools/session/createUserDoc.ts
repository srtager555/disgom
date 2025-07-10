import { userLevelsType } from "@/hooks/login/useCheckUserLevel";
import { User } from "firebase/auth";
import { Firestore } from "../firestore";
import { collection, doc, setDoc } from "firebase/firestore";

export type userDoc = {
  uid: string;
  level: userLevelsType;
  created_at: Date;
  disabled: boolean;
  username: string;
  mail: string;
};

export async function createUserDoc(
  user: User,
  username: string,
  level: userLevelsType,
  mail: string
) {
  const db = Firestore();
  const coll = collection(db, "users");
  const ref = doc(coll, user.uid);

  await setDoc(ref, {
    uid: user.uid,
    level,
    created_at: new Date(),
    disabled: false,
    username,
    mail,
  });
}

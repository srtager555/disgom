import { Firestore } from "@/tools/firestore";
import { userDoc } from "@/tools/session/createUserDoc";
import {
  collection,
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useGetAllAvailablesUsers() {
  const [users, setUsers] = useState<QueryDocumentSnapshot<userDoc>[]>([]);

  useEffect(() => {
    const db = Firestore();
    const coll = collection(db, "users") as CollectionReference<userDoc>;
    const q = query(coll, where("disabled", "==", false));

    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs);
    });

    return unsubscribe;
  }, []);

  return users;
}

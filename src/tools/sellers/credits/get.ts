import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { clientCredit, credit } from "./create";

/**
 * Realtime credits
 * @param route the route
 * @param seller_ref the seller refference
 * @param all if we need get all credit insteance of by route
 * @returns the function to cancel the subcription
 */
export function getCredits(
  route: number,
  seller_ref: DocumentReference<SellersDoc>,
  all: boolean = false
) {
  const creditColl = collection(
    seller_ref,
    SellersCollection.credits
  ) as CollectionReference<clientCredit>;

  const q = query(creditColl, where("route", "==", route));
  let theData: QueryDocumentSnapshot<clientCredit>[] = [];

  const unsubcription = onSnapshot(all ? creditColl : q, (snap) => {
    theData = snap.docs;
  });

  return { unsubcription, theData };
}

export async function getClientCredits(
  clientCreditDocRef: DocumentReference<clientCredit>
) {
  const coll = collection(
    clientCreditDocRef,
    "credits"
  ) as CollectionReference<credit>;
  const q = query(coll, orderBy("created_at", "desc"), limit(1));

  const credits = await getDocs(q);

  if (credits.size > 0) {
    return credits.docs[0];
  } else return undefined;
}

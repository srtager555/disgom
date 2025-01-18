import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { clientCredit, credit } from "./create";

export async function getCredits(
  route: number,
  seller_ref: DocumentReference<SellersDoc>,
  all: boolean = false
) {
  const creditColl = collection(
    seller_ref,
    SellersCollection.credits
  ) as CollectionReference<clientCredit>;

  const q = query(creditColl, where("route", "==", route));
  const clients = await getDocs(all ? creditColl : q);

  return clients;
}

export async function getClientCredits(
  clientCreditDoc: QueryDocumentSnapshot<clientCredit>
) {
  const coll = collection(
    clientCreditDoc.ref,
    "credits"
  ) as CollectionReference<credit>;
  const q = query(coll, orderBy("created_at", "desc"), limit(1));

  const credits = await getDocs(q);

  if (credits.size > 0) {
    return credits.docs[0];
  } else return undefined;
}

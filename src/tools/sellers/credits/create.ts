import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";

export type clientCredit = {
  route: number;
  name: string;
  created_at: Timestamp;
  address: string;
};

export type credit = {
  amount: number;
  last_amount: number;
  created_at: Timestamp;
};

export async function createClientCredit(
  route: number,
  seller_ref: DocumentReference<SellersDoc>,
  name: string,
  amount: number,
  address: string
) {
  const creditColl = collection(
    seller_ref,
    SellersCollection.credits
  ) as CollectionReference<clientCredit>;

  const client = await addDoc(creditColl, {
    created_at: Timestamp.fromDate(new Date()),
    route,
    name,
    address,
  });

  return await createCredit(client, amount, 0);
}

export async function createCredit(
  client_ref: DocumentReference<clientCredit>,
  amount: number,
  last_amount: number
) {
  const coll = collection(client_ref, "credits") as CollectionReference<credit>;

  return await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
    amount,
    last_amount,
  });
}

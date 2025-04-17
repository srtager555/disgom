import {
  addDoc,
  arrayUnion,
  collection,
  CollectionReference,
  DocumentReference,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";

export type clientCredit = {
  route: number;
  name: string;
  created_at: Timestamp;
  address: string;
};

export type credit = {
  created_at: Timestamp;
  amount: number;
  client_ref: DocumentReference<clientCredit>;
  last_amount: number | null;
  last_credit: DocumentReference<credit> | null;
  next_credit: DocumentReference<credit> | null;
  invoice_ref: DocumentReference<invoiceType>;
  seller_ref: DocumentReference<SellersDoc>;
};

export async function createClientCredit(
  route: number,
  seller_ref: DocumentReference<SellersDoc>,
  name: string,
  amount: number,
  address: string,
  invoice_ref: DocumentReference<invoiceType>
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

  return await createCredit({
    client_ref: client,
    amount,
    last_amount: 0,
    last_credit: null,
    next_credit: null,
    invoice_ref,
    seller_ref,
  });
}

export async function createCredit(
  props: Omit<credit, "created_at">
): Promise<DocumentReference<credit>> {
  const coll = collection(
    props.client_ref,
    "credits"
  ) as CollectionReference<credit>;

  const newCredit = await addDoc(coll, {
    created_at: Timestamp.fromDate(new Date()),
    ...props,
  });

  await updateDoc(props.invoice_ref, {
    newCredit: arrayUnion(newCredit),
  });

  return newCredit;
}

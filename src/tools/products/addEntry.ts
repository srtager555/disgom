import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  Timestamp,
} from "firebase/firestore";
import { productDoc } from "./create";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { addToStock } from "./addToStock";

export interface entryDoc extends entryData {
  disabled: false;
}

export type entryData = {
  purchase_price: number;
  sale_price: number;
  seller_commission: number;
  amount: number;
};

export interface entryDoc extends entryData {
  created_at: Timestamp;
}

export async function addEntry(
  productRef: DocumentReference<productDoc>,
  data: entryData
) {
  const coll = collection(productRef, ProductsCollection.entry);

  await addDoc(coll, {
    created_at: new Date(),
    disabled: false,
    ...data,
  }).then(async (_) => {
    const entry_ref = doc(coll, _.id) as DocumentReference<entryDoc>;

    await addToStock(productRef, {
      entry_ref,
      ...data,
      product_ref: productRef,
    });
  });
}

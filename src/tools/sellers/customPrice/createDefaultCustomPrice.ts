import {
  addDoc,
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { productDoc } from "@/tools/products/create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { client } from "../createClient";

export type defaultCustomPrice = {
  created_at: Timestamp;
  product_ref: DocumentReference<productDoc>;
  price: number;
  disabled: boolean;
};

export async function createDefaultCustomPrice(
  seller_ref: DocumentReference<SellersDoc>,
  product_ref: DocumentReference<productDoc>,
  price: number,
  client_ref: DocumentReference<client> | null = null
) {
  let coll = collection(
    seller_ref,
    SellersCollection.defaulCustomPrices
  ) as CollectionReference<defaultCustomPrice>;

  if (client_ref)
    coll = collection(
      client_ref,
      SellersCollection.defaulCustomPrices
    ) as CollectionReference<defaultCustomPrice>;

  const q = query(
    coll,
    where("product_ref", "==", product_ref),
    where("disabled", "==", false),
    orderBy("created_at", "desc"),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    await updateDoc(querySnapshot.docs[0].ref, {
      disabled: true,
    });
  }

  await addDoc(coll, {
    created_at: Timestamp.now(),
    product_ref,
    price,
    disabled: false,
  });
}

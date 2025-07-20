import {
  collection,
  CollectionReference,
  DocumentReference,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { SellersDoc } from "../create";
import { productDoc } from "@/tools/products/create";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { defaultCustomPrice } from "./createDefaultCustomPrice";
import { client } from "../createClient";
import { getQueryFromCacheOnce } from "@/tools/firestore/fetch/getQueryFromCacheOnce";

export async function getDefaultCustomPrice(
  seller_ref: DocumentReference<SellersDoc>,
  product_ref: DocumentReference<productDoc>,
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
  const querySnapshot = await getQueryFromCacheOnce(q);

  return querySnapshot.docs[0];
}

import { collection, getDocs, query, where } from "firebase/firestore";
import { Firestore } from "../firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { invoiceType } from "./createInvoice";

export async function refreshAllProduct(): Promise<
  invoiceType["refresh_data"]
> {
  const db = Firestore();
  const productsColl = collection(db, ProductsCollection.root);
  const q = query(productsColl, where("disabled", "==", false));

  const product = await getDocs(q);

  return Object.fromEntries(product.docs.map((doc) => [doc.id, true]));
}

import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  updateDoc,
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
  product: DocumentSnapshot<productDoc>,
  data: entryData
) {
  const coll = collection(product.ref, ProductsCollection.entry);

  await addDoc(coll, {
    created_at: new Date(),
    disabled: false,
    ...data,
  }).then(async (_) => {
    const entry_ref = doc(coll, _.id) as DocumentReference<entryDoc>;

    const last_sales_amounts = product.data()?.last_sales_amounts;
    const purchaseIsEqual =
      last_sales_amounts?.purchase_price === data.purchase_price;
    const saleIsEqual = last_sales_amounts?.sale_price === data.sale_price;

    // update the persistent prices
    if (!purchaseIsEqual || !saleIsEqual) {
      await updateDoc(product.ref, {
        last_sales_amounts: {
          purchase_price: data.purchase_price,
          sale_price: data.sale_price,
          seller_commission: data.seller_commission,
        },
      });
    }

    await addToStock(product.ref, {
      entry_ref,
      ...data,
      product_ref: product.ref,
    });
  });
}

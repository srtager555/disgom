import {
  collection,
  CollectionReference,
  DocumentReference,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { productDoc } from "../products/create";

import { onSnapshot } from "firebase/firestore";
import { outputType } from "../products/addOutputs";

export function getTheOutputsSoldByID(
  product_ref: DocumentReference<productDoc>,
  invoice_ref: DocumentReference<invoiceType>
): Promise<QuerySnapshot<outputType> | undefined> {
  return new Promise((resolve, reject) => {
    try {
      const coll = collection(
        invoice_ref,
        "outputs_sold"
      ) as CollectionReference<outputType>;

      const q = query(
        coll,
        where("product_ref", "==", product_ref),
        where("disabled", "==", false)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          resolve(snapshot);
          unsubscribe(); // Solo una vez
        },
        (error) => {
          console.error("onSnapshot error in getTheOutputsSoldByID", error);
          reject(error);
        }
      );
    } catch (error) {
      console.error("error getting the outputs sold by id");
      console.error(error);
      return Promise.resolve(undefined);
    }
  });
}

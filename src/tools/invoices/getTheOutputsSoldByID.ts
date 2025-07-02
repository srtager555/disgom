import {
  collection,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { productDoc } from "../products/create";

export async function getTheOutputsSoldByID(
  product_ref: DocumentReference<productDoc>,
  invoice_ref: DocumentReference<invoiceType>
) {
  try {
    const coll = collection(invoice_ref, "outputs_sold");

    const q = query(
      coll,
      where("product_ref", "==", product_ref),
      where("disabled", "==", false)
    );

    const outputs = await getDocs(q);

    return outputs;
  } catch (error) {
    console.error("error getting the outputs sold by id");
    console.error(error);

    return undefined;
  }
}

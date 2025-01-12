import { DocumentSnapshot, updateDoc } from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { disableOutput } from "../products/disableOutput";

export async function disableInvoice(invoice: DocumentSnapshot<invoiceType>) {
  await updateDoc(invoice.ref, {
    disabled: true,
  });

  invoice.data()?.products_outputs?.forEach(async (el) => {
    await disableOutput(el);
  });
}

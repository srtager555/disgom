import { DocumentReference, updateDoc } from "firebase/firestore";
import { invoiceType } from "./createInvoice";

export async function paidInvoice(ref: DocumentReference<invoiceType>) {
  await updateDoc(ref, {
    credit: {
      paid: true,
      paid_at: new Date(),
    },
  });
}

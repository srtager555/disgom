import { bill } from "@/components/pages/invoice/Product/closing/Bills";
import { DocumentReference, updateDoc } from "firebase/firestore";
import { invoiceType } from "./createInvoice";

export type closeInvoiceProps = {
  total_sold: number;
  total_cost: number;
  total_proft: number;
  route: number | null;
  bills: Array<bill> | null;
  money: {
    deposit: number;
    cash: number;
  };
};

export async function closeInvoice(
  invoice_ref: DocumentReference<invoiceType>,
  data: closeInvoiceProps
) {
  return await updateDoc(invoice_ref, data);
}

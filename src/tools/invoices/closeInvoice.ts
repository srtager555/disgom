import { bill } from "@/components/pages/invoice/Product/closing/Bills";
import { DocumentReference, updateDoc } from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { credit } from "../sellers/credits/create";

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
  newCredits: Array<DocumentReference<credit>>;
};

export async function closeInvoice(
  invoice_ref: DocumentReference<invoiceType>,
  data: closeInvoiceProps
) {
  return await updateDoc(invoice_ref, {
    route: data.route,
    bills: data.bills,
    money: data.money,
    "total_cost.withInventory": data.total_cost,
    "total_sold.withInventory": data.total_sold,
    "total_profit.withInventory": data.total_proft,
  });
}

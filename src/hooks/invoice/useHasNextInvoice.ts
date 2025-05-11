/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInvoice } from "@/contexts/InvoiceContext";
import { HasInvoice } from "@/pages/invoices/manage";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { PartialWithFieldValue, updateDoc } from "firebase/firestore";
import { useContext, useState } from "react";

export function useHasNextInvoice() {
  // Mantén esta línea como está, el cambio es en la función interna.
  const { setHasInvoice } = useContext(HasInvoice);
  const { invoice } = useInvoice();
  const [map, setMap] = useState<Map<string, boolean>>(new Map());

  async function checkHasNextInvoice(
    fn: any,
    humanChange: boolean,
    product_id: string
  ) {
    const data = invoice?.data();
    if (data?.next_invoice_ref && humanChange) {
      setHasInvoice(true);
      const newMap = new Map(map);
      newMap.set(product_id, true);
      setMap(newMap);

      await updateDoc(data.next_invoice_ref, {
        refresh_data: Object.fromEntries(map),
      } as PartialWithFieldValue<invoiceType>);
    }

    return fn();
  }

  return { checkHasNextInvoice };
}

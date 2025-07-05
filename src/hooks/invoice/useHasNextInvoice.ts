/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInvoice } from "@/contexts/InvoiceContext";
import { HasInvoice } from "@/pages/invoices/manage";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { creditBundle } from "@/tools/sellers/credits/createBundle";
import {
  DocumentSnapshot,
  PartialWithFieldValue,
  runTransaction,
} from "firebase/firestore";
import { useCallback, useContext, useState } from "react";

export function useHasNextInvoice() {
  // Mantén esta línea como está, el cambio es en la función interna.
  const { setHasInvoice } = useContext(HasInvoice);
  const { invoice } = useInvoice();
  const [map, setMap] = useState<Map<string, boolean>>(new Map());

  const checkHasNextInvoice = useCallback(
    (fn: any, humanChange: boolean, product_id: string) => {
      const data = invoice?.data();
      if (data?.next_invoice_ref && humanChange) {
        setHasInvoice(true);
        const newMap = new Map(map);
        newMap.set(product_id, true);
        setMap(newMap);

        runTransaction(
          data.next_invoice_ref.firestore,
          async (transaction) => {
            if (!data.next_invoice_ref) return;

            const doc = await transaction.get(data.next_invoice_ref);

            transaction.update(doc.ref, {
              refresh_data: Object.fromEntries(map),
            } as PartialWithFieldValue<invoiceType>);
          },
          { maxAttempts: 20 }
        );
      }

      return fn();
    },
    [invoice, map, setHasInvoice]
  );

  const checkHasNextInvoiceCreditSection = useCallback(
    async (
      creditBundle: DocumentSnapshot<creditBundle>,
      callback: () => any
    ) => {
      if (creditBundle.data()?.next_bundle) {
        await checkHasNextInvoice(callback, true, creditBundle.id);
      } else {
        await callback();
      }
    },
    [checkHasNextInvoice]
  );

  return { checkHasNextInvoice, checkHasNextInvoiceCreditSection };
}

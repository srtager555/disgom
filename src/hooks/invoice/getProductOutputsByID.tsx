import { useEffect, useState } from "react";
import { useInvoice } from "@/contexts/InvoiceContext";
import { outputType } from "@/tools/products/addOutputs";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { invoiceType } from "@/tools/invoices/createInvoice";

export type DocumentWithTheOutputs = {
  outputs: DocumentReference<outputType>[];
  product_ref: DocumentReference<productDoc>;
  invoice_ref: DocumentReference<invoiceType>;
};

export function useGetProductOutputByID(id: string) {
  const { invoice } = useInvoice();
  const [outputs, setOutputs] = useState<Array<DocumentSnapshot<outputType>>>(
    []
  );

  // effect to check if the outputs are equal
  useEffect(() => {
    if (!invoice) return;
    const ref = doc(
      invoice.ref,
      "outputs",
      id
    ) as DocumentReference<DocumentWithTheOutputs>;

    const unsubscribe = onSnapshot(ref, async (snap) => {
      const data = snap.data();
      if (!data) return;

      const outputs = await Promise.all(
        data.outputs.map(async (ref) => await getDoc(ref))
      );

      setOutputs(outputs);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  return outputs;
}

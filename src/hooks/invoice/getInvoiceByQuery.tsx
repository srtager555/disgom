import { useEffect } from "react";
import { useState } from "react";
import {
  doc,
  DocumentReference,
  getDoc,
  DocumentSnapshot,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { invoiceType } from "@/tools/invoices/createInvoice";
import useQueryParams from "../getQueryParams";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";

export function useGetInvoiceByQuery() {
  const { id } = useQueryParams();
  const [invoice, setInvoice] = useState<
    DocumentSnapshot<invoiceType> | undefined
  >();

  useEffect(() => {
    async function getInvoice() {
      if (!id) return;

      const ref = doc(
        Firestore(),
        InvoiceCollection.root,
        id
      ) as DocumentReference<invoiceType>;

      const invoice = await getDoc(ref);

      setInvoice(invoice);
    }

    getInvoice();
  }, [id]);

  return invoice;
}

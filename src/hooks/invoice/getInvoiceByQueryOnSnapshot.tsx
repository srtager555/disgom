import { useEffect } from "react";
import { useState } from "react";
import {
  onSnapshot,
  doc,
  QueryDocumentSnapshot,
  DocumentReference,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { invoiceType } from "@/tools/invoices/createInvoice";
import useQueryParams from "../getQueryParams";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { isEqual } from "lodash";

export function useGetInvoiceByQueryOnSnapshot() {
  const { id } = useQueryParams();
  const [invoice, setInvoice] = useState<
    QueryDocumentSnapshot<invoiceType> | undefined
  >();

  useEffect(() => {
    if (!id) return;

    const ref = doc(
      Firestore(),
      InvoiceCollection.root,
      id
    ) as DocumentReference<invoiceType>;

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        if (isEqual(invoice, snap)) return;

        setInvoice(snap);
      } else {
        setInvoice(undefined);
      }
    });

    return () => unsubscribe();
  }, [id]);

  return invoice;
}

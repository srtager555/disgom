import { useEffect, useMemo, useRef, useState } from "react";
import { outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { isEqual } from "lodash";

export function useGetProductOutputs(
  ref: DocumentReference<productDoc> | undefined
) {
  const [invoices, setInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);
  const [outputs, setOutputs] = useState<
    Array<QueryDocumentSnapshot<outputType>>
  >([]);
  const last_ref_id = useRef("");
  const last_invoices_id = useRef<string[]>([]);
  const refID = useMemo(() => ref?.id, [ref]);

  // effect to get the invoices from 2 weeks
  useEffect(() => {
    console.log("get invoices");

    async function getInvoices() {
      if (!ref) return;

      console.log("Entrado a obtener los invoices");
      console.log(ref.id, last_ref_id.current);
      if (ref.id === last_ref_id.current) return;
      last_ref_id.current = ref.id;

      const coll = collection(
        ref.firestore,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType>;
      const now = new Date();
      const _14DaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      console.log("El rango es", now, _14DaysAgo);

      const q = query(
        coll,
        where("disabled", "==", false),
        where("created_at", ">=", _14DaysAgo),
        where("created_at", "<=", now)
      );

      const invoicesQuery = await getDocs(q);
      console.log("los invoices", invoicesQuery.docs);
      setInvoices(invoicesQuery.docs);
    }

    getInvoices();
  }, [refID]);

  // effect to get the outputs sold with the same product_ref from the invoices
  useEffect(() => {
    console.log("get outputs");
    async function getOutputsSolds() {
      if (!invoices.length) return;

      const newsIDS = invoices.map((_) => _.ref.id).sort();
      if (isEqual(newsIDS, last_invoices_id.current)) return;
      last_invoices_id.current = newsIDS;

      invoices.forEach(async (invoice) => {
        const coll = collection(
          invoice.ref,
          InvoiceCollection.outputs_sold
        ) as CollectionReference<outputType>;

        const q = query(
          coll,
          where("disabled", "==", false),
          where("product_ref", "==", ref)
        );

        const outputsQuery = await getDocs(q);

        setOutputs((prev) => [...prev, ...outputsQuery.docs]);
      });
    }

    getOutputsSolds();

    return () => {
      setOutputs([]);
    };
  }, [invoices]);

  return outputs;
}

import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  collection,
  CollectionReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { InvoiceContainer, InvoicePreview } from "../InvoicePreview";

export function OverDueInvoicesList() {
  const [overdueInvoices, setOverdueInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);

  // Effect to get the overdue invoices
  useEffect(() => {
    async function getOverdueInvoices() {
      const db = Firestore();
      const coll = collection(
        db,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType> as CollectionReference<invoiceType>;

      const q = query(
        coll,
        where("credit.due_date", "<=", new Date()),
        where("credit.paid", "==", false),
        where("disabled", "==", false)
      );
      const snap = await getDocs(q);

      setOverdueInvoices(snap.docs);
    }

    getOverdueInvoices();
  }, []);

  return (
    <Container styles={{ marginBottom: "20px" }}>
      {overdueInvoices.length === 0 ? (
        <>
          <h2>No hay Facturas vencidas</h2>
        </>
      ) : (
        <>
          <h2>Facturas vencidas</h2>
          <InvoiceContainer>
            {overdueInvoices.length > 0 ? (
              overdueInvoices.map((doc, i) => {
                return <InvoicePreview key={i} doc={doc} />;
              })
            ) : (
              <p>Todo en orden</p>
            )}
          </InvoiceContainer>
        </>
      )}
    </Container>
  );
}

import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  collection,
  CollectionReference,
  query,
  where,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { InvoiceContainer, InvoicePreview } from "../InvoicePreview";

export function OutdatedInvoicesList() {
  const [outdatedInvoices, setOutdatedInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);

  useEffect(() => {
    async function getInvoicesWithRefreshData() {
      const db = Firestore();
      const coll = collection(
        db,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType> as CollectionReference<invoiceType>;

      const q = query(
        coll,
        where("refresh_data", "!=", null),
        where("disabled", "==", false)
      );
      const snap = await getDocs(q);

      setOutdatedInvoices(snap.docs);
    }

    getInvoicesWithRefreshData();
  }, []);

  return (
    <Container>
      {outdatedInvoices.length === 0 ? (
        <h2>No hay Facturas que necesitan revisión</h2>
      ) : (
        <>
          <h2>Facturas que necesitan revisión</h2>
          <InvoiceContainer unlimited>
            {outdatedInvoices.map((doc, i) => {
              return <InvoicePreview key={i} doc={doc} />;
            })}
          </InvoiceContainer>
        </>
      )}
    </Container>
  );
}

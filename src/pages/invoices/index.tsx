import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import {
  InvoiceContainer,
  InvoicePreview,
} from "@/components/pages/invoice/InvoicePreview";
import { NextPageWithLayout } from "@/pages/_app";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  collection,
  CollectionReference,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

const Page: NextPageWithLayout = () => {
  const [docsInvoices, setDocsInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);

  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      InvoiceCollection.root
    ) as CollectionReference<invoiceType>;

    const date = new Date();
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeInTimestamp = Timestamp.fromDate(today);

    const q = query(coll, where("created_at", ">=", timeInTimestamp));
    const unsubcribe = onSnapshot(q, (snap) => {
      const invoices = snap.docs;
      setDocsInvoices(invoices);
    });

    return unsubcribe;
  }, []);

  return (
    <Container>
      {docsInvoices.length === 0 ? (
        <h2>No hay faturas para hoy</h2>
      ) : (
        <InvoiceContainer>
          {docsInvoices.map((el, i) => {
            return <InvoicePreview key={i} doc={el} />;
          })}
        </InvoiceContainer>
      )}
    </Container>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;

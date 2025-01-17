import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import {
  InvoiceContainer,
  InvoicePreview,
} from "@/components/pages/invoice/InvoicePreview";
import { Input } from "@/components/pages/invoice/Product";
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
  const [date, setDate] = useState("");

  useEffect(() => {
    const db = Firestore();
    const coll = collection(
      db,
      InvoiceCollection.root
    ) as CollectionReference<invoiceType>;

    const [year, month, day] = date.split("-").map(Number);

    const dateee = new Date(
      date != "" ? new Date(year, month - 1, day) : new Date()
    );

    const today = new Date(
      dateee.getFullYear(),
      dateee.getMonth(),
      dateee.getDate()
    );
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);

    const timeInTimestamp = Timestamp.fromDate(today);
    const timeInTimestampNextDay = Timestamp.fromDate(nextDay);

    const q = query(
      coll,
      where("created_at", ">=", timeInTimestamp),
      where("created_at", "<", timeInTimestampNextDay)
    );
    const unsubcribe = onSnapshot(q, (snap) => {
      const invoices = snap.docs;
      setDocsInvoices(invoices);
    });

    return unsubcribe;
  }, [date]);

  return (
    <Container>
      <Container styles={{ display: "inline-block", marginBottom: "20px" }}>
        <Input
          type="date"
          onChange={(e) => {
            setDate(e.target.value);
          }}
        />
      </Container>
      {docsInvoices.length === 0 && date === "" ? (
        <h2>No hay faturas para hoy</h2>
      ) : docsInvoices.length === 0 && date != "" ? (
        <h2>No se encontraron facturas para el {date}</h2>
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

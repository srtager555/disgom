import { Container } from "@/styles/index.styles";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  QueryDocumentSnapshot,
  collection,
  CollectionReference,
  Timestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { InvoiceContainer, InvoicePreview } from "../InvoicePreview";
import { Input } from "../Product";
import { Firestore } from "@/tools/firestore";

export function InvoicesList() {
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
      where("created_at", "<", timeInTimestampNextDay),
      where("disabled", "==", false)
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
        <h2>No se han hecho Facturas hoy</h2>
      ) : docsInvoices.length === 0 && date != "" ? (
        <h2>No se encontraron facturas para el {date}</h2>
      ) : (
        <>
          <h2>Facturas hechas {date ? `el ${date}` : "hoy"}</h2>
          <InvoiceContainer>
            {docsInvoices.map((el, i) => {
              return <InvoicePreview key={i} doc={el} />;
            })}
          </InvoiceContainer>
        </>
      )}
    </Container>
  );
}

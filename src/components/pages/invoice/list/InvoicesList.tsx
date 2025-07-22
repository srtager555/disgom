import { Container, FlexContainer } from "@/styles/index.styles";
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
import styled from "styled-components";
import { numberParser } from "@/tools/numberPaser";
import { useRouter } from "next/router";
import { useInvoiceIDManager } from "@/hooks/offline/InvoiceIDManager";

const InvoicesListInfo = styled(FlexContainer)`
  font-size: 1.2rem;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  & > span {
    word-wrap: nowrap;
  }
`;

const GreenSpan = styled.span`
  font-weight: bold;
  color: green;
`;

export function InvoicesList() {
  const [docsInvoices, setDocsInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);
  const [date, setDate] = useState("");
  const [totalSold, setTotalSold] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [median, setMedian] = useState(0);
  const router = useRouter();
  const { openTheNewestInvoice, setOpenTheNewestInvoice, setInvoiceID } =
    useInvoiceIDManager();

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
      setDocsInvoices(
        invoices.sort(
          (a, b) =>
            (b.data().created_at?.seconds || 0) -
            (a.data().created_at?.seconds || 0)
        )
      );
      const totalSoldList = invoices.map((el) => el.data().total_sold);
      const totalSold = invoices.reduce(
        (acc, cur) => acc + cur.data().total_sold,
        0
      );

      setTotalSold(totalSold);
      setTotalProfit(
        invoices.reduce((acc, cur) => acc + cur.data().total_proft, 0)
      );

      // La mediana es 0 porque no hay facturas
      if (totalSoldList.length === 0) {
        setMedian(0);
        return;
      }

      const mitad = Math.floor(totalSoldList.length / 2);

      if (totalSoldList.length % 2 === 0) {
        // Promedia los dos del centro
        setMedian((totalSoldList[mitad - 1] + totalSoldList[mitad]) / 2);
      } else {
        // Devuelve el central
        setMedian(totalSoldList[mitad]);
      }
    });

    return () => {
      unsubcribe();
      setDocsInvoices([]);
      setTotalSold(0);
      setTotalProfit(0);
      setMedian(0);
    };
  }, [date]);

  // effect to open the newest invoice from docsInvoices
  useEffect(() => {
    if (docsInvoices.length === 0) return;

    const newestInvoice = docsInvoices[0];

    if (newestInvoice && openTheNewestInvoice) {
      setInvoiceID(newestInvoice.id);
      setOpenTheNewestInvoice(false);

      router.push(`/invoices/manage`);
    }
  }, [docsInvoices]);

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
          <InvoicesListInfo>
            <span>
              {docsInvoices.length}{" "}
              {docsInvoices.length > 1 ? "Facturas" : "Factura"}
            </span>
            |
            <span>
              Total Vendido{" "}
              <GreenSpan>{numberParser(totalSold, true)}</GreenSpan>
            </span>{" "}
            |
            <span>
              Ganancia Total{" "}
              <GreenSpan>{numberParser(totalProfit, true)}</GreenSpan>
            </span>{" "}
            |
            <span>
              Mayor venta{" "}
              <GreenSpan>
                {numberParser(docsInvoices[0].data().total_sold, true)}
              </GreenSpan>
            </span>
            |
            <span>
              Menor venta{" "}
              <GreenSpan>
                {numberParser(
                  docsInvoices[docsInvoices.length - 1].data().total_sold,
                  true
                )}
              </GreenSpan>
            </span>{" "}
            |
            <span>
              Mediana de la venta{" "}
              <GreenSpan>{numberParser(median, true)}</GreenSpan>
            </span>
          </InvoicesListInfo>
          <InvoiceContainer unlimited>
            {docsInvoices.map((el, i) => {
              return <InvoicePreview key={i} doc={el} />;
            })}
          </InvoiceContainer>
        </>
      )}
    </Container>
  );
}

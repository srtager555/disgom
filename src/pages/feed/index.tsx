import { Container, FlexContainer } from "@/styles/index.styles";
import type { NextPageWithLayout } from "../_app";
import SalesComparisonChart, { ChartData } from "@/components/chart";
import { useEffect, useState } from "react";
import { Firestore } from "@/tools/firestore";
import {
  collection,
  CollectionReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { getCurrentMonthRange } from "@/tools/time/current";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import styled from "styled-components";

const WarnsContainer = styled(Container)`
  width: 100%;
`;

const Feed: NextPageWithLayout = () => {
  const [chartData, setChartData] = useState<ChartData>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);

  // effect to get the sales
  useEffect(() => {
    async function getSales() {
      const db = Firestore();
      const coll = collection(
        db,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType>;
      const range = getCurrentMonthRange(new Date(), 2);
      console.log(range);

      const q = query(
        coll,
        where("disabled", "==", false),
        where("created_at", "<=", range.end),
        where("created_at", ">=", range.start)
      );

      const snap = await getDocs(q);

      console.log("invoices", snap.docs);

      const data = snap.docs.map((doc) => {
        return {
          createdAt: doc.data().created_at?.toDate() as Date,
          amount: Number(doc.data().total_sold.toFixed(2)),
        };
      });
      console.log(data);

      setChartData(data);
    }

    getSales();
  }, []);

  // Effect to get the overdue invoices
  useEffect(() => {
    async function getOverdueInvoices() {
      const db = Firestore();
      const coll = collection(
        db,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType> as CollectionReference<invoiceType>;

      const q = query(coll, where("credit.paid", "==", false));
      const docs = getDocs(q);

      setOverdueInvoices(docs);
    }

    getOverdueInvoices();
  }, []);

  return (
    <Container styles={{ maxWidth: "1500px", marginTop: "30px" }}>
      <h1 style={{ textAlign: "center" }}>Ventas del mes</h1>

      <Container styles={{ marginBottom: "30px" }}>
        <SalesComparisonChart
          invoiceDataToChart={chartData}
          numberOfDaysToShow={30}
        />
      </Container>

      <FlexContainer styles={{ justifyContent: "space-between", gap: "10px" }}>
        <WarnsContainer>
          <h2>Facturas vencidas</h2>
          <Container>
            {overdueInvoices.length > 0 ? (
              overdueInvoices.map((doc, i) => {
                const data = doc.data();
                return <Container key={i}></Container>;
              })
            ) : (
              <p>Todo en orden</p>
            )}
          </Container>
        </WarnsContainer>
        <WarnsContainer>
          <h2>Facturas que necesitan revisión</h2>
          <Container>
            <p>Todo en orden</p>
          </Container>
        </WarnsContainer>
      </FlexContainer>

      <p>There is the Feed</p>
    </Container>
  );
};

export default Feed;

export function OverdueInvoicePreview() {}

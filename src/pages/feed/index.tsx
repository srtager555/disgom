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
import {
  InvoiceContainer,
  InvoicePreview,
} from "@/components/pages/invoice/InvoicePreview";
import { numberParser } from "@/tools/numberPaser";

const WarnsContainer = styled(Container)`
  width: 50%;
`;

export const ExtraDataContainer = styled(Container)`
  max-width: 33%;
  width: 100%;
`;

const Feed: NextPageWithLayout = () => {
  const [chartData, setChartData] = useState<ChartData>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<
    QueryDocumentSnapshot<invoiceType>[]
  >([]);
  const [maxSale, setMaxSale] = useState<{
    date: string;
    amount: number;
  } | null>(null);
  const [minSale, setMinSale] = useState<{
    date: string;
    amount: number;
  } | null>(null);
  const [avgSale, setAvgSale] = useState<number | null>(null);

  const [invoicesRefreshData, setInvoiceRefreshData] = useState<
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

      const q = query(
        coll,
        where("disabled", "==", false),
        where("created_at", "<=", range.end),
        where("created_at", ">=", range.start)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => {
        return {
          createdAt: doc.data().created_at?.toDate() as Date,
          amount: Number(doc.data().total_sold.toFixed(2)),
        };
      });

      setChartData(data);

      if (data.length > 0) {
        let max = data[0];
        let min = data[0];
        let sum = 0;

        data.forEach((item) => {
          if (item.amount > max.amount) {
            max = item;
          }
          if (item.amount < min.amount) {
            min = item;
          }
          sum += item.amount;
        });

        const average = sum / data.length;

        setMaxSale({
          date: max.createdAt.toLocaleDateString(),
          amount: max.amount,
        });
        setMinSale({
          date: min.createdAt.toLocaleDateString(),
          amount: min.amount,
        });
        setAvgSale(average);
      } else {
        setMaxSale(null);
        setMinSale(null);
        setAvgSale(null);
      }
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

  // Effect to get the overdue invoices
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

      setInvoiceRefreshData(snap.docs);
    }

    getInvoicesWithRefreshData();
  }, []);

  return (
    <Container
      styles={{ maxWidth: "1500px", marginTop: "30px", marginBottom: "60px" }}
    >
      <h1 style={{ textAlign: "center" }}>Ventas del mes</h1>

      <FlexContainer styles={{ gap: "10px", marginBottom: "20px" }}>
        <ExtraDataContainer>
          {maxSale ? (
            <>
              El {maxSale.date} se hizo la venta máxima de este mes con un total
              de <b>{numberParser(maxSale.amount)}</b>
            </>
          ) : (
            "No hay datos de ventas para mostrar el máximo."
          )}
        </ExtraDataContainer>
        <ExtraDataContainer>
          {minSale ? (
            <>
              El {minSale.date} se hizo la venta mínima de este mes con un total
              de <b>{numberParser(minSale.amount)}</b>
            </>
          ) : (
            "No hay datos de ventas para mostrar el mínimo."
          )}
        </ExtraDataContainer>
        <ExtraDataContainer>
          {avgSale !== null ? (
            <>
              La media de ventas es de <b>{numberParser(avgSale)}</b>
            </>
          ) : (
            "No hay datos de ventas para calcular la media."
          )}
        </ExtraDataContainer>
      </FlexContainer>

      <Container styles={{ marginBottom: "30px" }}>
        <SalesComparisonChart
          invoiceDataToChart={chartData}
          numberOfDaysToShow={30}
        />
      </Container>

      <FlexContainer styles={{ justifyContent: "space-between", gap: "10px" }}>
        <WarnsContainer>
          <h2>Facturas vencidas</h2>
          <InvoiceContainer small>
            {overdueInvoices.length > 0 ? (
              overdueInvoices.map((doc, i) => {
                return <InvoicePreview key={i} doc={doc} />;
              })
            ) : (
              <p>Todo en orden</p>
            )}
          </InvoiceContainer>
        </WarnsContainer>
        <WarnsContainer>
          <h2>Facturas que necesitan revisión</h2>
          <InvoiceContainer small>
            {invoicesRefreshData.length > 0 ? (
              invoicesRefreshData.map((doc, i) => {
                return <InvoicePreview key={i} doc={doc} />;
              })
            ) : (
              <p>Todo en orden</p>
            )}
          </InvoiceContainer>
        </WarnsContainer>
      </FlexContainer>
    </Container>
  );
};

export default Feed;

// export function OverdueInvoicePreview() {

//   return <InvoicePreview
// }

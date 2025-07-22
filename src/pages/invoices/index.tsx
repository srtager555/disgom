import { FirestoreSalesChart } from "@/components/chart/FirestoreSalesChart";
import { ProcessedData } from "@/components/chart/FirestoreSalesChart/types";
import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import { InvoicesList } from "@/components/pages/invoice/list/InvoicesList";
import { OutdatedInvoicesList } from "@/components/pages/invoice/list/outdatedInvoicesList";
import { OverDueInvoicesList } from "@/components/pages/invoice/list/OverDueInvoices";
import { NextPageWithLayout } from "@/pages/_app";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import {
  collection,
  DocumentData,
  Query,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}

const Page: NextPageWithLayout = () => {
  const [queryToChart, setQueryToChart] = useState<Query<DocumentData>>();
  const [dataFetched, setDataFetched] = useState<ProcessedData | null>(null);

  useEffect(() => {
    console.log("Data processed", dataFetched);
  }, [dataFetched]);

  useEffect(() => {
    const db = Firestore();

    const coll = collection(db, InvoiceCollection.root);
    const q = query(coll, where("disabled", "==", false));

    console.log("the query", q);

    setQueryToChart(q);
  }, []);

  return (
    <FlexContainer styles={{ flexDirection: "column", gap: "20px" }}>
      <InvoicesList />
      <OverDueInvoicesList />
      <OutdatedInvoicesList />
      {queryToChart && (
        <Container styles={{ margin: "20px" }}>
          <h2>Consulte las ventas en el tiempo</h2>
          <FirestoreSalesChart
            queryOrCollection={queryToChart}
            setDataUsed={setDataFetched}
            fieldToSum="total_sold"
          />
        </Container>
      )}
    </FlexContainer>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;

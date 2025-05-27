import //  SalesComparisonChart,
// ChartData,
"@/components/chart";
// import { ExtraDataContainer } from "@/pages/feed";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
// import { numberParser } from "@/tools/numberPaser";
import { SellersDoc } from "@/tools/sellers/create";
// import { getCurrentTwoWeekRange } from "@/tools/time/current";
import {
  collection,
  CollectionReference,
  query,
  where,
  getDocs,
  orderBy,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Query,
  limit,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { InvoiceContainer, InvoicePreview } from "../invoice/InvoicePreview";
import { client } from "@/tools/sellers/createClient";

interface props {
  sellerDoc: DocumentSnapshot<SellersDoc> | undefined;
  clientDoc: DocumentSnapshot<client> | undefined;
}

export function SellerChart({ sellerDoc, clientDoc }: props) {
  const [invoicesDocs, setInvoicesDocs] =
    useState<QueryDocumentSnapshot<invoiceType>[]>();
  // const [chartData, setChartData] = useState<ChartData>([]);
  // const [maxSale, setMaxSale] = useState<{
  //   date: string;
  //   amount: number;
  // } | null>(null);
  // const [minSale, setMinSale] = useState<{
  //   date: string;
  //   amount: number;
  // } | null>(null);
  // const [avgSale, setAvgSale] = useState<number | null>(null);

  // effecto to get the invoice
  useEffect(() => {
    async function getInvoices() {
      if (!sellerDoc && !clientDoc) return;
      const db = Firestore();
      const coll = collection(
        db,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType>;
      // const range = getCurrentTwoWeekRange(new Date());
      let q;

      if (sellerDoc && !clientDoc) {
        q = query(
          coll,
          orderBy("created_at", "desc"),
          // where("created_at", ">=", range.start),
          // where("created_at", "<=", range.end),
          where("disabled", "==", false),
          where("seller_ref", "==", sellerDoc.ref),
          limit(15)
        );
      } else if (clientDoc && sellerDoc) {
        q = query(
          coll,
          orderBy("created_at", "desc"),
          // where("created_at", ">=", range.start),
          // where("created_at", "<=", range.end),
          where("disabled", "==", false),
          where("seller_ref", "==", sellerDoc.ref),
          where("client_ref", "==", clientDoc.ref),
          limit(15)
        );
      }

      console.log("client ready?", clientDoc);

      const invoices = await getDocs(q as Query<invoiceType>);

      setInvoicesDocs(invoices.docs);
      // const data: ChartData = invoices.docs.map((el) => {
      //   const data = el.data();
      //   return {
      //     createdAt: data.created_at?.toDate() as Date,
      //     amount: Number(data.total_sold.toFixed(2)),
      //   };
      // });

      // setChartData(data);

      // if (data.length > 0) {
      //   let max = data[0];
      //   let min = data[0];
      //   let sum = 0;

      //   data.forEach((item) => {
      //     if (item.amount > max.amount) {
      //       max = item;
      //     }
      //     if (item.amount < min.amount) {
      //       min = item;
      //     }
      //     sum += item.amount;
      //   });

      //   const average = sum / data.length;

      //   setMaxSale({
      //     date: max.createdAt.toLocaleDateString(),
      //     amount: max.amount,
      //   });
      //   setMinSale({
      //     date: min.createdAt.toLocaleDateString(),
      //     amount: min.amount,
      //   });
      //   setAvgSale(average);
      // } else {
      //   setMaxSale(null);
      //   setMinSale(null);
      //   setAvgSale(null);
      // }
    }
    getInvoices();

    return () => {
      setInvoicesDocs(undefined);
    };
  }, [sellerDoc, clientDoc]);

  return (
    <FlexContainer
      styles={{
        marginRight: "20px",
        width: "100%",
        minWidth: "1100px",
        marginBottom: "30px",
      }}
    >
      {/* <Container styles={{ width: "60%" }}>
        <h2 style={{ textAlign: "center" }}>Ventas de las ultimas 2 semanas</h2>
        <FlexContainer styles={{ gap: "10px", marginBottom: "20px" }}>
          <ExtraDataContainer>
            {maxSale ? (
              <>
                El {maxSale.date} se hizo la venta máxima de este mes con un
                total de <b>{numberParser(maxSale.amount)}</b>
              </>
            ) : (
              "No hay datos de ventas para mostrar el máximo."
            )}
          </ExtraDataContainer>
          <ExtraDataContainer>
            {minSale ? (
              <>
                El {minSale.date} se hizo la venta mínima de este mes con un
                total de <b>{numberParser(minSale.amount)}</b>
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
        <SalesComparisonChart invoiceDataToChart={chartData} />
      </Container> */}
      <Container styles={{ marginBottom: "100px", width: "100%" }}>
        <h2 style={{ textAlign: "center" }}>Facturas</h2>
        {invoicesDocs && invoicesDocs?.length > 0 ? (
          <InvoiceContainer unlimited>
            {invoicesDocs?.map((el, i) => {
              return <InvoicePreview key={i} doc={el} inSeller />;
            })}
          </InvoiceContainer>
        ) : (
          <p style={{ textAlign: "center" }}>No hay facturas</p>
        )}
      </Container>
    </FlexContainer>
  );
}

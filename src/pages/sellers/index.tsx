import SalesComparisonChart, { ChartData } from "@/components/chart";
import { SellersLayout } from "@/components/layouts/sellers/Sellers.layout";
import { SellersList } from "@/components/layouts/sellers/SellersList.layout";
import {
  InvoiceContainer,
  InvoicePreview,
} from "@/components/pages/invoice/InvoicePreview";
import useQueryParams from "@/hooks/getQueryParams";
import { NextPageWithLayout } from "@/pages/_app";
import { globalCSSVars } from "@/styles/colors";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import {
  InvoiceCollection,
  SellersCollection,
} from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { numberParser } from "@/tools/numberPaser";
import { SellersDoc } from "@/tools/sellers/create";
import { clientCredit, credit } from "@/tools/sellers/credits/create";
import { getClientCredits, getCredits } from "@/tools/sellers/credits/get";
import { getCurrentTwoWeekRange } from "@/tools/time/current";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ExtraDataContainer } from "../feed";

const Page: NextPageWithLayout = () => {
  const { id } = useQueryParams();
  const [sellerDoc, setSellerDoc] = useState<DocumentSnapshot<SellersDoc>>();
  const [invoicesDocs, setInvoicesDocs] =
    useState<QueryDocumentSnapshot<invoiceType>[]>();
  const [clientsWithCredits, setClientsWithCredits] =
    useState<QueryDocumentSnapshot<clientCredit>[]>();
  const [creditAmount, setCreditAmount] = useState<number[]>([]);
  const [creditTotal, setCreditTotal] = useState(0);
  const [chartData, setChartData] = useState<ChartData>([]);
  const [maxSale, setMaxSale] = useState<{
    date: string;
    amount: number;
  } | null>(null);
  const [minSale, setMinSale] = useState<{
    date: string;
    amount: number;
  } | null>(null);
  const [avgSale, setAvgSale] = useState<number | null>(null);

  // effect to get the seller
  useEffect(() => {
    async function getSeller() {
      if (!id) return;

      const db = Firestore();
      const docRef = doc(
        db,
        SellersCollection.root,
        id
      ) as DocumentReference<SellersDoc>;

      const sellerDoc = await getDoc(docRef);
      setSellerDoc(sellerDoc);
    }

    getSeller();
  }, [id]);

  // effecto to get the invoice
  useEffect(() => {
    async function getInvoices() {
      if (!sellerDoc) return;
      const db = Firestore();
      const coll = collection(
        db,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType>;
      const range = getCurrentTwoWeekRange(new Date());

      const q = query(
        coll,
        orderBy("created_at", "desc"),
        where("seller_ref", "==", sellerDoc.ref),
        where("created_at", ">=", range.start),
        where("created_at", "<=", range.end),
        where("disabled", "==", false)
      );
      const invoices = await getDocs(q);

      setInvoicesDocs(invoices.docs);
      const data: ChartData = invoices.docs.map((el) => {
        const data = el.data();
        return {
          createdAt: data.created_at?.toDate() as Date,
          amount: data.total_sold,
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
    getInvoices();
  }, [sellerDoc]);

  useEffect(() => {
    async function getClientsWithCredit() {
      if (!sellerDoc) return;
      const clientsWithCredit = await getCredits(0, sellerDoc?.ref, true);
      setClientsWithCredits(clientsWithCredit.docs);
    }

    getClientsWithCredit();
  }, [sellerDoc]);

  useEffect(() => {
    const total = creditAmount.reduce((a, b) => a + b, 0);
    setCreditTotal(total);
  }, [creditAmount]);

  if (!id) return <></>;

  return (
    <Container>
      <FlexContainer>
        <Container styles={{ marginRight: "20px", width: "60%" }}>
          <h2>Ventas de las ultimas 2 semanas</h2>
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
        </Container>

        <Container styles={{ marginRight: "20px", width: "40%" }}>
          <h2>Facturas</h2>
          <InvoiceContainer small>
            {invoicesDocs?.map((el, i) => {
              return <InvoicePreview key={i} doc={el} inSeller />;
            })}
          </InvoiceContainer>
        </Container>
      </FlexContainer>
      <FlexContainer styles={{ justifyContent: "space-between" }}>
        <Container>
          <FlexContainer styles={{ justifyContent: "space-between" }}>
            <h2>Creditos</h2>
            <h2>Total</h2>
          </FlexContainer>
          <Container>
            {clientsWithCredits?.map((el, i) => {
              return (
                <CreditPreview
                  key={i}
                  doc={el}
                  setCreditAmount={setCreditAmount}
                />
              );
            })}
          </Container>
          <FlexContainer styles={{ justifyContent: "flex-end" }}>
            <span>{numberParser(creditTotal)}</span>
          </FlexContainer>
        </Container>
      </FlexContainer>
    </Container>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return (
    <SellersLayout>
      {page}
      <SellersList />
    </SellersLayout>
  );
};

export default Page;

function CreditPreview({
  doc,
  setCreditAmount,
}: {
  doc: QueryDocumentSnapshot<clientCredit>;
  setCreditAmount: Dispatch<SetStateAction<Array<number>>>;
}) {
  const data = useMemo(() => doc.data(), [doc]);
  const [lasstCredit, setLasstCredit] = useState<credit>();

  useEffect(() => {
    async function getLastCredit() {
      const latCredit = await getClientCredits(doc);
      const creditData = latCredit?.data();
      if (!creditData) return;

      setLasstCredit(creditData);
      setCreditAmount((props) => [...props, creditData.amount]);
    }

    getLastCredit();
  }, [doc, setCreditAmount]);

  if (!lasstCredit) return <>Cargando...</>;
  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        width: "350px",
        paddingBottom: "10px",
        marginBottom: "10px",
        borderBottom: "1px solid " + globalCSSVars["--detail"],
      }}
    >
      <Container>
        <h3 style={{ margin: "0" }}>{data.name}</h3>
        <small>{data.address}</small>
      </Container>
      {numberParser(lasstCredit?.amount)}
    </FlexContainer>
  );
}

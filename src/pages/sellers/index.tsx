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
import { getClientCredits } from "@/tools/sellers/credits/get";
import { getCurrentTwoWeekRange } from "@/tools/time/current";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ExtraDataContainer } from "../feed";
import { Input } from "@/components/pages/invoice/Product";
import { debounce } from "lodash";

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
          amount: Number(data.total_sold.toFixed(2)),
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
      const creditColl = collection(
        sellerDoc.ref,
        SellersCollection.credits
      ) as CollectionReference<clientCredit>;

      const unsubcribe = onSnapshot(creditColl, (snap) => {
        console.log(snap.docs);
        setClientsWithCredits(snap.docs);
      });

      return () => unsubcribe();
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
      <FlexContainer styles={{ marginBottom: "30px" }}>
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

        <FlexContainer
          styles={{
            marginRight: "20px",
            width: "40%",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Container styles={{ marginBottom: "100px" }}>
            <h2>Facturas</h2>
            <InvoiceContainer small>
              {invoicesDocs?.map((el, i) => {
                return <InvoicePreview key={i} doc={el} inSeller />;
              })}
            </InvoiceContainer>
          </Container>
          <FlexContainer styles={{ justifyContent: "space-between" }}>
            <Container>
              <FlexContainer
                styles={{ justifyContent: "space-between", marginTop: "10px" }}
              >
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
        </FlexContainer>
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
  const initialData = useMemo(() => doc.data(), [doc]);
  const [clientName, setClientName] = useState(initialData.name);
  const [clientAddress, setClientAddress] = useState(initialData.address);
  const [lasstCredit, setLasstCredit] = useState<credit>();

  useEffect(() => {
    async function getLastCredit() {
      const lastCredit = await getClientCredits(doc.ref);
      const creditData = lastCredit?.data();
      if (!creditData) return;

      setLasstCredit(creditData);
      setCreditAmount((props) => [...props, creditData.amount]);
    }

    getLastCredit();
  }, [doc, setCreditAmount]);

  // Effect to update the client name in Firestore
  useEffect(() => {
    async function updateName() {
      // Only update if the name has changed from the initial data
      if (clientName !== initialData.name) {
        // Debounce this update in a real application to avoid excessive writes
        // For simplicity, we'll update directly here, but debouncing is recommended.
        await updateDoc(doc.ref, {
          name: clientName,
        }).catch(console.error); // Add error handling
      }
    }

    updateName();
  }, [clientName, doc.ref, initialData.name]); // Depend on clientName and doc.ref

  // Debounced function to update address
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateAddress = useCallback(
    debounce(async (newAddress: string) => {
      if (newAddress !== initialData.address) {
        console.log("Updating address in Firestore:", newAddress);
        await updateDoc(doc.ref, {
          address: newAddress,
        }).catch(console.error);
      }
    }, 3000), // 3000ms = 3 seconds
    [doc.ref, initialData.address] // Dependencies for useCallback
  );

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setClientAddress(e.target.value);
    debouncedUpdateAddress(e.target.value);
  };

  if (!lasstCredit) return <>Cargando...</>;
  return (
    <FlexContainer
      styles={{
        justifyContent: "space-between",
        width: "400px",
        paddingBottom: "10px",
        marginBottom: "10px",
        borderBottom: "1px solid " + globalCSSVars["--detail"],
      }}
    >
      <FlexContainer
        styles={{ width: "100%", maxWidth: "300px", flexDirection: "column" }}
      >
        <Container>
          <Input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ padding: "5px" }} // Style to look like h3
          />
        </Container>

        <textarea
          value={clientAddress === "not provided" ? "" : clientAddress} // Handle "not provided" for placeholder effect
          onChange={handleAddressChange}
          placeholder="Dirección"
          rows={2}
          style={{
            fontSize: "1rem",
            marginTop: "5px",
            width: "100%",
            padding: "5px",
          }} // Style to look like small
        />
      </FlexContainer>
      <span>{numberParser(lasstCredit?.amount)}</span>
    </FlexContainer>
  );
}

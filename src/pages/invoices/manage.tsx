import { Products } from "@/components/pages/invoice/manage/products";
import { SelectSeller } from "@/components/pages/invoice/manage/SelectSeller";
import { Close } from "@/components/pages/invoice/manage/Closing";
import { productResult } from "@/components/pages/invoice/ProductList";
import { SelectClient } from "@/components/pages/invoice/SelectClient";
import useQueryParams from "@/hooks/getQueryParams";
import { useInvoice, InvoiceProvider } from "@/contexts/InvoiceContext";
import { Container, FlexContainer } from "@/styles/index.styles";
import { createInvoice, invoiceType } from "@/tools/invoices/createInvoice";
import { updateInvoice } from "@/tools/invoices/updateInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useMemo, useCallback } from "react"; // Import useCallback
import styled from "styled-components";
import { useProductResults } from "@/hooks/useProductResults";
import { InvoiceTotals } from "@/components/pages/invoice/manage/InvoiceTotals";
import { isEqual, debounce } from "lodash"; // Import debounce
import { Credit } from "@/components/pages/invoice/manage/credit";
import { ClientCredit } from "@/components/pages/invoice/manage/ClientCredit";
import { Preliminar } from "@/components/pages/invoice/manage/Preliminar";
import { Button } from "@/styles/Form.styles";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";

export type rawCreditResult = Record<string, number>;

const MainContainer = styled(FlexContainer)`
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
`;

function InvoiceManager() {
  const { id, sellerId } = useQueryParams();
  const router = useRouter();
  const { invoice } = useInvoice();
  const [selectedSeller, setSelectedSeller] = useState<
    QueryDocumentSnapshot<SellersDoc> | undefined
  >(undefined);

  const [productsResults, setProductsResults] = useState<
    Record<string, productResult>
  >({});
  const prevProductsResultsRef = useRef<Record<string, productResult>>({});
  const [rawCreditResult, setRawCreditResult] = useState<rawCreditResult>({});
  const creditResult = useMemo(() => {
    return Object.values(rawCreditResult).reduce(
      (before, now) => before + now,
      0
    );
  }, [rawCreditResult]);

  const { totalResults, calculateResults } = useProductResults();

  // this effect is to create an invoice when select the seller
  useEffect(() => {
    async function createInvo() {
      console.log(sellerId, id, selectedSeller?.data().name);

      let invoiceCreated: DocumentReference<invoiceType>;
      if (!sellerId) {
        if (id || !selectedSeller) return;

        const result = await createInvoice({
          seller_ref: selectedSeller.ref,
        });

        if (!result) return;
        invoiceCreated = result;
      } else {
        // if the seller is setted by a query
        const db = Firestore();
        const sellerColl = collection(
          db,
          SellersCollection.root
        ) as CollectionReference<SellersDoc>;
        const sellerRef = doc(
          sellerColl,
          sellerId
        ) as DocumentReference<SellersDoc>;

        const result = await createInvoice({
          seller_ref: sellerRef,
        });

        if (!result) return;
        invoiceCreated = result;
      }

      router.push(`/invoices/manage?id=${invoiceCreated.id}`);
    }

    createInvo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sellerId, selectedSeller]);

  // this effect is to update the seller when its changed
  useEffect(() => {
    async function updateSeller() {
      if (!id || !selectedSeller) return;

      updateInvoice(id, {
        seller_ref: selectedSeller.ref,
      });
    }

    updateSeller();
  }, [id, selectedSeller]);

  // Debounced function to process results and update the invoice
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedProcessResults = useCallback(
    debounce(async (currentProductsResults: Record<string, productResult>) => {
      if (!invoice) return; // Check for invoice inside the debounced function as well

      // Compare with the *latest* previous results stored in the ref
      if (isEqual(prevProductsResultsRef.current, currentProductsResults)) {
        console.log("Skipping update, results haven't changed.");
        return;
      }

      console.log("Processing results and updating invoice...");
      const results = calculateResults(currentProductsResults);
      prevProductsResultsRef.current = currentProductsResults; // Update ref *after* calculation

      try {
        await updateDoc(invoice.ref, {
          total_sold: results.totalSold,
          total_proft: results.totalProfit, // Typo: should be total_profit? Check invoiceType
          total_cost: results.totalCost,
        } as unknown as PartialWithFieldValue<invoiceType>); // Consider using a more specific type assertion if possible
        console.log("Invoice updated successfully.");
      } catch (error) {
        console.error("Error updating invoice:", error);
      }
    }, 1000), // Debounce time in milliseconds (e.g., 1000ms = 1 second)
    [invoice, calculateResults] // Dependencies for useCallback
  );

  // Effect to trigger the debounced processing when productsResults change
  useEffect(() => {
    // Call the debounced function with the current productsResults
    debouncedProcessResults(productsResults);

    // Cleanup function for the debounce timer
    return () => {
      debouncedProcessResults.cancel(); // Cancel any pending execution on unmount or dependency change
    };
  }, [productsResults, debouncedProcessResults]); // Depend on productsResults and the debounced function itself

  return (
    <MainContainer>
      <SelectSeller
        currentSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
      />
      {selectedSeller && invoice?.data().invoice_type === "normal" && (
        <SelectClient
          sellerData={selectedSeller?.data()}
          sellerDoc={selectedSeller}
        />
      )}

      {!selectedSeller ? (
        <Container>
          <p>Selecione un Vendedor para continuar</p>
        </Container>
      ) : !selectedSeller.data().hasInventory &&
        !invoice?.data().client_ref &&
        invoice?.data().invoice_type === "normal" ? (
        <Container>
          <p>Selecione un cliente para continuar</p>
        </Container>
      ) : (
        <>
          <Products
            selectedSeller={selectedSeller}
            setProductsResults={setProductsResults}
          />
          <InvoiceTotals
            totalResults={totalResults}
            hasInventory={selectedSeller?.data()?.hasInventory}
          />
          {selectedSeller?.data()?.hasInventory ? (
            <>
              <Credit
                setRawCreditResult={setRawCreditResult}
                creditResult={creditResult}
              />

              <Close totals={totalResults} credits={creditResult} />
            </>
          ) : (
            invoice?.data().invoice_type === "normal" && (
              <>
                <ClientCredit />
                <Preliminar />
              </>
            )
          )}
          <FlexContainer styles={{ gap: "10px", marginTop: "60px" }}>
            <Button onClick={() => window.print()}>Imprimir</Button>
            <Button $primary onClick={() => router.push("/invoices")}>
              Terminado
            </Button>
          </FlexContainer>
          <Container styles={{ marginTop: "20px" }}>
            <p>
              Eleminar una factura es una acción <b>INRREVERSIBLE</b>, tenga
              precaución
            </p>
            <Button $warn $hold>
              Eleminar factura
            </Button>
          </Container>
        </>
      )}
    </MainContainer>
  );
}

export default function Page() {
  return (
    <InvoiceProvider>
      <InvoiceManager />
    </InvoiceProvider>
  );
}

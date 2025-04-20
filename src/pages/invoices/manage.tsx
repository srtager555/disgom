import { Products } from "@/components/pages/invoice/manage/products";
import { SelectSeller } from "@/components/pages/invoice/manage/SelectSeller";
// import { bill, Bills } from "@/components/pages/invoice/Product/closing/Bills";
import { Close } from "@/components/pages/invoice/manage/Closing";
// import { Credit } from "@/components/pages/invoice/Product/closing/closed/Credit";
import { productResult } from "@/components/pages/invoice/ProductList";
import { SelectClient } from "@/components/pages/invoice/SelectClient";
import useQueryParams from "@/hooks/getQueryParams";
import { useInvoice, InvoiceProvider } from "@/contexts/InvoiceContext";
import { Container, FlexContainer } from "@/styles/index.styles";
import { createInvoice, invoiceType } from "@/tools/invoices/createInvoice";
import { updateInvoice } from "@/tools/invoices/updateInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import {
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useState, useRef, useMemo } from "react";
import styled from "styled-components";
import { useProductResults } from "@/hooks/useProductResults";
import { InvoiceTotals } from "@/components/pages/invoice/manage/InvoiceTotals";
import { isEqual } from "lodash";
import { Credit } from "@/components/pages/invoice/manage/credit";
import { ClientCredit } from "@/components/pages/invoice/manage/ClientCredit";

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
  const { id } = useQueryParams();
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

  // this effect is to create an invoice when the select the seller
  useEffect(() => {
    async function createInvo() {
      console.log(id, selectedSeller?.data().name);
      if (id || !selectedSeller) return;

      const invoiceCreated = await createInvoice({
        seller_ref: selectedSeller.ref,
      });

      router.push(`/invoices/manage?id=${invoiceCreated.id}`);
    }

    createInvo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedSeller]);

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

  useEffect(() => {
    async function processResults() {
      if (isEqual(prevProductsResultsRef.current, productsResults) || !invoice)
        return;
      const results = calculateResults(productsResults);
      prevProductsResultsRef.current = productsResults;

      // update the results in the invoice ZakoZakoZakoZakoZakoZakoZakoZakoZakoZakoZakoZako

      await updateDoc(invoice.ref, {
        total_sold: results.totalSold,
        total_profit: results.totalProfit,
        total_cost: results.totalCost,
      } as unknown as PartialWithFieldValue<invoiceType>);
    }

    processResults();
  }, [productsResults, calculateResults, invoice]);

  return (
    <MainContainer>
      <Container styles={{ marginBottom: "20px" }}>
        <SelectSeller
          currentSeller={selectedSeller}
          setSelectedSeller={setSelectedSeller}
        />
        {selectedSeller && (
          <SelectClient
            sellerData={selectedSeller?.data()}
            sellerDoc={selectedSeller}
          />
        )}
      </Container>

      {!selectedSeller?.data()?.hasInventory && !invoice?.data().client_ref ? (
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
            <>
              <ClientCredit />
            </>
          )}
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

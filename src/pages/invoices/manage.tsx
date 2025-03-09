import { Products } from "@/components/pages/invoice/manage/products";
import { SelectSeller } from "@/components/pages/invoice/manage/SelectSeller";
import { bill, Bills } from "@/components/pages/invoice/Product/closing/Bills";
import { Close } from "@/components/pages/invoice/Product/closing/Close";
import { Credit } from "@/components/pages/invoice/Product/closing/closed/Credit";
import { productResult } from "@/components/pages/invoice/ProductList";
import { SelectClient } from "@/components/pages/invoice/SelectClient";
import useQueryParams from "@/hooks/getQueryParams";
import { useGetInvoiceByQueryOnSnapshot } from "@/hooks/invoice/getInvoiceByQueryOnSnapshot";
import { Container, FlexContainer } from "@/styles/index.styles";
import { createInvoice, invoiceType } from "@/tools/invoices/createInvoice";
import { updateInvoice } from "@/tools/invoices/updateInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { DocumentReference, QueryDocumentSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import { SetStateAction, useEffect, useState } from "react";
import styled from "styled-components";

const MainContainer = styled(FlexContainer)`
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
`;

export default function Page() {
  const { id } = useQueryParams();
  const router = useRouter();
  const invoice = useGetInvoiceByQueryOnSnapshot();
  const [selectedSeller, setSelectedSeller] = useState<
    QueryDocumentSnapshot<SellersDoc> | undefined
  >(undefined);
  const [client, setClient] = useState<QueryDocumentSnapshot<client> | null>(
    null
  );
  const [productsResults, setProductsResults] = useState<
    Record<string, productResult>
  >({});
  const [creditResult, setCreditResult] = useState(0);
  const [bills, setBills] = useState<Record<string, bill>>({});
  const [money, setMoney] = useState({
    cash: 0,
    deposit: 0,
  });

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
            setClient={setClient}
            client={client}
          />
        )}
      </Container>

      <Products
        selectedSeller={selectedSeller}
        setProductsResults={setProductsResults}
      />

      <FlexContainer
        styles={{
          width: "100%",
          flexDirection: "column",
          justifyContent: "flex-start",
          marginBottom: "50px",
        }}
      >
        <Container styles={{ marginBottom: "50px" }}>
          {invoice?.data() && (
            <Credit
              setCreditTotal={setCreditResult}
              invoiceData={invoice.data()}
              seller_ref={selectedSeller?.ref as DocumentReference<SellersDoc>}
            />
          )}
        </Container>
        <Bills bills={bills} setBills={setBills} />
      </FlexContainer>
      {invoice && (
        <Close
          totals={undefined}
          credits={0}
          bills={bills}
          setMoney={setMoney}
          invoice={invoice}
        />
      )}
    </MainContainer>
  );
}

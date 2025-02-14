import { Products } from "@/components/pages/invoice/manage/products";
import { SelectSeller } from "@/components/pages/invoice/manage/SelectSeller";
import { productResult } from "@/components/pages/invoice/ProductList";
import { SelectClient } from "@/components/pages/invoice/SelectClient";
import useQueryParams from "@/hooks/getQueryParams";
import { Container, FlexContainer } from "@/styles/index.styles";
import { createInvoice } from "@/tools/invoices/createInvoice";
import { updateInvoice } from "@/tools/invoices/updateInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";

const MainContainer = styled(FlexContainer)`
  justify-content: center;
  align-items: center;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  padding: 20px;
`;

export default function Page() {
  const router = useRouter();
  const { id } = useQueryParams();
  const [selectedSeller, setSelectedSeller] = useState<
    QueryDocumentSnapshot<SellersDoc> | undefined
  >(undefined);
  const [client, setClient] = useState<QueryDocumentSnapshot<client> | null>(
    null
  );
  const [productsResults, setProductsResults] = useState<
    Record<string, productResult>
  >({});

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
    </MainContainer>
  );
}

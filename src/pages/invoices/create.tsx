import { Select } from "@/components/Inputs/select";
import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { NextPageWithLayout } from "@/pages/_app";
import { Container, FlexContainer } from "@/styles/index.styles";
import { SellersDoc } from "@/tools/sellers/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

const SellersSelect = styled(FlexContainer)`
  align-items: center;
  justify-content: flex-start;

  & > div select {
    margin-left: 10px;
    font-size: 1.5rem;
    font-weight: bold;
  }
`;

const Page: NextPageWithLayout = () => {
  const sellers = useGetSellers();
  const [selectedSeller, setSelectedSeller] = useState<string | undefined>();
  const [sellerDoc, setSellerDoc] =
    useState<QueryDocumentSnapshot<SellersDoc>>();
  const sellerData = useMemo(() => sellerDoc?.data(), [sellerDoc]);

  function selectSeller(e: ChangeEvent<HTMLSelectElement>) {
    setSelectedSeller(e.target.value);
  }

  // effect to get the selected seller doc
  useEffect(() => {
    if (!selectedSeller) return;

    const sellerDoc = sellers?.docs.find((el) => el.id === selectedSeller);
    setSellerDoc(sellerDoc);
  }, [selectedSeller, sellers?.docs]);

  useEffect(() => {}, [selectedSeller]);

  return (
    <Container>
      <SellersSelect>
        <h2 style={{ margin: "0" }}>Factura para</h2>
        <Select
          marginBottom="0px"
          onChange={selectSeller}
          options={
            !sellers
              ? [{ name: "Cargando...", value: "none" }]
              : sellers.docs.map((el) => {
                  const data = el.data();
                  return {
                    name: data.name,
                    value: el.id,
                  };
                })
          }
        />
      </SellersSelect>
      {!sellerData?.hasInventory && (
        <Container>
          <Select options={[{ name: "sin clientes", value: "" }]}>
            Seleccionar cliente:
          </Select>
        </Container>
      )}
    </Container>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;

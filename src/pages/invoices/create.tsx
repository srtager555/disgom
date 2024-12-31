import { Select } from "@/components/Inputs/select";
import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import { useGetSellers } from "@/hooks/sellers/getSellers";
import { NextPageWithLayout } from "@/pages/_app";
import { Container, FlexContainer } from "@/styles/index.styles";
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

  return (
    <Container>
      <SellersSelect>
        <h2 style={{ margin: "0" }}>Factura para</h2>
        <Select
          marginBottom="0px"
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
    </Container>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;

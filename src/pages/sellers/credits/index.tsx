import { useGetAllOficeCredits } from "@/hooks/sellers/getAll/useGetAllOficeCredits";
import { useGetAllSellersCreditsTotals } from "@/hooks/sellers/getAll/useGetAllSellersCredits";
import { globalCSSVars } from "@/styles/colors";
import { Container, FlexContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { useEffect, useState } from "react";
import styled from "styled-components";

const GridContainer = styled(Container)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
`;

const GetAllAvailableSpace = styled(FlexContainer)`
  flex-direction: column;
  flex: 1;
`;

const CreditsContainer = styled(FlexContainer)`
  flex-direction: column;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  flex: 1;
`;

const CreditPreview = styled(Container)`
  border-bottom: 1px solid ${globalCSSVars["--detail"]};
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export default function Page() {
  const sellerCreditsTotals = useGetAllSellersCreditsTotals();
  const clientsCreditsTotals = useGetAllOficeCredits();
  const [total, setTotal] = useState(0);
  const [reducedSellerCredits, setReducedSellerCredits] = useState(0);
  const [reducedClientsCredits, setReducedClientsCredits] = useState(0);

  console.log(clientsCreditsTotals);

  useEffect(() => {
    const reducedSellersCredits = sellerCreditsTotals.reduce((prev, curr) => {
      return prev + curr.total;
    }, 0);
    const reducedClientsCredits = clientsCreditsTotals.reduce((prev, curr) => {
      return prev + curr.total;
    }, 0);

    setTotal(reducedSellersCredits + reducedClientsCredits);
    setReducedSellerCredits(reducedSellersCredits);
    setReducedClientsCredits(reducedClientsCredits);
  }, [sellerCreditsTotals, clientsCreditsTotals]);

  return (
    <FlexContainer
      styles={{ height: "calc(100vh - 87px)", flexDirection: "column" }}
    >
      <h1>Resumen de todos los Creditos</h1>
      <Container styles={{ marginBottom: "30px" }}>
        <h2>
          Hay un total de{" "}
          <span style={{ textDecoration: "underline" }}>
            {numberParser(total, true)}
          </span>{" "}
          creditos en todos los vendedores
        </h2>
      </Container>
      <GridContainer>
        <GetAllAvailableSpace>
          <h3>
            <FlexContainer styles={{ justifyContent: "space-between" }}>
              <span>Vendedores</span>
              <span>{numberParser(reducedSellerCredits, true)}</span>
            </FlexContainer>
          </h3>
          <GetAllAvailableSpace>
            <CreditsContainer>
              {sellerCreditsTotals.map((seller, i) => (
                <CreditPreview key={i}>
                  <span>{seller.seller_name}</span>
                  <span>{numberParser(seller.total, true)}</span>
                </CreditPreview>
              ))}
            </CreditsContainer>
          </GetAllAvailableSpace>
        </GetAllAvailableSpace>
        <GetAllAvailableSpace>
          <h3>
            <FlexContainer styles={{ justifyContent: "space-between" }}>
              <span>Clientes</span>
              <span>{numberParser(reducedClientsCredits, true)}</span>
            </FlexContainer>
          </h3>
          <GetAllAvailableSpace>
            <CreditsContainer>
              {clientsCreditsTotals.map((client, i) => (
                <CreditPreview key={i}>
                  <span>{client.client_name}</span>
                  <span>{numberParser(client.total, true)}</span>
                </CreditPreview>
              ))}
            </CreditsContainer>
          </GetAllAvailableSpace>
        </GetAllAvailableSpace>
      </GridContainer>
    </FlexContainer>
  );
}

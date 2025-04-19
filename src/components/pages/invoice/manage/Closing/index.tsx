import { Container, FlexContainer } from "@/styles/index.styles";
import { useState } from "react";
import { TotalResults } from "@/hooks/useProductResults";
import { useInvoice } from "@/contexts/InvoiceContext";
import { Money } from "./Money";
import { Data } from "./Data";

type props = {
  totals: TotalResults | undefined;
  credits: number;
};

export function Close({ totals, credits }: props) {
  const { invoice } = useInvoice();
  const [moneyAmount, setMoneyAmount] = useState(0);

  if (!totals) return <>Cargando...</>;

  return (
    <Container styles={{ marginBottom: "50px" }}>
      <h2 style={{ textAlign: "center" }}>Liquidación</h2>
      <FlexContainer styles={{ gap: "10px" }}>
        <Data totals={totals} credits={credits} moneyAmount={moneyAmount} />
        <Money setMoneyAmount={setMoneyAmount} moneyAmount={moneyAmount} />
      </FlexContainer>
    </Container>
  );
}

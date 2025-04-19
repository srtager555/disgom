import { Container, GridContainer } from "@/styles/index.styles";
import { Column, Input } from "../../Product";
import { TotalResults } from "@/hooks/useProductResults";
import { numberParser } from "@/tools/numberPaser";
import { useMemo } from "react";

type props = {
  totals: TotalResults;
  credits: number;
  moneyAmount: number;
};

export function Data({ totals, credits, moneyAmount }: props) {
  const diff = useMemo(
    () => moneyAmount - (totals.totalSold + credits - 0),
    [moneyAmount, totals, credits]
  );
  const gridTemplateColumns = "repeat(4, 100px)";

  return (
    <Container>
      <GridContainer $gridTemplateColumns={gridTemplateColumns}>
        <Column>Ventas</Column>
        <Column>{numberParser(totals.totalSold)}</Column>
        <Column>Ganancias</Column>
        <Column>
          {numberParser(totals.totalProfit + totals.totalSellerProfit)}
        </Column>
      </GridContainer>
      <GridContainer $gridTemplateColumns={gridTemplateColumns}>
        <Column>Credito</Column>
        <Column>{numberParser(credits)}</Column>
        <Column>Vendedor</Column>
        <Column>{numberParser(totals.totalSellerProfit)}</Column>
      </GridContainer>
      <GridContainer $gridTemplateColumns={gridTemplateColumns}>
        <Column>Gastos</Column>
        <Column>
          <Input />
        </Column>
        <Column>Empresa</Column>
        <Column>{numberParser(totals.totalProfit)}</Column>
      </GridContainer>
      <GridContainer $gridTemplateColumns={gridTemplateColumns}>
        <Column>Liquidación</Column>
        <Column>{numberParser(totals.totalSold + credits - 0)}</Column>
        <Column />
      </GridContainer>
      <GridContainer $gridTemplateColumns={gridTemplateColumns}>
        <Column gridColumn="1 / 2">
          {diff < 0 ? "Faltan" : diff === 0 ? "¡Perfecto!" : "Sobran"}
        </Column>
        <Column>
          <p
            style={
              diff < 0
                ? { color: "red", fontWeight: "bold" }
                : diff >= 0
                ? { fontStyle: "italic" }
                : { color: "green", fontWeight: "bold" }
            }
          >
            {numberParser(diff)}
          </p>
        </Column>
        <Column />
      </GridContainer>
    </Container>
  );
}

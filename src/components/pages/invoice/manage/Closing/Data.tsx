import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";
import { TotalResults } from "@/hooks/useProductResults";
import { numberParser } from "@/tools/numberPaser";
import { useMemo, useState } from "react";
import { Bills } from "./Bills";
import { Missing } from "./Missing";
import { MissingList } from "./MissingList";
import { ProductsFollowed } from "./ProductsFollowed";

export const Days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

type props = {
  totals: TotalResults;
  credits: number;
  moneyAmount: number;
};

export function Data({ totals, credits, moneyAmount }: props) {
  const [billsAmount, setBillsAmount] = useState(0);
  const diff = useMemo(
    () => moneyAmount - (totals.totalSold + credits - billsAmount),
    [moneyAmount, totals, credits, billsAmount]
  );
  const liquidation = useMemo(
    () => numberParser(totals.totalSold + credits - billsAmount),
    [billsAmount, credits, totals.totalSold]
  );
  const netProfit = useMemo(
    () => numberParser(totals.totalProfit + totals.totalSellerProfit),
    [totals.totalProfit, totals.totalSellerProfit]
  );
  const gridTemplateColumns = "repeat(4, 100px)";

  return (
    <Container>
      <Container>
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column>Ventas</Column>
          <Column>{numberParser(totals.totalSold)}</Column>
          <Column>Ganancias</Column>
          <Column>{netProfit}</Column>
        </GridContainer>
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column>Credito</Column>
          <Column>{numberParser(credits)}</Column>
          <Column>Vendedor</Column>
          <Column>{numberParser(totals.totalSellerProfit)}</Column>
        </GridContainer>
        <Bills totals={totals} setBillsAmount={setBillsAmount} />
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column>Efectivo</Column>
          <Column>{numberParser(moneyAmount)}</Column>
          <Column />
        </GridContainer>
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column>Liquidación</Column>
          <Column>{liquidation}</Column>
          <Column />
        </GridContainer>
        <GridContainer $gridTemplateColumns={gridTemplateColumns}>
          <Column
            gridColumn="1 / 2"
            className={diff < 0 || diff > 0 ? "alert" : ""}
          >
            {diff < 0 ? "Faltan" : diff === 0 ? "¡Perfecto!" : "Sobran"}
          </Column>
          <Column className={diff < 0 || diff > 0 ? "alert" : ""}>
            {numberParser(diff)}
          </Column>
          <Column />
        </GridContainer>
      </Container>
      <Missing diff={diff} />
      <FlexContainer styles={{ justifyContent: "space-between" }}>
        <MissingList />
        <ProductsFollowed />
      </FlexContainer>
    </Container>
  );
}

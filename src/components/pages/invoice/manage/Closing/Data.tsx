import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "../../Product";
import { TotalResults } from "@/hooks/useProductResults";
import { numberParser } from "@/tools/numberPaser";
import { useMemo, useState } from "react";
import { Bills } from "./Bills";
import { Missing } from "./Missing";
import { MissingList } from "./MissingList";
import { ProductsFollowed } from "./ProductsFollowed";
import styled from "styled-components";

const GridContainerWithPrintMode = styled(GridContainer)`
  grid-template-columns: repeat(4, 100px);

  @media print {
    grid-template-columns: repeat(2, 100px);
  }
`;

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

  return (
    <Container>
      <Container>
        <GridContainerWithPrintMode>
          <Column>Ventas</Column>
          <Column>{numberParser(totals.totalSold)}</Column>
          <Column hideOnPrint>Ganancias</Column>
          <Column hideOnPrint>{netProfit}</Column>
        </GridContainerWithPrintMode>
        <GridContainerWithPrintMode>
          <Column>Credito</Column>
          <Column>{numberParser(credits)}</Column>
          <Column hideOnPrint>Vendedor</Column>
          <Column hideOnPrint>{numberParser(totals.totalSellerProfit)}</Column>
        </GridContainerWithPrintMode>
        <Bills totals={totals} setBillsAmount={setBillsAmount} />
        <GridContainerWithPrintMode>
          <Column>Efectivo</Column>
          <Column>{numberParser(moneyAmount)}</Column>
          <Column />
        </GridContainerWithPrintMode>
        <GridContainerWithPrintMode>
          <Column>Liquidación</Column>
          <Column>{liquidation}</Column>
          <Column />
        </GridContainerWithPrintMode>
        <GridContainerWithPrintMode>
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
        </GridContainerWithPrintMode>
      </Container>
      <Missing diff={diff} />
      <FlexContainer
        className="hide-print"
        styles={{ justifyContent: "space-between" }}
      >
        <MissingList />
        <ProductsFollowed />
      </FlexContainer>
    </Container>
  );
}

import { Container } from "@/styles/index.styles";
import styled from "styled-components";
import { totals_sold } from "./manager";
import { bill } from "./Bills";
import { useMemo } from "react";
import { numberParser } from "@/tools/numberPaser";
import { Column } from "../..";

const GridCon = styled(Container)`
  display: grid;
  grid-template-columns: 150px repeat(3, 90px);
  grid-auto-rows: 40px;
  justify-content: center;
  gap: 10px;
`;

type props = {
  totals: totals_sold | undefined;
  credits: number;
  bills: Array<bill>;
  money: { cash: number; deposit: number };
};

export function Close({ totals, credits, bills, money }: props) {
  const { cash, deposit } = money;
  const billsTotal = useMemo(
    () => bills.reduce((before, now) => before + now.amount, 0),
    [bills]
  );

  if (!totals) return <>Cargando...</>;

  return (
    <Container styles={{ marginBottom: "50px" }}>
      <h2 style={{ textAlign: "center" }}>Liquidación</h2>
      <GridCon>
        <Column gridColumn="">Ventas</Column>
        <Column gridColumn="">{numberParser(totals.total_sale)}</Column>
        <Column gridColumn="">Ganancias</Column>
        <Column gridColumn="">
          {numberParser(totals.total_profit + totals.total_seller_proft)}
        </Column>
        <Column gridColumn="">Diff. de Credito</Column>
        <Column gridColumn="">{numberParser(credits)}</Column>
        <Column gridColumn="">Vendedor</Column>
        <Column gridColumn="">{numberParser(totals.total_seller_proft)}</Column>
        <Column gridColumn="">Gastos</Column>
        <Column gridColumn="">{numberParser(billsTotal)}</Column>
        <Column gridColumn="">Empresa</Column>
        <Column gridColumn="">{numberParser(totals.total_profit)}</Column>
        <Column gridColumn="">Liquidación</Column>
        <Column gridColumn="">
          {numberParser(totals.total_sale + credits - billsTotal)}
        </Column>
        <Column gridColumn="1 / 2">Depositos</Column>
        <Column gridColumn="">{numberParser(deposit)}</Column>
        <Column gridColumn="1 / 2">Efectivo</Column>
        <Column gridColumn="">{numberParser(cash)}</Column>
        <Column gridColumn="1 / 2">
          {deposit + cash - (totals.total_sale + credits - billsTotal) < 0
            ? "Faltan"
            : deposit + cash - (totals.total_sale + credits - billsTotal) === 0
            ? "¡Perfecto!"
            : "Sobran"}
        </Column>
        <Column gridColumn="">
          <p
            style={
              deposit + cash - (totals.total_sale + credits - billsTotal) < 0
                ? { color: "red", fontWeight: "bold" }
                : deposit + cash - (totals.total_sale + credits - billsTotal) >
                  0
                ? { fontStyle: "italic" }
                : { color: "green", fontWeight: "bold" }
            }
          >
            {numberParser(
              deposit + cash - (totals.total_sale + credits - billsTotal)
            )}
          </p>
        </Column>
      </GridCon>
    </Container>
  );
}

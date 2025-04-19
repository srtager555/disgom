import { Container } from "@/styles/index.styles";
import styled from "styled-components";
import { Column, Input } from "../../Product";
// import { bill } from "./Bills";
import { useEffect, useMemo, useState } from "react";
import { numberParser } from "@/tools/numberPaser";
import { TotalResults } from "@/hooks/useProductResults";
import { useInvoice } from "@/contexts/InvoiceContext";

const GridCon = styled(Container)`
  display: grid;
  grid-template-columns: 150px repeat(3, 90px);
  grid-auto-rows: 40px;
  justify-content: center;
  gap: 10px;
`;

type props = {
  totals: TotalResults | undefined;
  credits: number;
};

export function Close({ totals, credits }: props) {
  const { invoice } = useInvoice();
  const [cash, setCash] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [editCash, setEditCash] = useState(false);
  const [editDeposit, setEditDeposit] = useState(false);

  const money = useMemo(() => {
    const data = invoice?.data();
    return data?.money;
  }, [invoice]);

  useEffect(() => {
    if (!money) return;

    setCash(money.cash);
    setDeposit(money.deposit);

    setMoney({
      deposit: money.deposit,
      cash: money.cash,
    });
  }, [money, setMoney]);

  if (!totals) return <>Cargando...</>;

  return (
    <Container styles={{ marginBottom: "50px" }}>
      <h2 style={{ textAlign: "center" }}>Liquidación</h2>
      <GridCon>
        <Column gridColumn="">Ventas</Column>
        <Column gridColumn="">{numberParser(totals.totalSold)}</Column>
        <Column gridColumn="">Ganancias</Column>
        <Column gridColumn="">
          {numberParser(totals.totalProfit + totals.totalSellerProfit)}
        </Column>
        <Column gridColumn="">Diff. de Credito</Column>
        <Column gridColumn="">{numberParser(credits)}</Column>
        <Column gridColumn="">Vendedor</Column>
        <Column gridColumn="">{numberParser(totals.totalSellerProfit)}</Column>
        <Column gridColumn="">Gastos</Column>
        {/* <Column gridColumn="">-{numberParser(billsTotal)}</Column> */}
        <Column gridColumn="">-0</Column>
        <Column gridColumn="">Empresa</Column>
        <Column gridColumn="">{numberParser(totals.totalProfit)}</Column>
        <Column gridColumn="">Liquidación</Column>
        <Column gridColumn="">
          {numberParser(totals.totalSold + credits - 0)}
        </Column>
        <Column gridColumn="1 / 2">Depositos</Column>
        <Column gridColumn="">
          <Input
            type="number"
            onChange={(e) => {
              setDeposit(Number(e.target.value));
              setMoney((props) => {
                return { ...props, deposit: Number(e.target.value) };
              });
            }}
            onClick={() => setEditDeposit(true)}
            onSelect={() => setEditDeposit(true)}
            value={!editDeposit ? money?.deposit : undefined}
          />
        </Column>
        <Column gridColumn="1 / 2">Efectivo</Column>
        <Column gridColumn="">
          <Input
            type="number"
            onChange={(e) => {
              setCash(Number(e.target.value));
              setMoney((props) => {
                return { ...props, cash: Number(e.target.value) };
              });
            }}
            onClick={() => setEditCash(true)}
            onSelect={() => setEditCash(true)}
            value={!editCash ? money?.cash : undefined}
          />
        </Column>
        <Column gridColumn="1 / 2">
          {deposit + cash - (totals.totalSold + credits - 0) < 0
            ? "Faltan"
            : deposit + cash - (totals.totalSold + credits - 0) === 0
            ? "¡Perfecto!"
            : "Sobran"}
        </Column>
        <Column gridColumn="">
          <p
            style={
              deposit + cash - (totals.totalSold + credits - 0) < 0
                ? { color: "red", fontWeight: "bold" }
                : deposit + cash - (totals.totalSold + credits - 0) > 0
                ? { fontStyle: "italic" }
                : { color: "green", fontWeight: "bold" }
            }
          >
            {numberParser(deposit + cash - (totals.totalSold + credits - 0))}
          </p>
        </Column>
      </GridCon>
    </Container>
  );
}

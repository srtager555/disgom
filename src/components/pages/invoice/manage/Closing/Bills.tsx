import { GridContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { Column, Input } from "../../Product";
import { TotalResults } from "@/hooks/useProductResults";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useInvoice } from "@/contexts/InvoiceContext";
import { updateDoc } from "firebase/firestore";
import { parseNumberInput } from "@/tools/parseNumericInput";

const gridTemplateColumns = "repeat(4, 100px)";

type props = {
  totals: TotalResults;
  setBillsAmount: Dispatch<SetStateAction<number>>;
};

export function Bills({ totals, setBillsAmount }: props) {
  const { invoice } = useInvoice();
  const [currentBillsAmount, setCurrentBillsAmount] = useState("0");
  const billsGetted = useRef(false);

  useEffect(() => {
    if (!invoice || billsGetted.current) return;
    billsGetted.current = true;

    setCurrentBillsAmount(invoice.data().bills.toString());
    setBillsAmount(invoice.data().bills);
  }, [invoice]);

  useEffect(() => {
    async function saveBills() {
      if (!invoice) return;
      const numericCurrentBillsAmount = Number(currentBillsAmount);

      if (isNaN(numericCurrentBillsAmount)) {
        return;
      }

      setBillsAmount(numericCurrentBillsAmount);

      const dbBills = invoice.data().bills;
      if (dbBills === numericCurrentBillsAmount) return;

      await updateDoc(invoice.ref, {
        bills: numericCurrentBillsAmount ?? 0,
      });
    }

    saveBills();
  }, [currentBillsAmount]);

  return (
    <GridContainer $gridTemplateColumns={gridTemplateColumns}>
      <Column>Gastos</Column>
      <Column>
        <Input
          value={currentBillsAmount}
          onChange={(e) => {
            const amount = parseNumberInput(() => {}, e, { returnRaw: true });

            if (amount === undefined) return;

            setCurrentBillsAmount(amount);
          }}
        />
      </Column>
      <Column hideOnPrint>Empresa</Column>
      <Column hideOnPrint>{numberParser(totals.totalProfit)}</Column>
    </GridContainer>
  );
}

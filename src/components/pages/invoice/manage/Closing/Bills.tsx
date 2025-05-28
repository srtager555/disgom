import { GridContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { Column, Input } from "../../Product";
import { TotalResults } from "@/hooks/useProductResults";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/debounce";
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
  const [currentBillsAmount, setCurrentBillsAmount] = useState(0);
  const billsDebounce = useDebounce(currentBillsAmount);
  const billsGetted = useRef(false);

  useEffect(() => {
    if (!invoice || billsGetted.current) return;
    billsGetted.current = true;

    setCurrentBillsAmount(invoice.data().bills);
    setBillsAmount(invoice.data().bills);
  }, [invoice]);

  useEffect(() => {
    async function saveBills() {
      if (!invoice) return;
      const dbBills = invoice.data().bills;
      if (dbBills === billsDebounce) return;

      await updateDoc(invoice.ref, {
        bills: billsDebounce ?? 0,
      });
    }

    saveBills();
  }, [billsDebounce]);

  return (
    <GridContainer $gridTemplateColumns={gridTemplateColumns}>
      <Column>Gastos</Column>
      <Column>
        <Input
          value={currentBillsAmount}
          onChange={(e) => {
            const amount = parseNumberInput(() => {}, e, { returnRaw: true });
            if (amount === undefined) return;

            setBillsAmount(amount);
            setCurrentBillsAmount(amount);
          }}
        />
      </Column>
      <Column>Empresa</Column>
      <Column>{numberParser(totals.totalProfit)}</Column>
    </GridContainer>
  );
}

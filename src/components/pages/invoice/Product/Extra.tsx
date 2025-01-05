import { Column, OutputsRequest, OutputCostDescription, Input } from ".";
import { stockType } from "@/tools/products/addToStock";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";

interface ExtraProps {
  hasInventory: boolean | undefined;
  stockInfo: stockType;
  outputRequest: OutputsRequest;
  setState: Dispatch<SetStateAction<Record<number, OutputCostDescription>>>;
  index: number;
}

export function Extra({
  stockInfo,
  outputRequest,
  setState,
  index,
}: ExtraProps) {
  const [amount, setAmount] = useState(outputRequest.amount);
  const [purchaseValue, setPurchaseValue] = useState(0);

  function changeValue(
    e: ChangeEvent<HTMLInputElement> | number,
    setState: Dispatch<SetStateAction<number>>
  ) {
    const value = typeof e === "number" ? e : Number(e.target.value) || 0;
    setState(value);
  }

  useEffect(() => {
    changeValue(outputRequest.amount, setAmount);
  }, [outputRequest.amount]);

  useEffect(() => {
    if (!stockInfo) return;

    setPurchaseValue(amount * stockInfo.purchase_price);
  }, [amount, stockInfo]);

  useEffect(() => {
    setState((props) => {
      return {
        ...props,
        [index]: {
          amount: amount,
          cost: stockInfo.purchase_price,
          total_cost: purchaseValue,
        },
      };
    });

    return () => {
      setState((props) => {
        const data = { ...props };
        delete data[index];

        return {
          ...data,
        };
      });
    };
  }, [amount, index, purchaseValue, setState, stockInfo.purchase_price]);

  return (
    <>
      <Column $gridColumn="1 / 4">
        {stockInfo.created_at.toDate().toLocaleDateString()}
      </Column>
      <Column $gridColumn="4 / 5">{outputRequest.amount}</Column>
      <Column $gridColumn="5 / 6">{stockInfo.purchase_price}</Column>
      <Column $gridColumn="6 / 7" title={purchaseValue.toLocaleString()}>
        {purchaseValue.toLocaleString()}
      </Column>
    </>
  );
}

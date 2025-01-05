import { Column, OutputsRequest, OutputCostDescription } from ".";
import { stockType } from "@/tools/products/addToStock";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface ExtraProps {
  hasInventory: boolean | undefined;
  stockInfo: stockType;
  outputRequest: OutputsRequest;
  setState: Dispatch<SetStateAction<Record<number, OutputCostDescription>>>;
  index: number;
}

export function Cost({
  stockInfo,
  outputRequest,
  setState,
  index,
}: ExtraProps) {
  const [purchaseValue, setPurchaseValue] = useState(0);

  useEffect(() => {
    if (!stockInfo) return;

    setPurchaseValue(outputRequest.amount * stockInfo.purchase_price);
  }, [outputRequest.amount, stockInfo]);

  useEffect(() => {
    setState((props) => {
      return {
        ...props,
        [index]: {
          amount: outputRequest.amount,
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
  }, [
    index,
    outputRequest.amount,
    purchaseValue,
    setState,
    stockInfo.purchase_price,
  ]);

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

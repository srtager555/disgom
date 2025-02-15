import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";

type props = {
  outputsAmount: number;
  inventoryAmount: number;
  devolutionAmount: number;
  setAmount: Dispatch<SetStateAction<number>>;
};

export const MemoProductSold = memo(ProductSold, (prev, next) => {
  if (prev.outputsAmount != next.outputsAmount) return false;
  if (prev.devolutionAmount != next.devolutionAmount) return false;
  if (prev.inventoryAmount != next.inventoryAmount) return false;

  return true;
});

export function ProductSold({
  outputsAmount,
  inventoryAmount,
  devolutionAmount,
  setAmount,
}: props) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const total = outputsAmount + inventoryAmount - devolutionAmount;

    setTotal(total);
    setAmount(total);
  }, [devolutionAmount, inventoryAmount, outputsAmount, setAmount]);

  return <Column>{numberParser(total)}</Column>;
}

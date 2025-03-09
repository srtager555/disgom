import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";

type props = {
  outputsAmount: number;
  inventoryAmount: number;
  devolutionAmount: number;
  setAmount: Dispatch<SetStateAction<number | undefined>>;
  setWarn: Dispatch<SetStateAction<boolean>>;
  sellerHasInventory: boolean | undefined;
};

export const MemoProductSold = memo(ProductSold, (prev, next) => {
  if (prev.outputsAmount != next.outputsAmount) return false;
  if (prev.devolutionAmount != next.devolutionAmount) return false;
  if (prev.inventoryAmount != next.inventoryAmount) return false;
  if (prev.sellerHasInventory != next.sellerHasInventory) return false;

  return true;
});

export function ProductSold({
  outputsAmount,
  inventoryAmount,
  devolutionAmount,
  setAmount,
  setWarn,
  sellerHasInventory,
}: props) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const total = outputsAmount + inventoryAmount - devolutionAmount;

    setWarn(total < 0);

    setTotal(total);
    setAmount(total);
  }, [devolutionAmount, inventoryAmount, outputsAmount, setAmount, setWarn]);

  if (sellerHasInventory) return <Column>{numberParser(total)}</Column>;
}

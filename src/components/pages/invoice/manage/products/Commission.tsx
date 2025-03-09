import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { useEffect, useState } from "react";

type props = {
  amount: number | undefined;
  commission: number;
  sellerHasInventory: boolean | undefined;
};

export function Commission({
  amount = 0,
  commission,
  sellerHasInventory,
}: props) {
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    if (!commission) setTotal(numberParser(0));
    else setTotal(numberParser(amount * commission));
  }, [amount, commission]);

  if (sellerHasInventory) return <Column title={total}>{total}</Column>;
}

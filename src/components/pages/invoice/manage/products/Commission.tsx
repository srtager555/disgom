import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import { useEffect, useState } from "react";

type props = {
  amount: number | undefined;
  commission: number;
};

export function Commission({ amount = 0, commission }: props) {
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    if (!commission) setTotal(numberParser(0));
    else setTotal(numberParser(amount * commission));
  }, [amount, commission]);

  return <Column title={total}>{total}</Column>;
}

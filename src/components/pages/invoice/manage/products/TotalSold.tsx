import { useEffect, useState } from "react";
import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";

type props = {
  amount: number;
  normalPrice: number;
  customPrice: number | undefined;
};

export function TotalSold({ amount, normalPrice, customPrice }: props) {
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    if (customPrice) setTotal(numberParser(amount * customPrice));
    else if (normalPrice) setTotal(numberParser(amount * normalPrice));
    else setTotal("0.00");
  }, [amount, normalPrice, customPrice]);

  return <Column title={total}>{total}</Column>;
}

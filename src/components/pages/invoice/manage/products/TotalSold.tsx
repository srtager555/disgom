import { useEffect, useState } from "react";
import { Column } from "../../Product";
import { numberParser } from "@/tools/numberPaser";

type props = {
  amount: number | undefined;
  normalPrice: number;
  customPrice: number | undefined;
  sellerHasInventory: boolean | undefined;
};

export function TotalSold({
  amount = 0,
  normalPrice,
  customPrice,
  sellerHasInventory,
}: props) {
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    if (customPrice) setTotal(numberParser(amount * customPrice));
    else if (normalPrice) setTotal(numberParser(amount * normalPrice));
    else setTotal("0.00");
  }, [amount, normalPrice, customPrice]);

  return (
    <Column gridColumn={!sellerHasInventory ? "-3 / -4" : ""} title={total}>
      {total}
    </Column>
  );
}

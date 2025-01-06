import { Column, Input, priceRequestDescription } from ".";
import { stockType } from "@/tools/products/addToStock";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { numberParser } from "@/tools/numberPaser";

interface PriceProsp {
  hasInventory: boolean | undefined;
  stockInfo: stockType;
  priceRequestLength: number;
  priceRequest: { amount: number };
  setState: Dispatch<SetStateAction<Record<number, priceRequestDescription>>>;
  index: number;
}

export function Price({
  stockInfo,
  priceRequestLength,
  priceRequest,
  hasInventory,
  setState: setSaleData,
  index,
}: PriceProsp) {
  const [amount, setAmount] = useState(priceRequest.amount);
  const [totalSold, setTotalSold] = useState(0);
  const [totalSellerSold, setTotalSellerSold] = useState(0);

  useEffect(() => {
    setAmount(priceRequest.amount);
  }, [priceRequest.amount]);

  useEffect(() => {
    setTotalSold(amount * stockInfo.sale_price);
    setTotalSellerSold(amount * stockInfo.seller_profit);
  }, [amount, stockInfo.sale_price, stockInfo.seller_profit]);

  useEffect(() => {
    setSaleData((props) => {
      return {
        ...props,
        [index]: {
          amount,
          totalSold,
          totalSellerSold,
        },
      };
    });
  }, [amount, totalSold, totalSellerSold, setSaleData, index]);

  return (
    <>
      <Column $gridColumn="4 / 5">
        {priceRequestLength > 1 ? (
          <Input
            onChange={(e) => setAmount(Number(e.target.value))}
            defaultValue={amount}
          />
        ) : (
          numberParser(amount)
        )}
      </Column>
      <Column $gridColumn="7 / 8">
        {priceRequestLength > 1 ? (
          <Input defaultValue={stockInfo.sale_price} />
        ) : (
          numberParser(stockInfo.sale_price)
        )}
      </Column>
      <Column $gridColumn="8 / 9" title={numberParser(totalSold)}>
        {numberParser(totalSold)}
      </Column>
      <Column $gridColumn="9 / 10"></Column>

      {hasInventory && (
        <>
          <Column $gridColumn="10 / 11">
            {numberParser(stockInfo.seller_profit)}
          </Column>
          <Column $gridColumn="11 / 12">{numberParser(totalSellerSold)}</Column>
          <Column $gridColumn="12 / 13"></Column>
        </>
      )}
    </>
  );
}

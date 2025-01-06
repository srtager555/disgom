import { Column, Input, priceRequestDescription } from ".";
import { stockType } from "@/tools/products/addToStock";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { numberParser } from "@/tools/numberPaser";

interface PriceProsp {
  hasInventory: boolean | undefined;
  stockInfo: stockType;
  thePrice: number;
  theSellerPrice: number;
  priceRequestLength: number;
  priceRequest: { amount: number };
  setState: Dispatch<SetStateAction<Record<number, priceRequestDescription>>>;
  index: number;
}

export function Price({
  stockInfo,
  priceRequestLength,
  priceRequest,
  thePrice,
  theSellerPrice,
  hasInventory,
  setState: setSaleData,
  index,
}: PriceProsp) {
  const [amount, setAmount] = useState(priceRequest.amount);
  const [soldPrice, setSoldPrice] = useState(thePrice);
  const [totalSold, setTotalSold] = useState(0);
  const [sellerPrice, setSellerPrice] = useState(theSellerPrice);
  const [totalSellerSold, setTotalSellerSold] = useState(0);

  useEffect(() => {
    setSoldPrice(thePrice);
    setSellerPrice(theSellerPrice);
  }, [thePrice, theSellerPrice]);

  useEffect(() => {
    setAmount(priceRequest.amount);
  }, [priceRequest.amount]);

  useEffect(() => {
    setTotalSold(amount * soldPrice);
    setTotalSellerSold(amount * sellerPrice);
  }, [amount, sellerPrice, soldPrice]);

  useEffect(() => {
    setSaleData((props) => {
      return {
        ...props,
        [index]: {
          amount,
          sold_price: soldPrice,
          totalSold,
          seller_sold_price: sellerPrice,
          totalSellerSold,
        },
      };
    });
  }, [
    amount,
    totalSold,
    totalSellerSold,
    setSaleData,
    index,
    soldPrice,
    sellerPrice,
  ]);

  return (
    <>
      <Column $gridColumn="4 / 5">
        {priceRequestLength > 1 ? (
          <Input
            type="number"
            onChange={(e) => setAmount(Number(e.target.value))}
            defaultValue={amount}
          />
        ) : (
          numberParser(amount)
        )}
      </Column>
      <Column $gridColumn="7 / 8">
        {priceRequestLength > 1 ? (
          <Input
            type="number"
            defaultValue={thePrice}
            onChange={(e) => setSoldPrice(Number(e.target.value))}
          />
        ) : (
          numberParser(thePrice)
        )}
      </Column>
      <Column $gridColumn="8 / 9" title={numberParser(totalSold)}>
        {numberParser(totalSold)}
      </Column>
      <Column $gridColumn="9 / 10"></Column>

      {hasInventory && (
        <>
          <Column $gridColumn="10 / 11">
            {priceRequestLength > 1 ? (
              <Input
                type="number"
                defaultValue={stockInfo.sale_price}
                onChange={(e) => setSellerPrice(Number(e.target.value))}
              />
            ) : (
              numberParser(stockInfo.seller_profit)
            )}
          </Column>
          <Column $gridColumn="11 / 12">{numberParser(totalSellerSold)}</Column>
          <Column $gridColumn="12 / 13"></Column>
        </>
      )}
    </>
  );
}

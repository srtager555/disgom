import { Column, Input, priceRequest, priceRequestDescription } from ".";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { numberParser } from "@/tools/numberPaser";
import { Button } from "@/styles/Form.styles";

interface PriceProsp {
  hasInventory: boolean | undefined;
  thePrice: number;
  theSellerPrice: number;
  priceRequestLength: number;
  priceRequest: priceRequest;
  setSaleData: Dispatch<
    SetStateAction<Record<number, priceRequestDescription>>
  >;
  setRequestData: Dispatch<SetStateAction<Array<priceRequest>>>;
  index: number;
}

export function Price({
  priceRequestLength,
  priceRequest,
  thePrice,
  theSellerPrice,
  hasInventory,
  setSaleData,
  setRequestData,
  index,
}: PriceProsp) {
  const [amount, setAmount] = useState(priceRequest.amount);
  const [soldPrice, setSoldPrice] = useState(thePrice);
  const [totalSold, setTotalSold] = useState(0);
  const [sellerPrice, setSellerPrice] = useState(theSellerPrice);
  const [totalSellerSold, setTotalSellerSold] = useState(0);
  const [editAmount, setEditAmount] = useState(false);
  const [editNormalPrice, setEditNormalPrice] = useState(false);
  const [editSellerPrice, setEditSellerPrice] = useState(false);

  function deleteo_o() {
    setSaleData((props) => {
      const elements = { ...props };
      delete elements[index];

      return elements;
    });

    setRequestData((props) => {
      const arr = [...props];
      arr.splice(index, 1);

      return arr;
    });
  }

  useEffect(() => {
    setSoldPrice(priceRequest.normal_price || thePrice);
    setSellerPrice(priceRequest.seller_price || theSellerPrice);
  }, [
    priceRequest.normal_price,
    priceRequest.seller_price,
    thePrice,
    theSellerPrice,
  ]);

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
      <Column
        gridColumn="4 / 5"
        title={priceRequestLength > 1 ? "" : numberParser(amount)}
      >
        {priceRequestLength > 1 ? (
          <Input
            type="number"
            onClick={() => setEditAmount(true)}
            onChange={(e) => setAmount(Number(e.target.value))}
            value={!editAmount ? amount : undefined}
          />
        ) : (
          numberParser(amount)
        )}
      </Column>
      <Column gridColumn="7 / 8">
        {priceRequestLength > 1 ? (
          <Input
            type="number"
            onChange={(e) => setSoldPrice(Number(e.target.value))}
            onClick={() => setEditNormalPrice(true)}
            onSelect={() => setEditNormalPrice(true)}
            value={
              !editNormalPrice
                ? priceRequest.normal_price || thePrice
                : undefined
            }
          />
        ) : (
          numberParser(priceRequest.normal_price || thePrice)
        )}
      </Column>
      <Column gridColumn="8 / 9" title={numberParser(totalSold)}>
        {numberParser(totalSold)}
      </Column>

      {hasInventory && (
        <>
          <Column gridColumn="10 / 11">
            {priceRequestLength > 1 ? (
              <Input
                type="number"
                onChange={(e) => setSellerPrice(Number(e.target.value))}
                onClick={() => setEditSellerPrice(true)}
                onSelect={() => setEditSellerPrice(true)}
                value={
                  !editSellerPrice
                    ? priceRequest.seller_price || theSellerPrice
                    : undefined
                }
              />
            ) : (
              numberParser(theSellerPrice)
            )}
          </Column>
          <Column gridColumn="11 / 12" title={numberParser(totalSellerSold)}>
            {numberParser(totalSellerSold)}
          </Column>
        </>
      )}
      {index != 0 && (
        <Column gridColumn="-1 / -2" $removeBorder>
          <Button onClick={deleteo_o}>Quitar</Button>
        </Column>
      )}
    </>
  );
}

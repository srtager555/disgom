import { Column, ExtraPrices, extraValues, Input } from ".";
import { stockType } from "@/tools/products/addToStock";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";

interface ExtraProps {
  hasInventory: boolean | undefined;
  stock: stockType;
  extra: ExtraPrices;
  setState: Dispatch<SetStateAction<Record<number, extraValues>>>;
  setEditParentAmount: Dispatch<SetStateAction<boolean>>;
  index: number;
}

export function Extra({
  stock,
  extra,
  hasInventory,
  setState,
  setEditParentAmount,
  index,
}: ExtraProps) {
  const [amount, setAmount] = useState(extra.amount);
  const [editAmountValue, setEditAmountValue] = useState(false);
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [salePrice, setSalePrice] = useState(stock.sale_price || 0);
  const [saleValue, setSaleValue] = useState(0);
  const [profitValue, setProfitValue] = useState(0);
  const [sellerPrice, setSellerPrice] = useState(stock.seller_profit);
  const [sellerValue, setSellerValue] = useState(0);
  const [sellerProfit, setSellerProfit] = useState(0);

  function changeValue(
    e: ChangeEvent<HTMLInputElement> | number,
    setState: Dispatch<SetStateAction<number>>
  ) {
    const value = typeof e === "number" ? e : Number(e.target.value) || 0;
    setState(value);
  }

  function updateValue() {
    setEditParentAmount(true);
    setEditAmountValue(true);
  }

  useEffect(() => {
    changeValue(extra.amount, setAmount);
    setEditAmountValue(false);
  }, [extra.amount]);

  useEffect(() => {
    if (!stock) return;
    setPurchaseValue(amount * stock.purchase_price);
    setSaleValue(amount * salePrice);
    setProfitValue((salePrice - stock.purchase_price) * amount);

    setSellerValue(amount * sellerPrice);
    setSellerProfit((sellerPrice - salePrice) * amount);
  }, [amount, salePrice, sellerPrice, sellerValue, stock]);

  useEffect(() => {
    setState((props) => {
      return {
        ...props,
        [index]: {
          amount: amount,
          cost: stock.purchase_price,
          total_cost: purchaseValue,
          sale: salePrice,
          total_sale: saleValue,
          total_profit: profitValue,

          seller_price: sellerPrice,
          total_seller_sale: sellerValue,
          total_seller_profit: sellerProfit,
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
    amount,
    index,
    profitValue,
    purchaseValue,
    salePrice,
    saleValue,
    sellerPrice,
    sellerProfit,
    sellerValue,
    setState,
    stock.purchase_price,
  ]);

  return (
    <>
      <Column $gridColumn="1 / 4">
        {stock.created_at.toDate().toLocaleDateString()}
      </Column>
      <Column $gridColumn="4 / 5">
        <Input
          onChange={(e) => {
            changeValue(e, setAmount);
          }}
          onClick={updateValue}
          onFocus={updateValue}
          type="number"
          value={!editAmountValue ? extra.amount : undefined}
          max={stock.amount}
          min={0}
          step={0.01}
        />
      </Column>
      <Column $gridColumn="5 / 6">{stock.purchase_price}</Column>
      <Column $gridColumn="6 / 7" title={purchaseValue.toLocaleString()}>
        {purchaseValue.toLocaleString()}
      </Column>
      <Column $gridColumn="7 / 8">
        {stock.sale_price ? (
          <Input
            onChange={(e) => changeValue(e, setSalePrice)}
            type="number"
            min={stock.purchase_price}
            defaultValue={salePrice || stock.sale_price}
            step={0.01}
          />
        ) : (
          "~"
        )}
      </Column>
      <Column $gridColumn="8 / 9" title={saleValue.toLocaleString()}>
        {saleValue.toLocaleString()}
      </Column>
      <Column $gridColumn="9 / 10" title={profitValue.toLocaleString()}>
        {profitValue.toLocaleString()}
      </Column>
      {hasInventory && (
        <>
          <Column $gridColumn="10 / 11">
            {stock.seller_profit ? (
              <Input
                onChange={(e) => changeValue(e, setSellerPrice)}
                type="number"
                min={salePrice}
                defaultValue={sellerPrice || stock.seller_profit}
                step={0.01}
              />
            ) : (
              "~"
            )}
          </Column>
          <Column $gridColumn="11 / 12" title={sellerValue.toLocaleString()}>
            {sellerValue.toLocaleString()}
          </Column>
          <Column $gridColumn="12 / 13" title={sellerProfit.toLocaleString()}>
            {sellerProfit.toLocaleString()}
          </Column>
        </>
      )}
      <Column $gridColumn="-1 / -2"></Column>
    </>
  );
}

import { Icon } from "@/components/Icons";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { productDoc } from "@/tools/products/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";
import { ProductContainer } from "../ProductList";
import { Extra } from "./Extra";

export type ExtraPrices = {
  stockPosition: number;
  amount: number;
};

export type extraValues = {
  cost: number;
  total_cost: number;
  sale: number;
  total_sale: number;
  total_profit: number;
  seller_price: number;
  total_seller_sale?: number;
  total_seller_profit?: number;
};

export const Column = styled(Container)<{ $gridColumn: string }>`
  grid-column: ${(props) => props.$gridColumn};
  border-right: solid 1px ${globalCSSVars["--detail"]};
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProductName = styled.span`
  display: inline-block;
  width: 100%; // Define el ancho máximo del contenedor
  white-space: nowrap; /* Evita que el texto haga saltos de línea */
  overflow: hidden; /* Oculta el texto que excede el ancho */
  text-overflow: ellipsis;
  cursor: help;
`;

export const Input = styled.input`
  width: 100%;
  height: 100%;
  border: none;
  border-bottom: 1px solid ${globalCSSVars["--detail"]};
  padding: 0;
  font-size: 1rem;
`;

const ExtraButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  cursor: pointer;
`;

interface props {
  product: QueryDocumentSnapshot<productDoc>;
  hasInventory: boolean | undefined;
}

export function Product({ product, hasInventory }: props) {
  const data = useMemo(() => product.data(), [product]);
  const stocks = useMemo(() => {
    if (data.stock.length === 0) return undefined;
    return data.stock.sort(
      (a, b) => a.created_at.seconds - b.created_at.seconds
    );
  }, [data.stock]);
  const currentStock = stocks ? stocks[0] : undefined;
  const stockAmount = useMemo(() => {
    const amounts = data.stock.map((_) => _.amount);
    let sum = 0;

    for (let index = 0; index < amounts.length; index++) {
      const amount = amounts[index];
      sum = sum + amount;
    }

    return sum;
  }, [data.stock]);
  const [fold, setFold] = useState(false);
  const [amount, setAmount] = useState(0);
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [salePrice, setSalePrice] = useState(currentStock?.sale_price || 0);
  const [saleValue, setSaleValue] = useState(0);
  const [profitValue, setProfitValue] = useState(0);
  const [sellerPrice, setSellerPrice] = useState(
    currentStock?.seller_profit || 0
  );
  const [sellerValue, setSellerValue] = useState(0);
  const [sellerProfit, setSellerProfit] = useState(0);

  const [ExtraPrices, setExtraPrices] = useState<ExtraPrices[]>([]);

  const [extraValues, setExtraValues] = useState<Record<number, extraValues>>(
    {}
  );

  function amountListener(e: ChangeEvent<HTMLInputElement>) {
    let remainingAmount = Number(e.target.value);

    setExtraPrices([]);
    if (remainingAmount <= 0) return;
    if (!stocks) return;

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];

      const remaining = remainingAmount - stock.amount;

      if (remaining > 0) {
        remainingAmount = remaining;
        setExtraPrices((props) => [
          ...props,
          { amount: stock.amount, stockPosition: index },
        ]);
      } else {
        setExtraPrices((props) => [
          ...props,
          { amount: remainingAmount, stockPosition: index },
        ]);
        break;
      }
    }
  }

  function checkPrices(field: keyof extraValues, diff: number) {
    return Object.values(extraValues).filter((el) => el[field] != diff);
  }

  function changeValue(
    e: ChangeEvent<HTMLInputElement>,
    setState: Dispatch<SetStateAction<number>>
  ) {
    const value = Number(e.target.value);
    setState(value);
  }

  function folding() {
    setFold(!fold);
  }

  useEffect(() => {
    if (!currentStock) return;
    if (ExtraPrices.length > 1) {
      function getValues(num: keyof extraValues) {
        return Object.values(extraValues)
          .map((el) => el[num] || 0)
          .reduce((accumulator, currentValue) => accumulator + currentValue);
      }

      setPurchaseValue(getValues("total_cost"));
      setSaleValue(getValues("total_sale"));
      setProfitValue(getValues("total_profit"));

      setSellerValue(getValues("total_seller_sale"));
      setSellerProfit(getValues("total_seller_profit"));
    } else {
      setPurchaseValue(amount * currentStock.purchase_price);
      setSaleValue(amount * salePrice);
      setProfitValue((salePrice - currentStock.purchase_price) * amount);

      setSellerValue(amount * sellerPrice);
      setSellerProfit((sellerPrice - salePrice) * amount);
    }
  }, [
    ExtraPrices.length,
    amount,
    currentStock,
    extraValues,
    salePrice,
    sellerPrice,
    sellerValue,
  ]);

  return (
    <ProductContainer $hasInventory={hasInventory} $withoutStock={stockAmount}>
      <Column $gridColumn="1 / 4">
        <ProductName
          title={`Hay ${stockAmount} existencias${
            data.stock.length > 1
              ? ` divididas en ${data.stock.length} entregas`
              : ""
          }`}
        >
          {data.name}
        </ProductName>
      </Column>
      <Column $gridColumn="4 / 5">
        <Input
          onChange={(e) => {
            changeValue(e, setAmount);
            amountListener(e);
          }}
          type="number"
          max={stockAmount}
          min={0}
          step={0.01}
        />
      </Column>
      <Column $gridColumn="5 / 6">
        {checkPrices("cost", currentStock?.purchase_price || 0).length > 0
          ? "~"
          : currentStock?.purchase_price || "~"}
      </Column>
      <Column $gridColumn="6 / 7" title={purchaseValue.toLocaleString()}>
        {purchaseValue.toLocaleString()}
      </Column>
      <Column $gridColumn="7 / 8">
        {checkPrices("sale", currentStock?.sale_price || 0).length > 0 ? (
          "~"
        ) : currentStock?.sale_price ? (
          <Input
            onChange={(e) => changeValue(e, setSalePrice)}
            type="number"
            min={currentStock.purchase_price}
            step={0.01}
            defaultValue={salePrice || currentStock.sale_price}
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
            {checkPrices("seller_price", currentStock?.seller_profit || 0)
              .length > 0 ? (
              "~"
            ) : currentStock?.seller_profit ? (
              <Input
                onChange={(e) => changeValue(e, setSellerPrice)}
                type="number"
                min={salePrice}
                step={0.01}
                defaultValue={sellerPrice || currentStock.seller_profit}
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
      <Column $gridColumn="-1 / -2">
        <ExtraButton onClick={folding}>
          <Icon iconType={fold ? "fold" : "unfold"} />
        </ExtraButton>
      </Column>
      <ProductContainer
        $children
        $hasInventory={hasInventory}
        $withoutStock={stockAmount}
        $fold={!fold}
      >
        {stocks &&
          ExtraPrices.map((el, i) => (
            <Extra
              key={i}
              extra={el}
              stock={stocks[el.stockPosition]}
              hasInventory={hasInventory}
              setState={setExtraValues}
              index={i}
            />
          ))}
      </ProductContainer>
    </ProductContainer>
  );
}

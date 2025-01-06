import { Icon } from "@/components/Icons";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { productDoc } from "@/tools/products/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled from "styled-components";
import { ProductContainer } from "../ProductList";
import { Cost } from "./Cost";
import { Button } from "@/styles/Form.styles";
import { Price } from "./Price";
import { numberParser } from "@/tools/numberPaser";

export type OutputsRequest = {
  stockPosition: number;
  amount: number;
};

export type OutputCostDescription = {
  amount: number;
  cost: number;
  total_cost: number;
};

export type priceRequest = {
  amount: number;
};

export type priceRequestDescription = {
  amount: number;
  sold_price: number;
  totalSold: number;
  seller_sold_price: number;
  totalSellerSold: number;
};

export const Column = styled(Container)<{
  $gridColumn: string;
  $removeBorder?: boolean;
}>`
  grid-column: ${(props) => props.$gridColumn};
  ${(props) =>
    !props.$removeBorder &&
    `border-right: solid 1px ${globalCSSVars["--detail"]};`}

  width: 100%;
  height: 25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  & > button {
    padding: 5px 10px;
    &:hover {
      transform: scale(1);
    }
    &:active {
      transform: scale(0.95);
    }
  }
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
  const [diffPurchasePrices, setDiffPurchasePrices] = useState(false);
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [salePrice, setSalePrice] = useState(currentStock?.sale_price || 0);
  const [diffSalePrices, setDiffSalePrices] = useState(false);
  const [saleValue, setSaleValue] = useState(0);
  const [profitValue, setProfitValue] = useState(0);
  const [diffSellerPrices, setDiffSellerPrices] = useState(false);
  const [sellerPrice, setSellerPrice] = useState(
    currentStock?.seller_profit || 0
  );
  const [sellerValue, setSellerValue] = useState(0);
  const [sellerProfit, setSellerProfit] = useState(0);

  const [costRequestsData, setCostRequestData] = useState<OutputsRequest[]>([]);

  const [costValues, setCostValues] = useState<
    Record<number, OutputCostDescription>
  >({});
  const [requestPricesValues, setRequestPricesValues] = useState<
    Array<priceRequest>
  >([{ amount }]);
  const [priceRequestDescription, setPriceRequestDescription] = useState<
    Record<number, priceRequestDescription>
  >({});
  const [editAmount, setEditAmount] = useState(true);

  function amountListener(e: ChangeEvent<HTMLInputElement>) {
    let remainingAmount = Number(e.target.value);

    setCostRequestData([]);
    if (remainingAmount <= 0) return;
    if (!stocks) return;

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];

      const remaining = remainingAmount - stock.amount;

      if (remaining > 0) {
        remainingAmount = remaining;
        setCostRequestData((props) => [
          ...props,
          { amount: stock.amount, stockPosition: index },
        ]);
      } else {
        setCostRequestData((props) => [
          ...props,
          { amount: remainingAmount, stockPosition: index },
        ]);
        break;
      }
    }
  }

  const checkCost = useCallback(
    function (field: keyof OutputCostDescription, diff: number) {
      const values = Object.values(costValues);
      if (values.length === 1) return [];

      return Object.values(costValues).filter((el) => el[field] != diff);
    },
    [costValues]
  );

  const checkPrice = useCallback(
    function (field: keyof priceRequestDescription, diff: number) {
      const values = Object.values(priceRequestDescription);
      if (values.length === 1) return [];

      return Object.values(priceRequestDescription).filter((el) => {
        return el[field] != diff;
      });
    },
    [priceRequestDescription]
  );

  function addNewPriceRequest() {
    setRequestPricesValues((props) => [...props, { amount: 0 }]);
  }

  function changeStateValue(
    e: ChangeEvent<HTMLInputElement>,
    setState: Dispatch<SetStateAction<number>>
  ) {
    const value = Number(e.target.value) || 0;
    setState(value);
  }

  function folding() {
    setFold(!fold);
  }

  function getCostValues(num: keyof OutputCostDescription) {
    const values = Object.values(costValues);
    if (values.length === 0) return 0;
    return values
      .map((el) => el[num] || 0)
      .reduce((accumulator, currentValue) => accumulator + currentValue);
  }

  function getSaleValues(num: keyof priceRequestDescription) {
    const values = Object.values(priceRequestDescription);
    if (values.length === 0) return 0;
    return values
      .map((el) => el[num] || 0)
      .reduce((accumulator, currentValue) => accumulator + currentValue);
  }

  useEffect(() => {
    if (requestPricesValues.length > 1) {
      setEditAmount(false);
    } else {
      if (amount === requestPricesValues[0].amount) return;
      setRequestPricesValues([{ amount: amount }]);
      setEditAmount(true);
    }
  }, [amount, requestPricesValues]);

  // effect to manage the costs
  useEffect(() => {
    if (!currentStock) return;
    setPurchaseValue(getCostValues("total_cost"));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costValues]);

  // effect to manage the sales
  useEffect(() => {
    setSaleValue(getSaleValues("totalSold"));
    setSellerValue(getSaleValues("totalSellerSold"));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceRequestDescription]);

  // useEffect to manage the profits
  useEffect(() => {
    setProfitValue(saleValue - purchaseValue);
    setSellerProfit(sellerValue - saleValue);
  }, [purchaseValue, saleValue, sellerValue]);

  // effects to manage if there are multiply prices
  useEffect(() => {
    setDiffPurchasePrices(
      checkCost("cost", currentStock?.purchase_price || 0).length > 0
    );
  }, [checkCost, currentStock?.purchase_price]);

  useEffect(() => {
    setDiffSalePrices(checkPrice("sold_price", salePrice).length > 0);
  }, [checkPrice, diffSalePrices, salePrice]);

  useEffect(() => {
    setDiffSellerPrices(
      checkPrice("seller_sold_price", sellerPrice || 0).length > 0
    );
  }, [checkPrice, sellerPrice]);

  return (
    <ProductContainer $hasInventory={hasInventory} $withoutStock={stockAmount}>
      <Column $gridColumn="1 / 4">
        <ProductName
          title={`Hay ${stockAmount} existencias${
            data.stock.length > 1
              ? ` divididas en ${data.stock.length} entradas`
              : ""
          }`}
        >
          {data.name}
        </ProductName>
      </Column>
      <Column $gridColumn="4 / 5">
        <Input
          onClick={() => setEditAmount(true)}
          onChange={(e) => {
            changeStateValue(e, setAmount);
            amountListener(e);
          }}
          type="number"
          value={!editAmount ? getCostValues("amount") : undefined}
          max={stockAmount}
          min={0}
          step={0.01}
        />
      </Column>
      <Column $gridColumn="5 / 6">
        {diffPurchasePrices ? "~" : currentStock?.purchase_price || "~"}
      </Column>
      <Column $gridColumn="6 / 7" title={numberParser(purchaseValue)}>
        {numberParser(purchaseValue)}
      </Column>
      <Column $gridColumn="7 / 8">
        {diffSalePrices ? (
          "~"
        ) : currentStock?.sale_price ? (
          <Input
            onChange={(e) => changeStateValue(e, setSalePrice)}
            type="number"
            min={currentStock.purchase_price}
            step={0.01}
            defaultValue={salePrice || currentStock.sale_price}
          />
        ) : (
          "~"
        )}
      </Column>
      <Column $gridColumn="8 / 9" title={numberParser(saleValue)}>
        {numberParser(saleValue)}
      </Column>
      <Column $gridColumn="9 / 10" title={numberParser(profitValue)}>
        {numberParser(profitValue)}
      </Column>
      {hasInventory && (
        <>
          <Column $gridColumn="10 / 11">
            {diffSellerPrices ? (
              "~"
            ) : currentStock?.seller_profit ? (
              <Input
                onChange={(e) => changeStateValue(e, setSellerPrice)}
                type="number"
                min={salePrice}
                step={0.01}
                defaultValue={sellerPrice || currentStock.seller_profit}
              />
            ) : (
              "~"
            )}
          </Column>
          <Column $gridColumn="11 / 12" title={numberParser(sellerValue)}>
            {numberParser(sellerValue)}
          </Column>
          <Column $gridColumn="12 / 13" title={numberParser(sellerProfit)}>
            {numberParser(sellerProfit)}
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
        <Column $gridColumn="1 / -1" $removeBorder>
          <b>Precios de la salida detallados</b>
        </Column>
        {currentStock &&
          requestPricesValues.map((el, i) => (
            <Price
              key={i}
              hasInventory={hasInventory}
              stockInfo={currentStock}
              priceRequestLength={requestPricesValues.length}
              thePrice={salePrice}
              theSellerPrice={sellerPrice}
              priceRequest={el}
              setState={setPriceRequestDescription}
              index={i}
            />
          ))}
        <ProductContainer
          $children
          $hasInventory={hasInventory}
          $withoutStock={stockAmount}
        >
          <Column $gridColumn="4 / 8" $removeBorder>
            <Button onClick={addNewPriceRequest}>Agregar variaciones</Button>
          </Column>
        </ProductContainer>
        <Column $gridColumn="1 / -1" $removeBorder>
          <b>Costos de la salida detallados</b>
        </Column>
        {stocks &&
          costRequestsData.map((el, i) => (
            <Cost
              key={i}
              outputRequest={el}
              stockInfo={stocks[el.stockPosition]}
              hasInventory={hasInventory}
              setState={setCostValues}
              index={i}
            />
          ))}
      </ProductContainer>
    </ProductContainer>
  );
}

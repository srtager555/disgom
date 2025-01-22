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
import styled, { css } from "styled-components";
import { ProductContainer, productResult } from "../ProductList";
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

const ColumnGrid = styled(Container)<{
  $gridColumn: string;
  $printGridColumn?: string;
  $title?: string;
}>`
  grid-column: ${(props) => props.$gridColumn};
  width: 100%;
  height: 25px;

  @media print {
    display: ${(props) => (props.$printGridColumn ? "block" : "none")};
    grid-column: ${(props) => props.$printGridColumn};
  }

  background-color: inherit;

  &:hover {
    &:before {
      opacity: 1;
    }
  }

  &:before {
    ${(props) =>
      props.$title &&
      css`
        content: ${JSON.stringify(props.$title)};
      `};
    position: absolute;
    top: calc(50% - 1px);
    left: -10px;
    transform: translateY(-50%);
    height: 100%;
    padding: 5px 10px;
    background-color: inherit;
    opacity: 0;
    transition: all 200ms ease;
    z-index: 1;
    box-shadow: 10px 10px 15px #0002;
  }
`;

function ColumnBase({
  children,
  className,
  gridColumn: $gridColumn,
  printGridColumn,
  title,
}: {
  children: children;
  className?: string;
  gridColumn: string;
  printGridColumn?: string;
  title?: string;
}) {
  return (
    <ColumnGrid
      $title={title}
      $gridColumn={$gridColumn}
      $printGridColumn={printGridColumn}
      styles={{ width: "100%", height: "100%" }}
    >
      <Container className={className}>{children}</Container>
    </ColumnGrid>
  );
}

export const Column = styled(ColumnBase)<{
  $removeBorder?: boolean;
  $left?: boolean;
}>`
  ${(props) =>
    !props.$removeBorder &&
    `border-right: solid 1px ${globalCSSVars["--detail"]};`}

  @media print {
    padding-right: 10px;
    ${(props) => props.$left && `text-align: end;`}
  }
  width: 100%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: inherit;

  & > button {
    padding: 0px;
    border: none;
    text-decoration: underline;
    &:hover {
      transform: scale(1);
    }
    &:active {
      transform: scale(0.95);
    }
  }
`;

export const ProductName = styled.span`
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

export const ExtraButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  cursor: pointer;
`;

interface props {
  product: QueryDocumentSnapshot<productDoc>;
  hasInventory: boolean | undefined;
  setProductsResults: Dispatch<SetStateAction<Record<string, productResult>>>;
  hideWithoutStock: boolean;
}

export function Product({
  product,
  hasInventory,
  hideWithoutStock,
  setProductsResults,
}: props) {
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
  const hideProduct = useMemo(
    () => (hideWithoutStock ? stockAmount === 0 : false),
    [hideWithoutStock, stockAmount]
  );

  const amountListener = useCallback(
    function (n: number) {
      let remainingAmount = n;

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
    },
    [stocks]
  );

  const checkCost = useCallback(
    function (field: keyof OutputCostDescription) {
      const values = Object.values(costValues);
      if (values.length === 1) return [];

      return Object.values(costValues).filter((el) => el[field]);
    },
    [costValues]
  );

  const checkPrice = useCallback(
    function (field: keyof priceRequestDescription) {
      const values = Object.values(priceRequestDescription);
      if (values.length === 1) return [];

      return Object.values(priceRequestDescription).filter((el) => {
        return el[field];
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

  const getCostValues = useCallback(
    function (num: keyof OutputCostDescription) {
      const values = Object.values(costValues);
      if (values.length === 0) return 0;
      return values
        .map((el) => el[num] || 0)
        .reduce((accumulator, currentValue) => accumulator + currentValue);
    },
    [costValues]
  );

  const getSaleValues = useCallback(
    function (num: keyof priceRequestDescription) {
      const values = Object.values(priceRequestDescription);
      if (values.length === 0) return 0;
      return values
        .map((el) => el[num] || 0)
        .reduce((accumulator, currentValue) => accumulator + currentValue);
    },
    [priceRequestDescription]
  );

  useEffect(() => {
    if (requestPricesValues.length > 1) {
      setEditAmount(false);
    } else {
      if (amount === requestPricesValues[0].amount) return;
      setRequestPricesValues([{ amount: amount }]);
      setEditAmount(true);
    }
  }, [amount, requestPricesValues]);

  // effect to manage the values
  useEffect(() => {
    const cost = getCostValues("total_cost");
    const totalSold = getSaleValues("totalSold");
    const totalSellerSold = getSaleValues("totalSellerSold");
    const profit = totalSold - cost;
    const seller_profit = totalSellerSold - totalSold;

    setPurchaseValue(cost);

    setSaleValue(totalSold);
    setSellerValue(totalSellerSold);

    setProfitValue(profit);
    setSellerProfit(seller_profit);
  }, [getCostValues, getSaleValues, priceRequestDescription]);

  // effects to manage if there are multiply prices
  useEffect(() => {
    setDiffPurchasePrices(checkCost("cost").length > 0);
  }, [checkCost, currentStock?.purchase_price]);

  useEffect(() => {
    setDiffSalePrices(checkPrice("sold_price").length > 0);
  }, [checkPrice, diffSalePrices, salePrice]);

  useEffect(() => {
    setDiffSellerPrices(checkPrice("seller_sold_price").length > 0);
  }, [checkPrice, sellerPrice]);

  // effect to manage the amount when have more than 1 price
  useEffect(() => {
    amountListener(getSaleValues("amount"));
  }, [amountListener, checkPrice, getSaleValues]);

  // effect to update the product result
  useEffect(() => {
    // delete the result if the amount is 0
    if (amount === 0) {
      setProductsResults((props) => {
        const arr = { ...props };
        delete arr[product.id];

        return arr;
      });

      return;
    }

    const result = {
      amount,
      cost: purchaseValue,
      sold: {
        total: saleValue,
        variations: Object.values(priceRequestDescription).map((el) => ({
          price: el.sold_price,
          amount: el.amount,
        })),
      },
      seller_sold: {
        total: sellerValue,
        variations: Object.values(priceRequestDescription).map((el) => ({
          price: el.seller_sold_price,
          amount: el.amount,
        })),
      },
      profit: profitValue,
      seller_profit: sellerProfit,
    };

    // add the result
    setProductsResults((props) => {
      return {
        ...props,
        [product.id]: result,
      };
    });
  }, [
    amount,
    priceRequestDescription,
    product.id,
    profitValue,
    purchaseValue,
    saleValue,
    sellerProfit,
    sellerValue,
    setProductsResults,
  ]);

  return (
    <ProductContainer
      $hide={hideProduct}
      $hasInventory={hasInventory}
      $withoutStock={stockAmount}
      $after={`${stockAmount} / ${data.stock.length}`}
    >
      <Column gridColumn="1 / 4">
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
      <Column gridColumn="4 / 5">
        {Object.values(priceRequestDescription).length > 1 ? (
          getSaleValues("amount")
        ) : (
          <Input
            onClick={() => setEditAmount(true)}
            onChange={(e) => {
              changeStateValue(e, setAmount);
              amountListener(Number(e.target.value));
            }}
            type="number"
            value={!editAmount ? getCostValues("amount") : undefined}
            max={stockAmount}
            min={0}
            step={data.step}
          />
        )}
      </Column>
      <Column gridColumn="5 / 6">
        {diffPurchasePrices ? "~" : currentStock?.purchase_price || "~"}
      </Column>
      <Column gridColumn="6 / 7" title={numberParser(purchaseValue)}>
        {numberParser(purchaseValue)}
      </Column>
      <Column gridColumn="7 / 8">
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
      <Column gridColumn="8 / 9" title={numberParser(saleValue)}>
        {numberParser(saleValue)}
      </Column>
      <Column gridColumn="9 / 10" title={numberParser(profitValue)}>
        {numberParser(profitValue)}
      </Column>
      {hasInventory && (
        <>
          <Column gridColumn="10 / 11">
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
          <Column gridColumn="11 / 12" title={numberParser(sellerValue)}>
            {numberParser(sellerValue)}
          </Column>
          <Column gridColumn="12 / 13" title={numberParser(sellerProfit)}>
            {numberParser(sellerProfit)}
          </Column>
        </>
      )}
      <Column gridColumn="-1 / -2">
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
        <Column gridColumn="1 / -1" $removeBorder>
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
              setSaleData={setPriceRequestDescription}
              saleData={priceRequestDescription}
              setRequestData={setRequestPricesValues}
              index={i}
            />
          ))}
        <ProductContainer
          $children
          $hasInventory={hasInventory}
          $withoutStock={stockAmount}
        >
          <Column gridColumn="4 / 8" $removeBorder>
            <Button onClick={addNewPriceRequest}>Agregar variaciones</Button>
          </Column>
        </ProductContainer>
        <Column gridColumn="1 / -1" $removeBorder>
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

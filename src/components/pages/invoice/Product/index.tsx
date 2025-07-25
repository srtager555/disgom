import { Icon } from "@/components/Icons";
import { globalCSSVars } from "@/styles/colors";
import { Container } from "@/styles/index.styles";
import { productDoc } from "@/tools/products/create";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import styled, { css, CSSProperties } from "styled-components";
import { ProductContainer, productResult } from "../ProductList";
import { Cost } from "./Cost";
import { Button } from "@/styles/Form.styles";
import { Price } from "./Price";
import { numberParser } from "@/tools/numberPaser";
import { outputType } from "@/tools/products/addOutputs";
import { stockType } from "@/tools/products/addToStock";

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
  normal_price?: number;
  seller_price?: number;
};

export type priceRequestDescription = {
  amount: number;
  sold_price: number;
  totalSold: number;
  seller_sold_price: number;
  totalSellerSold: number;
};

const ColumnGrid = styled(Container)<{
  $gridColumn?: string;
  $printGridColumn?: string;
  $title?: string;
  $removeBorder?: boolean;
  $hideOnPrint?: boolean;
}>`
  grid-column: ${(props) => props.$gridColumn};
  width: 100%;
  height: calc(100% - 1px);
  ${(props) => {
    if (props.$removeBorder) return;

    return css`
      &:last-child {
        border-right: none;
      }
      border-right: 1px solid ${globalCSSVars["--detail"]};
    `;
  }}

  @media print {
    display: ${(props) => (props.$hideOnPrint ? "none" : "block")};
    grid-column: ${(props) => props.$printGridColumn};
  }

  background-color: inherit;

  &:hover {
    &:before {
      opacity: 1;
    }
  }

  &:before {
    display: flex;
    align-items: center;
    ${(props) =>
      props.$title &&
      css`
        content: ${JSON.stringify(props.$title)};
      `};
    position: absolute;
    top: 50%;
    left: 0px;
    transform: translateY(-50%);
    height: 100%;
    width: 100%;
    padding: 0 5px;
    background-color: ${globalCSSVars["--background"]};
    opacity: 0;
    transition: all 200ms ease;
    z-index: 1;
    box-shadow: 10px 10px 15px #0002;
    cursor: help;
  }
`;

interface ColumnBaseProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: children;
  className?: string;
  gridColumn?: string;
  printGridColumn?: string;
  title?: string;
  hide?: boolean;
  styles?: CSSProperties;
  hideOnPrint?: boolean;
  ref?: unknown;
}

function ColumnBase({
  children,
  className,
  gridColumn: $gridColumn,
  printGridColumn,
  title,
  hide,
  styles,
  ref,
  ...props
}: ColumnBaseProps) {
  if (hide) return <></>;
  return (
    <ColumnGrid
      $title={title}
      $gridColumn={$gridColumn}
      $printGridColumn={printGridColumn}
      $hideOnPrint={props.hideOnPrint}
      styles={{ width: "100%", height: "100%", ...styles }}
      ref={ref}
      {...props}
    >
      <Container className={className}>{children}</Container>
    </ColumnGrid>
  );
}

export const Column = styled(ColumnBase)<{
  $left?: boolean;
  $textAlign?: string;
}>`
  @media print {
    padding-right: 10px;
    ${(props) => props.$left && `text-align: end;`}
  }
  width: 100%;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* line-height: 0px; */
  text-align: ${(props) => props.$textAlign || "start"};
  background-color: inherit;
  padding: 3px 5px;
  padding-bottom: 0px;
  /* padding-left: 10px; */

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
  padding: 2px 5px;
  font-size: 1rem;
  text-align: center;

  @media print {
    font-size: 0.8rem;
    background-color: transparent;
  }

  @media (prefers-color-scheme: light) {
    background-color: #a9faf6;

    @media print {
      background-color: transparent;
    }
  }
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
  previusOutputsToEdit: DocumentSnapshot<outputType>[];
}

export function Product({
  product,
  hasInventory,
  hideWithoutStock,
  setProductsResults,
  previusOutputsToEdit,
}: props) {
  const data = useMemo(() => product.data(), [product]);
  const stocks = useMemo(() => {
    if (data.stock.length === 0) return undefined;

    const sortedStock = data.stock.sort(
      (a, b) => a.created_at.seconds - b.created_at.seconds
    );

    const previusStock: stockType[] = previusOutputsToEdit.map((el) => {
      const data = el.data();
      return {
        amount: data?.amount,
        purchase_price: data?.cost_price,
        sale_price: data?.sale_prices.normal,
        seller_profit: data?.sale_prices.seller,
        created_at: data?.created_at,
        entry_ref: data?.entry_ref,
      } as stockType;
    });

    return [...previusStock, ...sortedStock];
  }, [data.stock, previusOutputsToEdit]);
  const currentStock = stocks ? stocks[0] : undefined;
  const lastStock = stocks ? stocks[stocks.length - 1] : undefined;
  const stockAmount = useMemo(() => {
    if (!stocks) return 0;

    const amounts = stocks.map((_) => _.amount);
    let sum = 0;

    for (let index = 0; index < amounts.length; index++) {
      const amount = amounts[index];
      sum = sum + amount;
    }

    return sum;
  }, [stocks]);
  const [fold, setFold] = useState(false);
  const [amount, setAmount] = useState(0);

  // states to manage the prices
  const [salePrice, setSalePrice] = useState(lastStock?.sale_price || 0);
  const [sellerPrice, setSellerPrice] = useState(lastStock?.seller_profit || 0);
  const [diffPurchasePrices, setDiffPurchasePrices] = useState(false);
  const [diffSellerPrices, setDiffSellerPrices] = useState(false);
  const [diffSalePrices, setDiffSalePrices] = useState(false);

  // states to manage the totals of the operations
  const [purchaseValue, setPurchaseValue] = useState(0);
  const [saleValue, setSaleValue] = useState(0);
  const [profitValue, setProfitValue] = useState(0);
  const [sellerValue, setSellerValue] = useState(0);
  const [sellerProfit, setSellerProfit] = useState(0);

  const [costValues, setCostValues] = useState<
    Record<number, OutputCostDescription>
  >({});

  // states to request informaction about the prices
  const [costRequestsData, setCostRequestData] = useState<OutputsRequest[]>([]);
  const [requestPricesValues, setRequestPricesValues] = useState<
    Array<priceRequest>
  >([{ amount }]);
  const [priceRequestDescription, setPriceRequestDescription] = useState<
    Record<number, priceRequestDescription>
  >({});

  // statet to manage the edit mode
  const [editAmount, setEditAmount] = useState(false);
  const [editNormalPrice, setEditNormalPrice] = useState(false);
  const [editSellerPrice, setEditSellerPrice] = useState(false);

  const priceRequestCurrentAmount = useMemo(() => {
    const request = Object.values(priceRequestDescription);

    const amount = request.reduce((before, now) => {
      return before + now.amount;
    }, 0);

    return amount;
  }, [priceRequestDescription]);

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

  // callback to check if there is more than one cost on the product
  const checkCost = useCallback(
    function (field: keyof OutputCostDescription) {
      const values = Object.values(costValues);
      if (values.length === 1) return [];

      return Object.values(costValues).filter((el) => el[field]);
    },
    [costValues]
  );

  // instead of checking the cost, this callback checks the product prices
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

  // This function add a new price variation in the product
  function addNewPriceRequest() {
    setRequestPricesValues((props) => [...props, { amount: 0 }]);
  }

  // this function is to update a state
  function changeStateValue(
    e: ChangeEvent<HTMLInputElement>,
    setState: Dispatch<SetStateAction<number>>
  ) {
    const value = Number(e.target.value) || 0;
    setState(value);
  }

  // this function is to switch the fold
  function folding() {
    setFold(!fold);
  }

  // This function is to get the total of a specific field of the Cost
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

  // this function do the same process but with the Sales
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

  // effect to manage the price requests
  useEffect(() => {
    if (requestPricesValues.length > 1) return;

    if (amount === requestPricesValues[0].amount) return;
    setRequestPricesValues([{ amount: amount }]);
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
    if (amount === 0 && editAmount) {
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
    editAmount,
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

  // ======== effects to manage the edit mode ======== //

  // this effect is to add the respective price request with
  //  the previus outputs to edit
  useEffect(() => {
    if (previusOutputsToEdit.length <= 1 || requestPricesValues.length > 1)
      return;

    const newDefaultRequestPriceValues = previusOutputsToEdit.map((el) => {
      const data = el.data() as outputType;

      return {
        amount: data?.amount,
        normal_price: data.sale_prices.normal,
        seller_price: data.sale_prices.seller,
      } as priceRequest;
    });

    if (newDefaultRequestPriceValues.length > 0)
      setRequestPricesValues(newDefaultRequestPriceValues);
  }, [previusOutputsToEdit, requestPricesValues.length]);

  // effect to set the preview amount hen the edit
  // mode is on
  useEffect(() => {
    if (previusOutputsToEdit.length != 1 || editAmount) return;

    const amount = previusOutputsToEdit[0].data()?.amount as number;

    setAmount(amount);
  }, [previusOutputsToEdit, editAmount]);

  return (
    <ProductContainer
      $hide={hideProduct}
      $hasInventory={false}
      $withoutStock={stockAmount}
      $after={`${stockAmount - amount} / ${data.stock.length}`}
      className={
        amount > stockAmount || priceRequestCurrentAmount > stockAmount
          ? "alert"
          : ""
      }
    >
      <>
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
        <Column gridColumn="">
          {diffPurchasePrices ? "~" : currentStock?.purchase_price || "~"}
        </Column>
        <Column gridColumn="">
          {Object.values(priceRequestDescription).length > 1 ? (
            getSaleValues("amount")
          ) : (
            <Input
              onChange={(e) => {
                changeStateValue(e, setAmount);
                amountListener(Number(e.target.value));
              }}
              onClick={() => setEditAmount(true)}
              onSelect={() => setEditAmount(true)}
              value={!editAmount ? requestPricesValues[0].amount : undefined}
              type="number"
              max={stockAmount}
              min={0}
              step={data.step}
            />
          )}
        </Column>
        <Column gridColumn="">
          <Input type="number" defaultValue={"0"} />
        </Column>
        <Column gridColumn="" title={numberParser(saleValue)}>
          {numberParser(saleValue)}
        </Column>
        <Column gridColumn="">
          {diffSalePrices ? (
            "~"
          ) : currentStock?.sale_price ? (
            <Input
              onChange={(e) => changeStateValue(e, setSalePrice)}
              type="number"
              min={currentStock.purchase_price}
              step={0.01}
              onClick={() => setEditNormalPrice(true)}
              onSelect={() => setEditNormalPrice(true)}
              value={
                !editNormalPrice
                  ? requestPricesValues[0].normal_price ||
                    salePrice ||
                    currentStock.sale_price
                  : undefined
              }
            />
          ) : (
            "~"
          )}
        </Column>
        <Column gridColumn="" title={numberParser(profitValue)}>
          {numberParser(profitValue)}
        </Column>
        <Column gridColumn="" title={numberParser(profitValue)}>
          {numberParser(profitValue)}
        </Column>
        <Column gridColumn="11 / 12">
          <Container styles={{ marginRight: "10px" }}>
            <ExtraButton onClick={folding}>
              <Icon iconType={fold ? "fold" : "unfold"} />
            </ExtraButton>
          </Container>
        </Column>
      </>
      <ProductContainer
        $children
        $hasInventory={hasInventory}
        $withoutStock={stockAmount}
        $fold={!fold}
      >
        <Column gridColumn="1 / -1" $removeBorder>
          <b>Precios de la salida detallados</b>
        </Column>
        {requestPricesValues.map((el, i) => (
          <Price
            key={i}
            hasInventory={hasInventory}
            priceRequestLength={requestPricesValues.length}
            thePrice={salePrice}
            theSellerPrice={sellerPrice}
            priceRequest={el}
            setSaleData={setPriceRequestDescription}
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

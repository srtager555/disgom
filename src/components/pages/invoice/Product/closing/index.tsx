import { Column, ExtraButton, Input } from "..";
import { ProductContainer } from "../../ProductList";
import { rawProductWithInventory } from "@/pages/invoices/closing";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { productDoc } from "@/tools/products/create";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { Firestore } from "@/tools/firestore";
import { Icon } from "@/components/Icons";
import { numberParser } from "@/tools/numberPaser";
import { Price } from "./Price";
import { Cost } from "./Cost";
import { Inv } from "./Inv";
import { inventory_product_data } from "@/tools/sellers/invetory/addProduct";

type props = {
  data: rawProductWithInventory;
  product_id: string;
  setNewInventoryToCreate: Dispatch<
    SetStateAction<Record<string, inventory_product_data[]>>
  >;
};

export function ProductClosing({
  product_id,
  data,
  setNewInventoryToCreate,
}: props) {
  const [product, setProduct] = useState<DocumentSnapshot<productDoc>>();
  const productData = useMemo(() => product?.data(), [product]);
  const [fold, setFold] = useState(false);
  const [amoutnSold, setAmoutnSold] = useState(0);

  const costPrices = useMemo(() => {
    const ioqnfjwn = [...data.purchases_amounts, ...data.inventory];
    const prices = ioqnfjwn.map((el) => {
      if ("price" in el) return el.price;

      return el.purchase_price;
    });
    const diff = prices.filter((el) => el != prices[0]);

    return diff.length > 0 ? "~" : numberParser(prices[0]);
  }, [data]);

  const normalSalePrices = useMemo(() => {
    const prices = data.sales_amounts.map((el) => el.normal_price);
    const diff = prices.filter((el) => el != prices[0]);

    return diff.length > 0 ? "~" : numberParser(prices[0]);
  }, [data]);
  const sellerSalePrices = useMemo(() => {
    const prices = data.sales_amounts.map((el) => el.seller_price);
    const diff = prices.filter((el) => el != prices[0]);

    return diff.length > 0 ? "~" : numberParser(prices[0]);
  }, [data]);

  const inventoryAmount = useMemo(() => {
    return data.inventory.reduce(
      (before, now) => {
        return {
          amount: before.amount + now.amount,
          total: before.total + now.purchase_price * (now.amount - amoutnSold),
        };
      },
      {
        amount: 0,
        total: 0,
      }
    );
  }, [amoutnSold, data.inventory]);

  const load = useMemo(() => {
    return data.purchases_amounts.reduce(
      (before, now) => {
        return {
          amount: before.amount + now.amount,
          total: before.total + now.price * (now.amount - amoutnSold),
        };
      },
      {
        amount: 0,
        total: 0,
      }
    );
  }, [amoutnSold, data.purchases_amounts]);

  const totalSales = useMemo(() => {
    return data.sales_amounts.reduce(
      (before, now) => {
        return {
          sale:
            before.sale +
            now.normal_price *
              (inventoryAmount.amount + load.amount - amoutnSold),
          seller_sale:
            before.seller_sale +
            now.seller_price *
              (load.amount + inventoryAmount.amount - amoutnSold),
        };
      },
      {
        sale: 0,
        seller_sale: 0,
      }
    );
  }, [amoutnSold, data.sales_amounts, inventoryAmount.amount, load.amount]);

  const amountListener = useCallback(
    function (n: number) {
      let remainingAmount = n;

      const stocks = [...data.inventory, ...data.purchases_amounts];

      if (remainingAmount <= 0) return;
      if (!product) return;

      setNewInventoryToCreate((props) => {
        const all = { ...props };
        delete all[product.id];
        return all;
      });

      for (let index = 0; index < stocks.length; index++) {
        const stock = stocks[index];

        const remaining = remainingAmount - stock.amount;

        if (remaining > 0) {
          remainingAmount = remaining;
          const same = {
            amount: stock.amount,
            product_ref: product.ref,
          };

          setNewInventoryToCreate((props) => {
            return {
              ...props,
              [product.id]:
                "price" in stock
                  ? [
                      ...(props[product.id] || []),
                      { ...same, purchase_price: stock.price },
                    ]
                  : [
                      ...(props[product.id] || []),
                      { ...same, purchase_price: stock.purchase_price },
                    ],
            };
          });
        } else {
          const same = {
            amount: remainingAmount,
            product_ref: product.ref,
          };
          setNewInventoryToCreate((props) => {
            return {
              ...props,
              [product.id]:
                "price" in stock
                  ? [
                      ...(props[product.id] || []),
                      { ...same, purchase_price: stock.price },
                    ]
                  : [
                      ...(props[product.id] || []),
                      { ...same, purchase_price: stock.purchase_price },
                    ],
            };
          });
          break;
        }
      }
    },
    [data.inventory, data.purchases_amounts, product, setNewInventoryToCreate]
  );

  function onChangeAmountSold(e: ChangeEvent<HTMLInputElement>) {
    setAmoutnSold(e.target.value != "" ? Number(e.target.value) : 0);
  }

  // effect to get the product
  useEffect(() => {
    async function getProduct() {
      const db = Firestore();
      const prodRef = doc(
        db,
        ProductsCollection.root,
        product_id
      ) as DocumentReference<productDoc>;
      const p = await getDoc(prodRef);
      setProduct(p);
    }

    getProduct();
  }, [product_id]);

  // effect to manage the new inventory
  useEffect(() => {
    const cargaTotal = inventoryAmount.amount + load.amount;
    const restante = cargaTotal - amoutnSold;

    if (restante !== cargaTotal)
      amountListener(inventoryAmount.amount + load.amount - amoutnSold);
  }, [amountListener, amoutnSold, inventoryAmount.amount, load.amount]);

  return (
    <ProductContainer
      $header
      $withoutStock={1}
      $hasInventory
      $closing
      $warn={inventoryAmount.amount + load.amount - amoutnSold < 0}
    >
      <Column gridColumn="1 / 4">{productData?.name}</Column>
      <Column gridColumn="">{numberParser(inventoryAmount.amount)}</Column>
      <Column gridColumn="">{numberParser(load.amount)}</Column>
      <Column gridColumn="">
        {numberParser(inventoryAmount.amount + load.amount)}
      </Column>
      <Column gridColumn="">
        <Input
          type="number"
          onChange={onChangeAmountSold}
          step={productData?.step}
          min={0}
        />
      </Column>
      <Column gridColumn="">
        {numberParser(inventoryAmount.amount + load.amount - amoutnSold)}
      </Column>
      <Column gridColumn="">{costPrices}</Column>
      <Column
        gridColumn=""
        title={numberParser(inventoryAmount.total + load.total)}
      >
        {numberParser(inventoryAmount.total + load.total)}
      </Column>
      <Column gridColumn="">{normalSalePrices}</Column>
      <Column gridColumn="" title={numberParser(totalSales.sale)}>
        {numberParser(totalSales.sale)}
      </Column>
      <Column
        gridColumn=""
        title={numberParser(
          totalSales.sale - inventoryAmount.total - load.total
        )}
      >
        {numberParser(totalSales.sale - inventoryAmount.total - load.total)}
      </Column>

      <Column gridColumn="">{sellerSalePrices}</Column>
      <Column gridColumn="" title={numberParser(totalSales.seller_sale)}>
        {numberParser(totalSales.seller_sale)}
      </Column>
      <Column
        gridColumn=""
        title={numberParser(totalSales.seller_sale - totalSales.sale)}
      >
        {numberParser(totalSales.seller_sale - totalSales.sale)}
      </Column>

      <Column gridColumn="">
        <ExtraButton onClick={() => setFold(!fold)}>
          <Icon iconType={fold ? "fold" : "unfold"} />
        </ExtraButton>
      </Column>

      <ProductContainer
        $children
        $hasInventory={true}
        $closing
        $withoutStock={1}
        $fold={!fold}
      >
        <Column gridColumn="1 / -1" $removeBorder>
          <b>Precios de la salida detallados</b>
        </Column>
        {data.sales_amounts.map((el, i) => (
          <Price key={i} data={el} />
        ))}
        <Column gridColumn="1 / -1" $removeBorder>
          <b>Costos de la salida detallados</b>
        </Column>
        {data.purchases_amounts.map((el, i) => (
          <Cost key={i} data={el} />
        ))}
        {data.inventory.map((el, i) => (
          <Inv key={i} data={el} />
        ))}
      </ProductContainer>
    </ProductContainer>
  );
}

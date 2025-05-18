import { Column, ExtraButton, Input } from "..";
import { ProductContainer } from "../../ProductList";
import { rawProductWithInventory } from "@/trash/closing";
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
import { Inv, InvPrice } from "./Inv";
import { inventory_product_data } from "@/tools/sellers/invetory/addProduct";
import { totals_sold } from "./manager";

type props = {
  amountNotSold: number | undefined;
  data: rawProductWithInventory;
  product_id: string;
  setNewInventoryToCreate: Dispatch<
    SetStateAction<Record<string, inventory_product_data[]>>
  >;
  setTotals: Dispatch<SetStateAction<Record<string, totals_sold>>>;
};

export function ProductClosing({
  amountNotSold,
  product_id,
  data,
  setNewInventoryToCreate,
  setTotals,
}: props) {
  const [product, setProduct] = useState<DocumentSnapshot<productDoc>>();
  const productData = useMemo(() => product?.data(), [product]);
  const lastStock = useMemo(() => productData?.stock[0], [productData]);
  const [fold, setFold] = useState(false);
  const [amoutnSold, setAmoutnSold] = useState(0);
  const [editDevo, setEditDevo] = useState(false);

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
    if (data.sales_amounts.length === 0 && lastStock)
      return numberParser(lastStock.sale_price);

    const prices = data.sales_amounts.map((el) => el.normal_price);
    const diff = prices.filter((el) => el != prices[0]);

    return diff.length > 0 ? "~" : prices[0] ? numberParser(prices[0]) : "~";
  }, [data.sales_amounts, lastStock]);
  const sellerSalePrices = useMemo(() => {
    if (data.sales_amounts.length === 0 && lastStock)
      return numberParser(lastStock.seller_profit);

    const prices = data.sales_amounts.map((el) => el.seller_price);
    const diff = prices.filter((el) => el != prices[0]);

    return diff.length > 0 ? "~" : prices[0] ? numberParser(prices[0]) : "~";
  }, [data.sales_amounts, lastStock]);

  const inventoryAmount = useMemo(() => {
    return data.inventory.reduce(
      (before, now) => {
        const normal_price =
          data.sales_amounts.sort((a, b) => b.normal_price - a.normal_price)[0]
            ?.normal_price || lastStock?.sale_price;
        const seller_price =
          data.sales_amounts.sort((a, b) => b.seller_price - a.seller_price)[0]
            ?.seller_price || lastStock?.seller_profit;

        if (!normal_price || !seller_price)
          return {
            reducedAmountSold: amoutnSold,
            amount: 0,
            total: 0,
            total_sales: 0,
            total_seller_sales: 0,
          };

        return {
          amount: before.amount + now.amount,
          total:
            before.total +
            now.purchase_price *
              (before.reducedAmountSold > now.amount
                ? 0
                : now.amount - before.reducedAmountSold),
          total_sales:
            before.total_sales +
            normal_price *
              (before.reducedAmountSold > now.amount
                ? 0
                : now.amount - before.reducedAmountSold),
          total_seller_sales:
            before.total_seller_sales +
            seller_price *
              (before.reducedAmountSold > now.amount
                ? 0
                : now.amount - before.reducedAmountSold),
          reducedAmountSold:
            before.reducedAmountSold < now.amount
              ? 0
              : before.reducedAmountSold - now.amount,
        };
      },
      {
        reducedAmountSold: amoutnSold,
        amount: 0,
        total: 0,
        total_sales: 0,
        total_seller_sales: 0,
      }
    );
  }, [
    amoutnSold,
    data.inventory,
    data.sales_amounts,
    lastStock?.sale_price,
    lastStock?.seller_profit,
  ]);

  const load = useMemo(() => {
    const list = [...data.purchases_amounts, ...data.inventory];
    console.log("data", data.purchases_amounts);
    console.log("data inventory", data.inventory);

    return list.reduce(
      (before, now) => {
        if ("price" in now) {
          return {
            ...before,
            amount: before.amount + now.amount,
            total:
              before.total +
              now.price *
                (before.reducedAmountSold > now.amount
                  ? 0
                  : now.amount - before.reducedAmountSold),
            reducedAmountSold:
              before.reducedAmountSold < now.amount
                ? 0
                : before.reducedAmountSold - now.amount,
          };
        } else {
          return {
            ...before,
            amount: before.amount + now.amount,
            total_inventory:
              before.total_inventory +
              now.purchase_price *
                (before.reducedAmountSold > now.amount
                  ? 0
                  : now.amount - before.reducedAmountSold),
            // total_inve_sales:
            //   before.total_inve_sales +
            //   normal_price.normal_price *
            //     (before.reducedAmountSold > now.amount
            //       ? 0
            //       : now.amount - before.reducedAmountSold),
            // total_inve_seller_sales:
            //   before.total_inve_seller_sales +
            //   seller_price.seller_price *
            //     (before.reducedAmountSold > now.amount
            //       ? 0
            //       : now.amount - before.reducedAmountSold),
            reducedAmountSold:
              before.reducedAmountSold < now.amount
                ? 0
                : before.reducedAmountSold - now.amount,
          };
        }
      },
      {
        reducedAmountSold: amoutnSold,
        amount: 0,
        total: 0,
        total_inventory: 0,
        // total_inve_sales: 0,
        // total_inve_seller_sales: 0,
      }
    );
  }, [amoutnSold, data.inventory, data.purchases_amounts]);

  const totalSales = useMemo(() => {
    const list = [...data.sales_amounts, ...data.inventory];
    return list.reduce(
      (before, now) => {
        if ("normal_price" in now) {
          return {
            ...before,
            sale:
              before.sale +
              now.normal_price *
                (before.reducedAmountSold > now.amount
                  ? 0
                  : now.amount - before.reducedAmountSold),
            seller_sale:
              before.seller_sale +
              now.seller_price *
                (before.reducedAmountSold > now.amount
                  ? 0
                  : now.amount - before.reducedAmountSold),
            reducedAmountSold:
              before.reducedAmountSold < now.amount
                ? 0
                : before.reducedAmountSold - now.amount,
          };
        } else {
          const normal_price =
            data.sales_amounts.sort(
              (a, b) => b.normal_price - a.normal_price
            )[0]?.normal_price || lastStock?.sale_price;
          const seller_price =
            data.sales_amounts.sort(
              (a, b) => b.seller_price - a.seller_price
            )[0]?.seller_price || lastStock?.seller_profit;

          console.log(normal_price);

          if (!normal_price || !seller_price)
            return {
              ...before,
            };

          return {
            ...before,
            total_inve_sales:
              before.total_inve_sales +
              normal_price *
                (before.reducedAmountSold > now.amount
                  ? 0
                  : now.amount - before.reducedAmountSold),
            total_inve_seller_sales:
              before.total_inve_seller_sales +
              seller_price *
                (before.reducedAmountSold > now.amount
                  ? 0
                  : now.amount - before.reducedAmountSold),
            reducedAmountSold:
              before.reducedAmountSold < now.amount
                ? 0
                : before.reducedAmountSold - now.amount,
          };
        }
      },
      {
        sale: 0,
        seller_sale: 0,
        total_inve_sales: 0,
        total_inve_seller_sales: 0,
        reducedAmountSold: amoutnSold,
      }
    );
  }, [
    amoutnSold,
    data.inventory,
    data.sales_amounts,
    lastStock?.sale_price,
    lastStock?.seller_profit,
  ]);

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
    const cargaTotal = load.amount;
    const restante = cargaTotal - amoutnSold;

    if (restante !== cargaTotal) amountListener(amoutnSold);
  }, [amountListener, amoutnSold, load.amount]);

  // effect to manages the totals
  useEffect(() => {
    setTotals((props) => {
      return {
        ...props,
        [product_id]: {
          total_purchase: load.total + load.total_inventory,
          total_sale: totalSales.sale + totalSales.total_inve_sales,
          total_profit:
            totalSales.sale +
            totalSales.total_inve_sales -
            load.total_inventory -
            load.total,
          total_seller_sale:
            totalSales.seller_sale + totalSales.total_inve_seller_sales,
          total_seller_proft:
            totalSales.seller_sale +
            totalSales.total_inve_seller_sales -
            totalSales.sale -
            totalSales.total_inve_sales,
        },
      };
    });
  }, [
    load.total,
    load.total_inventory,
    product_id,
    setTotals,
    totalSales.sale,
    totalSales.seller_sale,
    totalSales.total_inve_sales,
    totalSales.total_inve_seller_sales,
  ]);

  console.log(load);

  // ---------- effects to manage the edit mode
  // effect to set the amount not sold
  useEffect(() => {
    if (amountNotSold) setAmoutnSold(amountNotSold);
  }, [amountNotSold]);

  return (
    <ProductContainer
      $withoutStock={1}
      $hasInventory
      $closing
      $warn={inventoryAmount.amount + load.amount - amoutnSold < 0}
    >
      <Column gridColumn="1 / 4">{productData?.name}</Column>
      <Column gridColumn="">{numberParser(inventoryAmount.amount)}</Column>
      <Column gridColumn="">
        {numberParser(load.amount - inventoryAmount.amount)}
      </Column>
      <Column gridColumn="">{numberParser(load.amount)}</Column>
      <Column gridColumn="">
        <Input
          type="number"
          onChange={onChangeAmountSold}
          onClick={() => setEditDevo(true)}
          onSelect={() => setEditDevo(true)}
          value={!editDevo ? amountNotSold : undefined}
          step={productData?.step}
          min={0}
        />
      </Column>
      <Column gridColumn="">{numberParser(load.amount - amoutnSold)}</Column>
      <Column gridColumn="">{costPrices}</Column>
      <Column
        gridColumn=""
        title={numberParser(load.total + load.total_inventory)}
      >
        {numberParser(load.total + load.total_inventory)}
      </Column>
      <Column gridColumn="">{normalSalePrices}</Column>
      <Column
        gridColumn=""
        title={numberParser(totalSales.sale + totalSales.total_inve_sales)}
      >
        {numberParser(totalSales.sale + totalSales.total_inve_sales)}
      </Column>
      <Column
        gridColumn=""
        title={numberParser(
          totalSales.sale +
            totalSales.total_inve_sales -
            load.total_inventory -
            load.total
        )}
      >
        {numberParser(
          totalSales.sale +
            totalSales.total_inve_sales -
            load.total_inventory -
            load.total
        )}
      </Column>

      <Column gridColumn="">{sellerSalePrices}</Column>
      <Column
        gridColumn=""
        title={numberParser(
          totalSales.seller_sale + totalSales.total_inve_seller_sales
        )}
      >
        {numberParser(
          totalSales.seller_sale + totalSales.total_inve_seller_sales
        )}
      </Column>
      <Column
        gridColumn=""
        title={numberParser(
          totalSales.seller_sale +
            totalSales.total_inve_seller_sales -
            (totalSales.sale + totalSales.total_inve_sales)
        )}
      >
        {numberParser(
          totalSales.seller_sale +
            totalSales.total_inve_seller_sales -
            (totalSales.sale + totalSales.total_inve_sales)
        )}
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
        {data.inventory.map((el, i) => {
          const normal_price = data.sales_amounts.sort(
            (a, b) => b.normal_price - a.normal_price
          )[0];

          const seller_price = data.sales_amounts.sort(
            (a, b) => b.seller_price - a.seller_price
          )[0];

          if (!lastStock) return <></>;

          return (
            <InvPrice
              normal={normal_price?.normal_price || lastStock.sale_price}
              seller={seller_price?.seller_price || lastStock.seller_profit}
              key={i}
              data={el}
            />
          );
        })}
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

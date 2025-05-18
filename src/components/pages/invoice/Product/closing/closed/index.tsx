import { rawProductWithInventory } from "@/trash/closing";
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
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
import { totals_sold } from "./manager";
import { ProductContainer } from "../../../ProductList";
import { Column, ExtraButton } from "../..";
import { Price } from "../Price";
import { Inv, InvPrice } from "../Inv";
import { Cost } from "../Cost";

type props = {
  amountNotSold: number;
  data: rawProductWithInventory;
  product_id: string;
  setTotals: Dispatch<SetStateAction<Record<string, totals_sold>>>;
};

export function ProductClosing({
  amountNotSold,
  product_id,
  data,
  setTotals,
}: props) {
  const [product, setProduct] = useState<DocumentSnapshot<productDoc>>();
  const productData = useMemo(() => product?.data(), [product]);
  const [fold, setFold] = useState(false);
  const lastStock = useMemo(() => productData?.stock[0], [productData]);
  const amoutnSold = amountNotSold;

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
      <Column gridColumn="">{amountNotSold}</Column>
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

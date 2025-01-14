import { invoiceOwners, rawProduct } from "@/pages/invoices/preview";
import { Column, ExtraButton, ProductName } from "..";
import { ProductContainer } from "../../ProductList";
import { useEffect, useMemo, useState } from "react";
import { Firestore } from "@/tools/firestore";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { ProductsCollection } from "@/tools/firestore/CollectionTyping";
import { productDoc } from "@/tools/products/create";
import { numberParser } from "@/tools/numberPaser";
import { Icon } from "@/components/Icons";
import { Price } from "./Price";
import { Cost } from "./Cost";

type props = {
  owners: invoiceOwners;
  product_id: string;
  data: rawProduct;
};

export function ProductPreview({ data, owners, product_id }: props) {
  const [product, setProduct] = useState<DocumentSnapshot<productDoc>>();
  const productData = useMemo(() => product?.data(), [product]);
  const sellerData = useMemo(() => owners.seller.data(), [owners.seller]);

  const [fold, setFold] = useState(false);

  const totalAmounts = useMemo(
    () =>
      data.purchases_amounts.reduce(
        (before, now) => {
          return {
            amount: before.amount + now.amount,
            purchase_cost: before.purchase_cost + now.total,
          };
        },
        {
          amount: 0,
          purchase_cost: 0,
        }
      ),
    [data]
  );
  const costPrices = useMemo(() => {
    return data.purchases_amounts.map((el) => el.price);
  }, [data]);

  const totalSales = useMemo(
    () =>
      data.sales_amounts.reduce(
        (before, now) => {
          return {
            sale: before.sale + now.normal_total,
            seller_sale: before.seller_sale + now.seller_total,
          };
        },
        {
          sale: 0,
          seller_sale: 0,
        }
      ),
    [data]
  );
  const normalSalePrices = useMemo(() => {
    return data.sales_amounts.map((el) => el.normal_price);
  }, [data]);
  const sellerSalePrices = useMemo(() => {
    return data.sales_amounts.map((el) => el.seller_price);
  }, [data]);

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

  if (!sellerData) return <>Cargando...</>;

  return (
    <ProductContainer $hasInventory={sellerData.hasInventory} $withoutStock={1}>
      <Column gridColumn="1 / 4" printGridColumn="1 / 8">
        <ProductName>{productData?.name}</ProductName>
      </Column>
      <Column gridColumn="4 / 5" printGridColumn="8 / 10">
        {totalAmounts.amount}
      </Column>
      <Column gridColumn="5 / 6">
        {costPrices.length > 1 ? "~" : numberParser(costPrices[0])}
      </Column>
      <Column
        gridColumn="6 / 7"
        title={numberParser(totalAmounts.purchase_cost)}
      >
        {numberParser(totalAmounts.purchase_cost)}
      </Column>
      <Column gridColumn="7 / 8" printGridColumn="-4 / -6">
        {numberParser(normalSalePrices[0])}
      </Column>
      <Column
        gridColumn="8 / 9"
        printGridColumn="-1 / -4"
        title={numberParser(totalSales.sale)}
      >
        {numberParser(totalSales.sale)}
      </Column>
      <Column
        gridColumn="9 / 10"
        title={numberParser(totalSales.sale - totalAmounts.purchase_cost)}
      >
        {numberParser(totalSales.sale - totalAmounts.purchase_cost)}
      </Column>
      {sellerData.hasInventory && (
        <>
          <Column gridColumn="10 / 11">
            {sellerSalePrices.length > 1 ? "~" : sellerSalePrices[0]}
          </Column>
          <Column
            gridColumn="11 / 12"
            title={numberParser(totalSales.seller_sale)}
          >
            {numberParser(totalSales.seller_sale)}
          </Column>
          <Column
            gridColumn="12 / 13"
            title={numberParser(totalSales.seller_sale - totalSales.sale)}
          >
            {numberParser(totalSales.seller_sale - totalSales.sale)}
          </Column>
        </>
      )}
      <Column gridColumn="-1 / -2">
        <ExtraButton onClick={() => setFold(!fold)}>
          <Icon iconType={fold ? "fold" : "unfold"} />
        </ExtraButton>
      </Column>

      <ProductContainer
        $children
        $hasInventory={sellerData?.hasInventory}
        $withoutStock={1}
        $fold={!fold}
      >
        <Column gridColumn="1 / -1" $removeBorder>
          <b>Precios de la salida detallados</b>
        </Column>
        {data.sales_amounts.map((el, i) => (
          <Price key={i} data={el} sellerData={sellerData} />
        ))}
        <Column gridColumn="1 / -1" $removeBorder>
          <b>Costos de la salida detallados</b>
        </Column>
        {data.purchases_amounts.map((el, i) => (
          <Cost key={i} data={el} />
        ))}
      </ProductContainer>
    </ProductContainer>
  );
}

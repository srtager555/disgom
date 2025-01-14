import { ProductClosing } from "@/components/pages/invoice/Product/closing";
import useQueryParams from "@/hooks/getQueryParams";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import {
  InvoiceCollection,
  SellersCollection,
} from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { purchases_amounts, rawProduct, sales_amounts } from "./preview";
import { inventoryProductDoc } from "@/tools/sellers/invetory/addProduct";
import { outputType } from "@/tools/products/addOutputs";
import { Column } from "@/components/pages/invoice/Product";
import { ProductContainer } from "@/components/pages/invoice/ProductList";

export interface rawProductWithInventory extends rawProduct {
  inventory: Array<inventoryProductDoc>;
}

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const [rawProducts, setRawProducts] = useState<
    Record<string, rawProductWithInventory> | undefined
  >();
  const [inventoriesProducts, setInventoriesProducts] =
    useState<QueryDocumentSnapshot<inventoryProductDoc>[]>();
  const data = useMemo(() => invoiceDoc?.data(), [invoiceDoc]);
  const sellerData = useMemo(() => seller?.data(), [seller]);

  // effect to get The invoice
  useEffect(() => {
    async function getInvoice() {
      if (!id) return;

      const db = Firestore();
      const docRef = doc(
        db,
        InvoiceCollection.root,
        id
      ) as DocumentReference<invoiceType>;
      const inv = await getDoc(docRef);

      setInvoiceDoc(inv);
    }

    getInvoice();
  }, [id]);

  // effect to get the seller
  useEffect(() => {
    async function getOwners() {
      if (!data) return;

      const seller = await getDoc(data.seller_ref);

      setSeller(seller);
    }

    getOwners();
  }, [data]);

  // effect to get the inventory
  useEffect(() => {
    async function getInventory() {
      if (!data || !seller) return;

      if (!data.last_inventory_ref) return;

      const coll = collection(
        data.last_inventory_ref,
        SellersCollection.inventories.products
      ) as CollectionReference<inventoryProductDoc>;
      const invent_products = await getDocs(coll);

      setInventoriesProducts(invent_products.docs);
    }

    getInventory();
  }, [data, seller]);

  // effect to get outputs
  useEffect(() => {
    if (!data?.products_outputs) return;

    let allProducts: (
      | QueryDocumentSnapshot<inventoryProductDoc>
      | DocumentReference<outputType>
    )[] = [...data.products_outputs];

    if (inventoriesProducts) {
      allProducts = [...data.products_outputs, ...inventoriesProducts];
    }

    allProducts.forEach(async (element) => {
      let product_id = "";
      let inventory: Array<inventoryProductDoc> = [];
      let purchase_amount: Array<purchases_amounts> = [];
      let sale_amount: Array<sales_amounts> = [];

      if ("ref" in element) {
        const data = element.data();
        if (!data) return;

        product_id = data.product_ref.id;
        inventory = [data];
      } else {
        const output = await getDoc(element);
        const data = output.data();
        if (!data) return;

        product_id = data.entry_ref.path.split("/")[1];

        purchase_amount = [
          {
            amount: data.amount,
            price: data.cost_price,
            total: data.purchase_cost,
          },
        ];
        sale_amount = [
          {
            amount: data.amount,
            normal_price: data.sale_prices.normal,
            normal_total: data.sales_values.normal,
            seller_price: data.sale_prices.seller,
            seller_total: data.sales_values.seller,
          },
        ];
      }

      setRawProducts((props) => {
        return {
          ...props,
          [product_id]: {
            purchases_amounts: props
              ? [
                  ...(props[product_id]?.purchases_amounts || []),
                  ...purchase_amount,
                ]
              : [...purchase_amount],
            sales_amounts: props
              ? [...(props[product_id]?.sales_amounts || []), ...sale_amount]
              : [...sale_amount],
            inventory: props
              ? [...(props[product_id]?.inventory || []), ...inventory]
              : [...inventory],
          },
        };
      });
    });

    return () => {
      setRawProducts(undefined);
    };
  }, [data?.products_outputs, inventoriesProducts]);

  if (!invoiceDoc || !data || !sellerData || !rawProducts) return "Cargando...";

  return (
    <Container>
      <Head>
        <title>
          {sellerData.name} cierre{" "}
          {data.created_at.toDate().toLocaleDateString()}
        </title>
      </Head>
      <Container styles={{ marginBottom: "20px" }}>
        <h1>Cierre de {sellerData.name}</h1>
        <p>Cierre del {data.created_at.toDate().toLocaleDateString()}</p>
      </Container>

      <Container>
        <Descriptions />
        {Object.entries(rawProducts).map((el, i) => {
          const data = el[1];

          return <ProductClosing key={i} data={data} product_id={el[0]} />;
        })}
      </Container>
    </Container>
  );
}

export const Descriptions = () => (
  <ProductContainer $header $withoutStock={1} $hasInventory $closing>
    <Column gridColumn="1 / 4">Nombre del producto</Column>
    <Column gridColumn="">Guardo</Column>
    <Column gridColumn="">Carga</Column>
    <Column gridColumn="">Total</Column>
    <Column gridColumn="">Devolu</Column>
    <Column gridColumn="">Vendido</Column>
    <Column gridColumn="">P Costo</Column>
    <Column gridColumn="">T Costo</Column>
    <Column gridColumn="">Precio</Column>
    <Column gridColumn="">Total</Column>
    <Column gridColumn="">Ganan</Column>

    <Column gridColumn="">P Vend</Column>
    <Column gridColumn="">V Vend</Column>
    <Column gridColumn="">G Vend</Column>

    <Column gridColumn="">Extra</Column>
  </ProductContainer>
);

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
import { useState, useMemo, useEffect } from "react";
import { rawProductWithInventory } from "./closing";
import { totals_sold } from "@/components/pages/invoice/Product/closing/manager";
import { outputType } from "@/tools/products/addOutputs";
import { inventoryProductDoc } from "@/tools/sellers/invetory/addProduct";
import { purchases_amounts, sales_amounts } from "./preview";
import { ProductManagerPreview } from "@/components/pages/invoice/Product/closing/closed/manager";
import { Credit } from "@/components/pages/invoice/Product/closing/closed/Credit";
import { Bills } from "@/components/pages/invoice/Product/closing/closed/Bills";
import { Close } from "@/components/pages/invoice/Product/closing/closed/Close";
import { productDoc } from "@/tools/products/create";

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const [rawProducts, setRawProducts] = useState<
    Record<string, rawProductWithInventory>
  >({});
  const [sortedRawProducts, setSortedRawProducts] = useState<
    Record<string, rawProductWithInventory>
  >({});
  const [inventoriesProducts, setInventoriesProducts] =
    useState<QueryDocumentSnapshot<inventoryProductDoc>[]>();
  const [invoiceInventory, setInvoiceInventory] =
    useState<QueryDocumentSnapshot<inventoryProductDoc>[]>();
  const [totalCredits, setTotalCredits] = useState(0);
  const [productsTotals, setProductsTotals] = useState<totals_sold>();
  const sellerData = useMemo(() => seller?.data(), [seller]);
  const data = useMemo(() => invoiceDoc?.data(), [invoiceDoc]);

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

  // effecto to get the inventory to se as not sold amount
  useEffect(() => {
    async function getInventory() {
      if (!data || !seller) return;

      if (!data.inventory_ref) return;

      const coll = collection(
        data.inventory_ref,
        SellersCollection.inventories.products
      ) as CollectionReference<inventoryProductDoc>;
      const invent_products = await getDocs(coll);

      setInvoiceInventory(invent_products.docs);
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
      let name = "";

      if ("ref" in element) {
        const data = element.data();
        if (!data) return;

        const product = await getDoc(data.product_ref);
        name = product.data()?.name || "";

        product_id = data.product_ref.id;
        inventory = [data];
      } else {
        const output = await getDoc(element);
        const data = output.data();
        const product = await getDoc(
          element.parent.parent as DocumentReference<productDoc>
        );
        name = product.data()?.name || "";
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
            name,
            purchases_amounts:
              purchase_amount.length > 0
                ? [
                    ...(props[product_id]?.purchases_amounts || []),
                    ...purchase_amount,
                  ]
                : props[product_id]?.purchases_amounts || [],
            sales_amounts:
              sale_amount.length > 0
                ? [...(props[product_id]?.sales_amounts || []), ...sale_amount]
                : props[product_id]?.sales_amounts || [],

            inventory:
              inventory.length > 0
                ? [...(props[product_id]?.inventory || []), ...inventory]
                : props[product_id]?.inventory || [],
          },
        };
      });
    });

    return () => {
      setRawProducts({});
    };
  }, [data?.products_outputs, inventoriesProducts]);

  // effecto to sort rawProduct
  useEffect(() => {
    const sorted = Object.fromEntries(
      Object.entries(rawProducts).sort((a, b) => {
        const aData = a[1];
        const bData = b[1];

        return aData.name.localeCompare(bData.name);
      })
    );

    setSortedRawProducts(sorted);
  }, [rawProducts]);

  if (
    !invoiceDoc ||
    !data ||
    !sellerData ||
    !rawProducts ||
    !invoiceInventory ||
    !seller
  )
    return "Cargando...";

  return (
    <Container>
      <Head>
        <title>
          {sellerData.name} cierre{" "}
          {data.created_at.toDate().toLocaleDateString()}
        </title>
      </Head>
      <Container styles={{ marginBottom: "20px" }}>
        <h1>Cierre de {sellerData.name} - Vista previa</h1>
        <p>Cierre del {data.created_at.toDate().toLocaleDateString()}</p>
      </Container>

      <ProductManagerPreview
        setProductTotals={setProductsTotals}
        inventory={invoiceInventory}
        rawProducts={sortedRawProducts}
      />

      <Container styles={{ marginBottom: "30px" }}>
        <Credit
          seller_ref={seller?.ref}
          setCreditTotal={setTotalCredits}
          invoiceData={data}
        />
      </Container>

      <Bills bills={data.bills} />

      {data.money && (
        <Close
          totals={productsTotals}
          credits={totalCredits}
          bills={data.bills || []}
          money={data.money}
        />
      )}
    </Container>
  );
}

import useQueryParams from "@/hooks/getQueryParams";
import { Container, FlexContainer } from "@/styles/index.styles";
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
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  updateDoc,
} from "firebase/firestore";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { purchases_amounts, rawProduct, sales_amounts } from "./preview";
import {
  addInventoryProduct,
  inventory_product_data,
  inventoryProductDoc,
} from "@/tools/sellers/invetory/addProduct";
import { outputType } from "@/tools/products/addOutputs";
import { Column } from "@/components/pages/invoice/Product";
import { ProductContainer } from "@/components/pages/invoice/ProductList";
import {
  Credit,
  creditToUpdate,
  newCredits,
} from "@/components/pages/invoice/Credit";
import {
  ProductManager,
  totals_sold,
} from "@/components/pages/invoice/Product/closing/manager";
import { bill, Bills } from "@/components/pages/invoice/Product/closing/Bills";
import { Close } from "@/components/pages/invoice/Product/closing/Close";
import { Button } from "@/styles/Form.styles";
import { closeInvoice } from "@/tools/invoices/closeInvoice";
import { createInventory } from "@/tools/sellers/invetory/create";
import {
  createClientCredit,
  createCredit,
  credit,
} from "@/tools/sellers/credits/create";
import { useRouter } from "next/router";

export interface rawProductWithInventory extends rawProduct {
  inventory: Array<inventoryProductDoc>;
}

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const [rawProducts, setRawProducts] = useState<
    Record<string, rawProductWithInventory>
  >({});
  const [inventoriesProducts, setInventoriesProducts] =
    useState<QueryDocumentSnapshot<inventoryProductDoc>[]>();
  const data = useMemo(() => invoiceDoc?.data(), [invoiceDoc]);
  const sellerData = useMemo(() => seller?.data(), [seller]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [newCreditsToCreate, setNewCreditsToCreate] = useState<newCredits[]>();
  const [creditsToUpdate, setCreditsToUpdate] = useState<creditToUpdate[]>();
  const [newInventoriesToCreate, setNewInventoriesToCreate] =
    useState<Record<string, inventory_product_data[]>>();
  const [productsTotals, setProductsTotals] = useState<totals_sold>();
  const [bills, setBills] = useState<Record<string, bill>>({});
  const [money, setMoney] = useState({ cash: 0, deposit: 0 });
  const [route, setRoute] = useState<number>();
  const router = useRouter();

  async function closeThisInvoice() {
    if (
      !invoiceDoc ||
      !productsTotals ||
      !newCreditsToCreate ||
      !seller ||
      !newInventoriesToCreate ||
      !creditsToUpdate ||
      !route
    )
      return;

    const creditsCreated = Object.values(newCreditsToCreate).map(async (el) => {
      return await createClientCredit(
        el.route,
        seller.ref,
        el.name,
        el.amount,
        el.address
      );
    });

    const creditsUpdated = Object.values(creditsToUpdate).map(async (el) => {
      const coll = collection(el.ref, "credits") as CollectionReference<credit>;
      const q = query(coll, orderBy("created_at", "desc"), limit(1));
      const credits = await getDocs(q);
      const last_credit = credits.docs[0].data();
      return await createCredit(el.ref, el.amount, last_credit.amount);
    });

    await closeInvoice(invoiceDoc.ref, {
      total_sold: productsTotals.total_sale,
      total_cost: productsTotals.total_purchase,
      total_proft: productsTotals.total_profit,
      route,
      bills: Object.values(bills),
      money,
      newCredits: await Promise.all([...creditsCreated, ...creditsUpdated]),
    });

    const inventory_ref = await createInventory(invoiceDoc.ref, seller.ref);
    Object.values(newInventoriesToCreate).forEach((el) => {
      el.forEach(async (el) => {
        await addInventoryProduct(inventory_ref, el);
      });
    });

    await updateDoc(invoiceDoc.ref, {
      inventory_ref: inventory_ref,
    });

    router.push("/invoices");
  }

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

  if (!invoiceDoc || !data || !sellerData || !rawProducts || !seller)
    return "Cargando...";

  return (
    <Container styles={{ marginBottom: "100px" }}>
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

      <ProductManager
        rawProducts={rawProducts}
        setInventories={setNewInventoriesToCreate}
        setProductTotals={setProductsTotals}
      />

      <Container styles={{ marginBottom: "30px" }}>
        <Credit
          seller_ref={seller?.ref}
          setCreditTotal={setTotalCredits}
          setNewCreditsToCreate={setNewCreditsToCreate}
          setCreditsToUpdate={setCreditsToUpdate}
          setRoute={setRoute}
        />
      </Container>

      <Bills bills={bills} setBills={setBills} />

      <Close
        totals={productsTotals}
        credits={totalCredits}
        bills={bills}
        setMoney={setMoney}
      />

      <FlexContainer styles={{ justifyContent: "center" }}>
        {route ? (
          <Button $primary onClick={closeThisInvoice}>
            ¡Terminar!
          </Button>
        ) : (
          <h3>
            <b>
              Para terminar la factura se tienen que elegir una ruta en los
              creditos
            </b>
          </h3>
        )}
      </FlexContainer>
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

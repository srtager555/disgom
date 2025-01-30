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
import { Button } from "@/styles/Form.styles";
import { useRouter } from "next/router";

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
  const router = useRouter();

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

    const allProducts: DocumentReference<outputType>[] = [
      ...data.products_outputs,
    ];

    allProducts.forEach(async (element) => {
      const output = await getDoc(element);
      const data = output.data();
      const product = await getDoc(
        element.parent.parent as DocumentReference<productDoc>
      );
      const name = product.data()?.name || "";
      if (!data) return;

      const product_id = data.entry_ref.path.split("/")[1];
      const purchase_amount: purchases_amounts = {
        amount: data.amount,
        price: data.cost_price,
        total: data.purchase_cost,
      };
      const sale_amount: sales_amounts = {
        amount: data.amount,
        normal_price: data.sale_prices.normal,
        normal_total: data.sales_values.normal,
        seller_price: data.sale_prices.seller,
        seller_total: data.sales_values.seller,
      };

      setRawProducts((props) => {
        const entries: [string, rawProductWithInventory][] | [] =
          Object.entries(props);

        const last_amounts = entries.find((el) => el[0] === product_id);

        const purchases_amounts = last_amounts
          ? [...last_amounts[1].purchases_amounts, purchase_amount]
          : [purchase_amount];

        const sales_amounts = last_amounts
          ? [...last_amounts[1].sales_amounts, sale_amount]
          : [sale_amount];

        const inventory = last_amounts ? [...last_amounts[1].inventory] : [];

        return {
          ...props,
          [product_id]: {
            name,
            purchases_amounts,
            sales_amounts,
            inventory,
          },
        };
      });
    });

    return () => {
      setRawProducts({});
    };
  }, [data?.products_outputs]);

  // effect to merge the inventory with the outputs
  useEffect(() => {
    const inventoriesProductsLength = inventoriesProducts?.length === 0;

    if (!inventoriesProducts || inventoriesProductsLength) return;

    inventoriesProducts.forEach(async (el) => {
      const data = el.data();
      const productSnap = await getDoc(data.product_ref);
      const productData = productSnap.data() as productDoc;
      const product_id = productSnap.id;

      setRawProducts((props) => {
        const entries: [string, rawProductWithInventory][] | [] =
          Object.entries(props);

        const last_amounts = entries.find((el) => el[0] === product_id);

        const last_data = last_amounts ? last_amounts[1] : {};
        const inventory = last_amounts
          ? [...last_amounts[1].inventory, data]
          : [data];

        return {
          ...props,
          [product_id]: {
            sales_amounts: [],
            purchases_amounts: [],
            ...last_data,
            name: productData.name,
            inventory,
          },
        };
      });
    });
  }, [inventoriesProducts]);

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
          {data.created_at?.toDate().toLocaleDateString()}
        </title>
      </Head>
      <Container styles={{ marginBottom: "20px" }}>
        <h1>Cierre de {sellerData.name} - Vista previa</h1>
        <p>Cierre del {data.created_at?.toDate().toLocaleDateString()}</p>
      </Container>

      <Container styles={{ marginBottom: "10px" }}>
        <Button
          onClick={() => {
            router.push("/invoices/closing?id=" + invoiceDoc.id);
          }}
        >
          Editar cierre
        </Button>
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

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
import { Close } from "@/components/pages/invoice/manage/Closing";
import { Button } from "@/styles/Form.styles";
import { closeInvoice } from "@/tools/invoices/closeInvoice";
import { createInventory } from "@/tools/sellers/invetory/create";
import {
  createClientCredit,
  createCredit,
  credit,
} from "@/tools/sellers/credits/create";
import { useRouter } from "next/router";
import { productDoc } from "@/tools/products/create";

export interface rawProductWithInventory extends rawProduct {
  inventory: Array<inventoryProductDoc>;
}

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [seller, setSeller] = useState<DocumentSnapshot<SellersDoc>>();
  const [rawProducts, setRawProducts] = useState<
    Record<string, rawProductWithInventory> | object
  >({});
  const [sortedRawProducts, setSortedRawProducts] = useState<
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
  const [invoiceInventory, setInvoiceInventory] =
    useState<QueryDocumentSnapshot<inventoryProductDoc>[]>();
  const [productsTotals, setProductsTotals] = useState<totals_sold>();
  const [bills, setBills] = useState<Record<string, bill>>({});
  const [money, setMoney] = useState({ cash: 0, deposit: 0 });
  const [route, setRoute] = useState<number>();
  const router = useRouter();

  function EditLoad() {
    router.push("/invoices/create?id=" + id);
  }

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
      if (!el.previuss) {
        const coll = collection(
          el.ref,
          "credits"
        ) as CollectionReference<credit>;
        const q = query(coll, orderBy("created_at", "desc"), limit(1));
        const credits = await getDocs(q);
        const last_credit = credits.docs[0].data();
        return await createCredit(el.ref, el.newAmount, last_credit.amount);
      } else {
        await updateDoc(el.previuss, {
          amount: el.newAmount,
        });

        return el.previuss;
      }
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
  }, [
    data?.products_outputs,
    // inventoriesProducts
  ]);

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

  // effects to edit the edit the closed invoice
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

  // effect to add the bills to edit
  useEffect(() => {
    const bills = invoiceDoc?.data()?.bills;
    if (!bills) return;

    const parsed = Object.fromEntries(
      bills.map((el) => {
        return [el.reason.replaceAll(" ", "_"), el];
      })
    );

    setBills(parsed);
  }, [invoiceDoc]);

  if (!invoiceDoc || !data || !sellerData || !rawProducts || !seller)
    return "Cargando...";

  return (
    <Container styles={{ marginBottom: "100px" }}>
      <Head>
        <title>
          {sellerData.name} cierre{" "}
          {data.created_at?.toDate().toLocaleDateString()}
        </title>
      </Head>
      <Container styles={{ marginBottom: "20px" }}>
        <h1>Cierre de {sellerData.name}</h1>
        <p>Cierre del {data.created_at?.toDate().toLocaleDateString()}</p>
      </Container>

      <Container styles={{ marginBottom: "10px" }}>
        <Button onClick={EditLoad}>Editar carga</Button>
      </Container>
      <ProductManager
        rawProducts={sortedRawProducts}
        setInventories={setNewInventoriesToCreate}
        setProductTotals={setProductsTotals}
        inventory={invoiceInventory}
      />

      <Container styles={{ marginBottom: "30px" }}>
        <Credit
          seller_ref={seller?.ref}
          setCreditTotal={setTotalCredits}
          setNewCreditsToCreate={setNewCreditsToCreate}
          setCreditsToUpdate={setCreditsToUpdate}
          setRoute={setRoute}
          invoice={invoiceDoc}
        />
      </Container>

      <Bills bills={bills} setBills={setBills} />

      <Close
        totals={productsTotals}
        credits={totalCredits}
        bills={bills}
        setMoney={setMoney}
        invoice={invoiceDoc}
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

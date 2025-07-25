import { Column } from "@/components/pages/invoice/Product";
import { ProductRow } from "@/components/pages/products/inventory/by-seller/ProductRow";
import useQueryParams from "@/hooks/getQueryParams";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import {
  InvoiceCollection,
  SellersCollection,
} from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { numberParser } from "@/tools/numberPaser";
import { productDoc } from "@/tools/products/create";
import { SellersDoc } from "@/tools/sellers/create";
import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { isEqual } from "lodash";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Define grid template for product rows
const gridTemplate = "250px 80px 80px 90px"; // PRODUCTO | CANTIDAD | PRECIO | VALOR

// Type for inventory product items
export type SellerInventoryProduct = {
  product_ref: DocumentReference<DocumentData>;
  amount: number;
};

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}

export default function Page() {
  const { id: sellerId } = useQueryParams(); // Get seller ID from query params
  const [order, setOrder] = useState<keyof productDoc>("position");
  const [orderByName, setOrderByName] = useState(false);
  const { docs: products } = useGetProducts(order); // Get all products
  const [seller, setSeller] = useState<
    DocumentSnapshot<SellersDoc> | undefined
  >(undefined);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [inventoryProducts, setInventoryProducts] = useState<
    SellerInventoryProduct[]
  >([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [invoiceID, setInvoiceID] = useState<string>();

  function handlerOnClick() {
    if (!orderByName) {
      setOrder("name");
      setOrderByName(true);
    } else {
      setOrder("position");
      setOrderByName(false);
    }
  }

  // Effect to fetch seller details
  useEffect(() => {
    async function getSeller() {
      if (!sellerId) {
        setLoadingSeller(false);
        console.error("Seller ID is missing from query parameters.");
        return; // Exit if no ID
      }
      setLoadingSeller(true);
      try {
        const db = Firestore();
        const coll = collection(
          db,
          SellersCollection.root
        ) as CollectionReference<SellersDoc>;
        const ref = doc(coll, sellerId);
        const snap = await getDoc(ref);
        setSeller(snap.exists() ? snap : undefined); // Set seller only if exists
      } catch (error) {
        console.error("Error fetching seller:", error);
        setSeller(undefined);
      } finally {
        setLoadingSeller(false);
      }
    }

    getSeller();
  }, [sellerId]); // Re-run if sellerId changes

  // Effect to fetch the latest inventory for the specific seller
  useEffect(() => {
    const fetchInventory = async () => {
      if (!sellerId || !seller?.exists()) {
        // Don't fetch if no seller ID or seller doesn't exist
        setLoadingInventory(false);
        setInventoryProducts([]);
        return;
      }

      setLoadingInventory(true);
      try {
        const db = Firestore();
        // 1. Coll to the invoices
        const InvoiceColl = collection(db, InvoiceCollection.root);
        // 2. Query for the latest inventory document
        const latestInvoiceQuery = query(
          InvoiceColl,
          where("disabled", "==", false),
          where("seller_ref", "==", seller.ref),
          orderBy("created_at", "desc"),
          limit(1)
        ) as CollectionReference<invoiceType>;
        const invoiceSnapshot = await getDocs(latestInvoiceQuery);

        if (!invoiceSnapshot.empty) {
          const latestInvoice = invoiceSnapshot.docs[0];
          setInvoiceID(latestInvoice.id);

          // inv coll path
          const coll = collection(
            latestInvoice.ref,
            InvoiceCollection.inventory
          );

          // query to get only the product with the field disabled in false
          const inventoryQuery = query(coll, where("disabled", "==", false));
          const inventorySnapshot = await getDocs(inventoryQuery);
          if (inventorySnapshot.empty) {
            setInventoryProducts([]);
            return;
          }

          // Map the product to will be readed by the component
          const inventoryData = inventorySnapshot.docs.map((doc) => ({
            product_ref: doc.data()
              .product_ref as DocumentReference<DocumentData>,
            amount: (doc.data().amount as number) || 0,
          }));
          setInventoryProducts(inventoryData);
        } else {
          // No inventory found for this seller
          setInventoryProducts([]);
          setInvoiceID(undefined);
        }
      } catch (error) {
        console.error(
          `Error fetching inventory for seller ${sellerId}:`,
          error
        );
        setInventoryProducts([]); // Set empty on error
        setInvoiceID(undefined);
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventory();

    return () => {
      setInvoiceID(undefined);
    };
  }, [sellerId, seller]); // Re-run if sellerId or seller object changes

  // Calculate total value for this seller's inventory
  const totalInventoryValue = useMemo(() => {
    if (loadingInventory || !products) {
      return null; // Return null while loading
    }

    return inventoryProducts.reduce((total, item) => {
      // Find the corresponding product details in the main products list
      const productDetail = products.find((p) =>
        isEqual(p.ref, item.product_ref)
      );
      const price = productDetail?.data().stock?.[0]?.sale_price ?? 0;
      return total + item.amount * price;
    }, 0);
  }, [inventoryProducts, products, loadingInventory]);

  // Display loading or error states
  if (loadingSeller) {
    return <Container>Cargando vendedor...</Container>;
  }

  if (!seller) {
    return <Container>Vendedor no encontrado.</Container>;
  }

  return (
    <FlexContainer
      styles={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Container styles={{ margin: "30px 0" }}>
        {!invoiceID ? (
          <p>No se encontró un inventario valido</p>
        ) : (
          <Container styles={{ width: "502px" }}>
            <h1>
              Inventario de {seller.data()?.name ?? "Vendedor Desconocido"}
            </h1>
            <p style={{ marginBottom: "10px" }}>
              <Link
                href={`/invoices/manage?id=${invoiceID}`}
                className="show-style"
              >
                Click aquí para ir a la factura referenciada
              </Link>
            </p>
            <p>
              <Link href={"/sellers?id=" + sellerId} className="show-style">
                Información detallada de {seller.data()?.name}
              </Link>
            </p>
          </Container>
        )}
      </Container>

      <Container styles={{ maxWidth: "600px", alignSelf: "center" }}>
        <Button onClick={handlerOnClick}>
          Ordenado por {orderByName ? "Nombre" : "Posición"}
        </Button>
        <Container styles={{ marginTop: "10px" }}>
          <Descriptions />
          {!products ? (
            <p>Cargando productos...</p>
          ) : (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                inventoryProducts={inventoryProducts}
                loadingInventory={loadingInventory}
              />
            ))
          )}
          {/* Total Row */}
          <GridContainer $gridTemplateColumns={gridTemplate}>
            <Column gridColumn="span 3">
              <strong style={{ float: "right" }}>TOTAL LPS</strong>
            </Column>
            <Column $textAlign="center">
              <strong>
                {loadingInventory
                  ? "Calculando..."
                  : numberParser(totalInventoryValue ?? 0)}
              </strong>
            </Column>
          </GridContainer>
        </Container>
      </Container>
      <div style={{ height: "50px" }} />
    </FlexContainer>
  );
}

// Header row component
const Descriptions = () => {
  return (
    <GridContainer $gridTemplateColumns={gridTemplate}>
      <Column>PRODUCTO</Column>
      <Column $textAlign="center">CANT.</Column>
      <Column $textAlign="center">PRECIO</Column>
      <Column $textAlign="center">VALOR</Column>
    </GridContainer>
  );
};

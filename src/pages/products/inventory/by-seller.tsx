import { Column } from "@/components/pages/invoice/Product";
import useQueryParams from "@/hooks/getQueryParams";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
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
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { isEqual } from "lodash";
import { useEffect, useMemo, useState } from "react";

// Define grid template for product rows
const gridTemplate = "250px 80px 80px 90px"; // PRODUCTO | CANTIDAD | PRECIO | VALOR

// Type for inventory product items
type SellerInventoryProduct = {
  product_ref: DocumentReference<DocumentData>;
  amount: number;
};

export default function Page() {
  const { id: sellerId } = useQueryParams(); // Get seller ID from query params
  const { docs: products } = useGetProducts(); // Get all products
  const [seller, setSeller] = useState<
    DocumentSnapshot<SellersDoc> | undefined
  >(undefined);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [inventoryProducts, setInventoryProducts] = useState<
    SellerInventoryProduct[]
  >([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

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
        // 1. Reference to the seller's 'inventories' subcollection
        const inventoriesColRef = collection(
          db,
          SellersCollection.root,
          sellerId,
          SellersCollection.inventories.root
        );
        // 2. Query for the latest inventory document
        const latestInventoryQuery = query(
          inventoriesColRef,
          orderBy("created_at", "desc"),
          limit(1)
        );
        const inventorySnapshot = await getDocs(latestInventoryQuery);

        if (!inventorySnapshot.empty) {
          const latestInventoryDoc = inventorySnapshot.docs[0];
          // 3. Reference to the 'products' subcollection of the latest inventory
          const productsColRef = collection(
            db,
            latestInventoryDoc.ref.path,
            SellersCollection.inventories.products
          );
          // 4. Fetch all product documents from that subcollection
          const productsSnapshot = await getDocs(productsColRef);

          // 5. Map documents to SellerInventoryProduct type
          const inventoryData = productsSnapshot.docs.map((doc) => ({
            product_ref: doc.data()
              .product_ref as DocumentReference<DocumentData>,
            amount: (doc.data().amount as number) || 0,
          }));
          setInventoryProducts(inventoryData);
        } else {
          // No inventory found for this seller
          setInventoryProducts([]);
        }
      } catch (error) {
        console.error(
          `Error fetching inventory for seller ${sellerId}:`,
          error
        );
        setInventoryProducts([]); // Set empty on error
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventory();
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
      styles={{ justifyContent: "center", flexDirection: "column" }}
    >
      <h1 style={{ textAlign: "center" }}>
        Inventario de: {seller.data()?.name ?? "Vendedor Desconocido"}
      </h1>
      <Container styles={{ maxWidth: "600px", alignSelf: "center" }}>
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
            <strong style={{ float: "right" }}>TOTAL INVENTARIO:</strong>
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

// Props for the ProductRow component
type ProductRowProps = {
  product: QueryDocumentSnapshot<productDoc>;
  inventoryProducts: SellerInventoryProduct[];
  loadingInventory: boolean;
};

// Component to render a single product row
const ProductRow = ({
  product,
  inventoryProducts,
  loadingInventory,
}: ProductRowProps) => {
  const productRef = product.ref;
  const productName = product.data().name;

  // Find the quantity of this product in the seller's inventory
  const { quantity, price, value } = useMemo(() => {
    const inventoryItem = inventoryProducts.find((item) =>
      isEqual(item.product_ref, productRef)
    );
    const currentQuantity = inventoryItem?.amount ?? 0;
    // Ensure you have a reliable way to get the price. Using the first stock item's sale_price as an example.
    const currentPrice = product.data().stock?.[0]?.sale_price ?? 0;
    const currentValue = currentQuantity * currentPrice;

    return {
      quantity: currentQuantity,
      price: currentPrice,
      value: currentValue,
    };
  }, [inventoryProducts, productRef, product]); // Recalculate if inventory or product ref changes

  // Don't render row if product is not in the specific seller inventory (optional, depends on desired view)
  // if (!loadingInventory && quantity === 0) {
  //   return null;
  // }

  return (
    <GridContainer $gridTemplateColumns={gridTemplate}>
      <Column title={productName}>{productName}</Column>
      <Column $textAlign="center">
        {loadingInventory ? (
          "..."
        ) : (
          <span style={quantity === 0 ? { opacity: 0.5 } : {}}>{quantity}</span>
        )}
      </Column>
      <Column $textAlign="center">
        {/* Show price even if quantity is 0 */}
        {loadingInventory ? "..." : numberParser(price)}
      </Column>
      <Column $textAlign="center">
        {loadingInventory ? "..." : numberParser(value)}
      </Column>
    </GridContainer>
  );
};

import { Column } from "@/components/pages/invoice/Product";
import { SellerInventoryProduct } from "@/pages/products/inventory/by-seller";
import { GridContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { productDoc } from "@/tools/products/create";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { isEqual } from "lodash";
import { useMemo } from "react";

const gridTemplate = "250px 80px 80px 90px"; // PRODUCTO | CANTIDAD | PRECIO | VALOR

// Props for the ProductRow component
type ProductRowProps = {
  product: QueryDocumentSnapshot<productDoc>;
  inventoryProducts: SellerInventoryProduct[];
  loadingInventory: boolean;
};

// Component to render a single product row
export const ProductRow = ({
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

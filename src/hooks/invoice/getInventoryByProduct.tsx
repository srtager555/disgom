import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { productDoc } from "@/tools/products/create";
import { inventoryProductDoc } from "@/tools/sellers/invetory/addProduct";
import { inventory } from "@/tools/sellers/invetory/create";
import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function useGetInventoryByProduct(
  last_inventory_ref: DocumentReference<inventory> | undefined,
  product_ref: DocumentReference<productDoc>
) {
  const [inventoriesProducts, setInventoriesProducts] = useState<{
    totalAmount: number;
    inv: inventoryProductDoc[];
  }>({ totalAmount: 0, inv: [] });

  // effect to get the inventory
  useEffect(() => {
    async function getInventory() {
      if (!last_inventory_ref) return;

      const coll = collection(
        last_inventory_ref,
        SellersCollection.inventories.products
      ) as CollectionReference<inventoryProductDoc>;

      const q = query(coll, where("product_ref", "==", product_ref));
      const invent_products = await getDocs(q);

      const inv = invent_products.docs.map((doc) => doc.data());
      const totalAmount = inv.reduce((acc, doc) => {
        return acc + doc.amount;
      }, 0);

      setInventoriesProducts({ inv, totalAmount });
    }

    getInventory();
  }, [last_inventory_ref, product_ref]);

  return inventoriesProducts;
}

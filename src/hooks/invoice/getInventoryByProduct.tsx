import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { outputType } from "@/tools/products/addOutputs";
import { productDoc } from "@/tools/products/create";
import { inventory } from "@/tools/sellers/invetory/create";
import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { isEqual } from "lodash";
import { useEffect, useState } from "react";

export function useGetInventoryByProduct(
  last_inventory_ref: DocumentReference<inventory> | undefined,
  product_ref: DocumentReference<productDoc>
) {
  const [inventoriesProducts, setInventoriesProducts] = useState<{
    totalAmount: number;
    inv: outputType[];
  }>({ totalAmount: 0, inv: [] });
  const [lastInventoryRef, setlastInventoryRef] = useState(last_inventory_ref);
  const [lastProductRef, setlastProductRef] = useState(product_ref);

  // effect to get the inventory
  useEffect(() => {
    if (
      isEqual(lastInventoryRef, last_inventory_ref) &&
      isEqual(lastProductRef, product_ref)
    )
      return;
    setlastInventoryRef(last_inventory_ref);
    setlastProductRef(product_ref);

    async function getInventory() {
      if (!last_inventory_ref) return;

      const coll = collection(
        last_inventory_ref,
        SellersCollection.inventories.products
      ) as CollectionReference<outputType>;

      const q = query(
        coll,
        where("product_ref", "==", product_ref),
        where("disabled", "==", false)
      );
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

import { ProductContext } from "@/components/layouts/Products.layout";
import { productDoc } from "@/tools/products/create";
import { onSnapshot, DocumentSnapshot } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";

export function useGetProduct() {
  const { selectedProduct } = useContext(ProductContext);
  const [product, setProduct] = useState<{
    snap: DocumentSnapshot<productDoc> | undefined;
    data: productDoc | undefined;
  }>({
    snap: undefined,
    data: undefined,
  });

  useEffect(() => {
    const ref = selectedProduct?.ref;
    if (!ref) return;
    const unsubcribe = onSnapshot(ref, (snap) => {
      console.log(snap);
      setProduct({ snap, data: snap.data() });
    });

    return () => {
      unsubcribe();
    };
  }, [selectedProduct]);

  return product;
}

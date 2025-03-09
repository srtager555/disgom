import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { useGetProduct } from "@/hooks/products/getProduct";
import { useContext, ReactElement } from "react";
import { NextPageWithLayout } from "../_app";

const Page: NextPageWithLayout = () => {
  const { selectedProduct } = useContext(ProductContext);
  const product = useGetProduct();

  useEffect(() => {
    if (productsContext?.setShowProductsList)
      productsContext?.setShowProductsList(false);
    if (productsContext?.setHideBorder) productsContext?.setHideBorder(true);

    return () => {
      if (productsContext?.setShowProductsList)
        productsContext?.setShowProductsList(true);
      if (productsContext?.setHideBorder) productsContext?.setHideBorder(false);
    };
  }, [productsContext]);

  return <>Descripcion general</>;
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

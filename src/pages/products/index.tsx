import { ProductsLayout } from "@/components/layouts/Products.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { Container } from "@/styles/index.styles";
import Link from "next/link";
import { ReactElement } from "react";

const Page: NextPageWithLayout = () => {
  return (
    <Container>
      <Link href="/products/create">Añadir producto</Link>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

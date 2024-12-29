import { SellersLayout } from "@/components/layouts/Sellers.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { ReactElement } from "react";

const Page: NextPageWithLayout = () => {
  return "a";
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <SellersLayout>{page}</SellersLayout>;
};

export default Page;

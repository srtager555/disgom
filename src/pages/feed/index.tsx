import { ReactElement } from "react";
import type { NextPageWithLayout } from "../_app";
import { NavLayout } from "@/components/layouts/nav.layout";

const Feed: NextPageWithLayout = () => {
  return <p>There is the Feed</p>;
};

Feed.getLayout = function getLayout(page: ReactElement) {
  return <NavLayout>{page}</NavLayout>;
};

export default Feed;

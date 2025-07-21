import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import { InvoicesList } from "@/components/pages/invoice/list/InvoicesList";
import { OutdatedInvoicesList } from "@/components/pages/invoice/list/outdatedInvoicesList";
import { OverDueInvoicesList } from "@/components/pages/invoice/list/OverDueInvoices";
import { NextPageWithLayout } from "@/pages/_app";
import { FlexContainer } from "@/styles/index.styles";

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}

const Page: NextPageWithLayout = () => {
  return (
    <FlexContainer styles={{ flexDirection: "column", gap: "20px" }}>
      <InvoicesList />
      <OverDueInvoicesList />
      <OutdatedInvoicesList />
    </FlexContainer>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;

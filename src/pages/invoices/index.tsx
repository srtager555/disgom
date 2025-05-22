import { InvoiceLayout } from "@/components/layouts/Invoice.layout";
import { InvoicesList } from "@/components/pages/invoice/list/InvoicesList";
import { OutdatedInvoicesList } from "@/components/pages/invoice/list/outdatedInvoicesList";
import { OverDueInvoicesList } from "@/components/pages/invoice/list/OverDueInvoices";
import { NextPageWithLayout } from "@/pages/_app";
import { Container } from "@/styles/index.styles";

const Page: NextPageWithLayout = () => {
  return (
    <Container>
      <InvoicesList />
      <OverDueInvoicesList />
      <OutdatedInvoicesList />
    </Container>
  );
};

Page.getLayout = function getLayout(Page) {
  return <InvoiceLayout>{Page}</InvoiceLayout>;
};

export default Page;

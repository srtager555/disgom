import { Container } from "@/styles/index.styles";
import { AnchorNavigators } from "@/styles/Nav.module";

export function InvoiceLayout({ children }: { children: children }) {
  return (
    <Container>
      <Container styles={{ marginBottom: "30px" }}>
        <AnchorNavigators href="/invoices">Lista de facturas</AnchorNavigators>
        <AnchorNavigators href="/invoices/create">
          Crear factura
        </AnchorNavigators>
      </Container>
      {children}
    </Container>
  );
}

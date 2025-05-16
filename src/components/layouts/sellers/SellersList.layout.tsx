import { Container } from "@/styles/index.styles";
import useQueryParams from "@/hooks/getQueryParams";
import { SellerListPrinter } from "@/components/sellers/sellerListPrinter";

export function SellersList() {
  const params = useQueryParams();

  if (params.id) return <></>;

  return (
    <Container
      styles={{ margin: "0 auto", marginTop: "50px", maxWidth: "600px" }}
    >
      <h2>Lista de Vendedores</h2>
      <Container>
        <SellerListPrinter />
        <Container styles={{ marginBottom: "15px" }}>
          <hr />
        </Container>
        <SellerListPrinter hasInventory />
      </Container>
    </Container>
  );
}

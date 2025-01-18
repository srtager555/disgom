import { Container } from "@/styles/index.styles";
import useQueryParams from "@/hooks/getQueryParams";
import { SellerListPrinter } from "@/components/sellers/sellerListPrinter";

export function SellersList() {
  const params = useQueryParams();

  if (params.id) return <></>;

  return (
    <Container styles={{ marginTop: "50px" }}>
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

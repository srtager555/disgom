import { useInvoice } from "@/contexts/InvoiceContext";
import { useNewDefaultCustomPricesContext } from "@/hooks/invoice/useNewDefaultCustomPricesContext";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer, GridContainer } from "@/styles/index.styles";
import { Column } from "../Product";
import { createDefaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";

export function CreateNewDefaultCustomPrices() {
  const { newDefaultCustomPrices, setNewDefaultCustomPrices } =
    useNewDefaultCustomPricesContext();
  const { invoice } = useInvoice();
  const { docs } = useGetProducts();

  return (
    <Container>
      {Object.values(newDefaultCustomPrices).length === 0 ? (
        <p>No hay cambios en los precios.</p>
      ) : (
        <Container>
          <h2>Cambios en los precios</h2>
          <p>
            Se han dectectado una serie de cambios en los precios, ¿Desea
            hacerlos por defecto para el{" "}
            {invoice?.data().client_ref ? "Cliente" : "Vendedor"} actual?
          </p>
          <Container styles={{ marginTop: "30px" }}>
            <Button
              onClick={async () => {
                if (!invoice?.data().seller_ref) return;

                await Promise.all(
                  Object.entries(newDefaultCustomPrices).map(async (el) => {
                    return createDefaultCustomPrice(
                      invoice.data().seller_ref,
                      el[1].product_ref,
                      el[1].price,
                      invoice.data().client_ref
                    );
                  })
                );

                setNewDefaultCustomPrices({});
              }}
            >
              Guardar todos
            </Button>
            <Container>
              {Object.entries(newDefaultCustomPrices).map((el, i) => {
                const name = docs?.find((_) => _.id === el[0])?.data().name;
                return (
                  <GridContainer
                    key={i}
                    $gridTemplateColumns="250px 1fr"
                    styles={{ marginTop: "10px" }}
                  >
                    <Column>{name}</Column>
                    <Column>
                      <FlexContainer
                        styles={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ marginRight: "10px" }}>
                          El nuevo precio es {el[1].price}
                        </span>
                        <Button
                          style={{
                            border: "none",
                            padding: "0",
                            textDecoration: "underline",
                          }}
                          onClick={async () => {
                            if (!invoice?.data().seller_ref) return;

                            await createDefaultCustomPrice(
                              invoice.data().seller_ref,
                              el[1].product_ref,
                              el[1].price,
                              invoice.data().client_ref
                            );

                            setNewDefaultCustomPrices((prev) => {
                              const newPrev = { ...prev };
                              delete newPrev[el[0]];
                              return newPrev;
                            });
                          }}
                        >
                          Actualizar
                        </Button>
                      </FlexContainer>
                    </Column>
                  </GridContainer>
                );
              })}
            </Container>
          </Container>
        </Container>
      )}
    </Container>
  );
}

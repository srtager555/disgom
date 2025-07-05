import { useInvoice } from "@/contexts/InvoiceContext";
import { HasInvoice } from "@/pages/invoices/manage";
import { globalCSSVars } from "@/styles/colors";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { useContext } from "react";
import styled, { css } from "styled-components";

const HasInvoiceContainer = styled(Container)<{ hasInovice: boolean }>`
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 10px;
  background-color: ${globalCSSVars["--background"]};
  border-radius: 10px;
  border: 1px solid #fff;
  width: 500px;
  opacity: 0.35;
  transition: all 0.3s ease-in-out;

  &:hover {
    opacity: 1;
  }

  ${(props) =>
    !props.hasInovice &&
    css`
      display: none;
      opacity: 0;
    `}
`;

type props = {
  children: children;
};

export function RefreshData({ children }: props) {
  const { invoice } = useInvoice();
  const { hasInvoice } = useContext(HasInvoice);
  const refresh_data = invoice?.data().refresh_data;
  const router = useRouter();

  return (
    <Container
      styles={{
        paddingBottom: (refresh_data && true) || hasInvoice ? "150px" : "0",
      }}
    >
      {children}
      <HasInvoiceContainer hasInovice={(refresh_data && true) || hasInvoice}>
        <h3>
          {refresh_data === "deleted" ? (
            <>Eliminación detectada</>
          ) : (
            <>Cambios Dectectados</>
          )}
        </h3>
        <p>
          {refresh_data === "deleted" ? (
            <>Se detecto la eleminación de la factura referida, </>
          ) : (
            <>Se han dectectados cambios en los datos, </>
          )}
          {refresh_data ? (
            <>verifique que todo esta en orden</>
          ) : (
            <>se necesita actualizar la factura que esta referencia a está.</>
          )}
        </p>
        <FlexContainer
          styles={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Button
            style={{ marginTop: "10px", whiteSpace: "nowrap" }}
            onClick={async () => {
              if (refresh_data)
                await updateDoc(invoice?.ref, {
                  refresh_data: null,
                });

              await router.push(
                refresh_data
                  ? "/invoices"
                  : "/invoices/manage?id=" +
                      invoice?.data().next_invoice_ref?.id
              );

              router.reload();
            }}
          >
            {refresh_data ? "Todo en orden" : "Actualizar factura"}
          </Button>
          <p style={{ flex: "1" }}>
            {refresh_data ? (
              <>*Verifique que todo esta bien, antes de tocar el botón*</>
            ) : (
              <>*Termine de hacer los cambios requeridos primero*</>
            )}
          </p>
        </FlexContainer>
      </HasInvoiceContainer>
    </Container>
  );
}

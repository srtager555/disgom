import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { SellersLayout } from "@/components/layouts/sellers/Sellers.layout";
import { SellersList } from "@/components/layouts/sellers/SellersList.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { createSeller } from "@/tools/sellers/create";
import { FormEvent, ReactElement, useRef } from "react";

const Page: NextPageWithLayout = () => {
  const formRef = useRef<HTMLFormElement>(null);

  async function handlerCreateSeller(e: FormEvent) {
    e.preventDefault();

    const { sellerName, hasInventoryString } = e.target as typeof e.target & {
      sellerName: HTMLInputElement;
      hasInventoryString: HTMLInputElement;
    };

    await createSeller(
      sellerName.value,
      Number(hasInventoryString.value) ? true : false
    );

    formRef.current?.reset();
  }

  return (
    <Container>
      <h3>Agregar o editar un vendedor</h3>
      <p>
        Para editar información basica de un vendedor seleccionelo en la lista
      </p>
      <Form ref={formRef} onSubmit={handlerCreateSeller}>
        <FlexContainer styles={{ alignItems: "flex-end" }}>
          <InputText name="sellerName" inline marginBottom="0px" required>
            Nombre
          </InputText>

          <Select
            name="hasInventoryString"
            marginBottom="0px"
            inline
            options={[
              { name: "No manejará inventario", value: "0" },
              { name: "Manejará inventario", value: "1" },
            ]}
          >
            ¿Este vendedor manejará inventario?
          </Select>
          <Button $primary>Agregar</Button>
        </FlexContainer>
      </Form>
    </Container>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return (
    <SellersLayout>
      {page}
      <SellersList />
    </SellersLayout>
  );
};

export default Page;

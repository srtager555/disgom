import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import {
  SellerContext,
  SellersLayout,
} from "@/components/layouts/sellers/Sellers.layout";
import { SellersList } from "@/components/layouts/sellers/SellersList.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { createSeller } from "@/tools/sellers/create";
import { disableSeller, editSeller } from "@/tools/sellers/edit";
import {
  FormEvent,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const Page: NextPageWithLayout = () => {
  const { sellerSelected, setSellerSelected } = useContext(SellerContext);
  const [defaultName, setDefaultName] = useState<string | undefined>(undefined);
  const [defaultSelected, setDefaultSelected] = useState<string | undefined>(
    undefined
  );
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout | undefined>();
  const formRef = useRef<HTMLFormElement>(null);

  async function hideSeller() {
    const out = setTimeout(() => {
      if (sellerSelected) disableSeller(sellerSelected.ref);
      if (setSellerSelected) setSellerSelected(undefined);
    }, 5000);

    setTimeOut(out);
  }

  async function handlerCreateSeller(e: FormEvent) {
    e.preventDefault();

    const { sellerName, hasInventoryString } = e.target as typeof e.target & {
      sellerName: HTMLInputElement;
      hasInventoryString: HTMLInputElement;
    };

    if (sellerSelected) {
      await editSeller(
        sellerSelected.ref,
        sellerName.value,
        Number(hasInventoryString.value) ? true : false
      );
    } else {
      await createSeller(
        sellerName.value,
        Number(hasInventoryString.value) ? true : false
      );
    }

    formRef.current?.reset();
  }

  useEffect(() => {
    if (!sellerSelected) {
      setDefaultName(undefined);
      setDefaultSelected(undefined);

      return;
    } else {
      const data = sellerSelected.data();

      setDefaultName(data.name);
      setDefaultSelected(data.hasInventory ? "1" : "0");
    }
  }, [sellerSelected, setSellerSelected]);

  return (
    <Container>
      <h3>Agregar o editar un vendedor</h3>
      <p>
        Para editar información basica de un vendedor seleccionelo en la lista
      </p>
      <Form ref={formRef} onSubmit={handlerCreateSeller}>
        <FlexContainer styles={{ alignItems: "flex-end" }}>
          <InputText
            name="sellerName"
            defaultValue={defaultName}
            inline
            marginBottom="0px"
            required
          >
            Nombre
          </InputText>

          <Select
            name="hasInventoryString"
            marginBottom="0px"
            inline
            options={[
              {
                name: "No manejará inventario",
                value: "0",
                selected: defaultSelected === "0",
              },
              {
                name: "Manejará inventario",
                value: "1",
                selected: defaultSelected === "1",
              },
            ]}
          >
            ¿Este vendedor manejará inventario?
          </Select>
          <Button $primary>{sellerSelected ? "Editar" : "Agregar"}</Button>
        </FlexContainer>
        {sellerSelected && (
          <Button
            onPointerDown={hideSeller}
            onPointerUp={() => clearTimeout(timeOut)}
            onMouseUp={() => clearTimeout(timeOut)}
            onMouseLeave={() => clearTimeout(timeOut)}
            $warn
            $hold
            style={{ marginTop: "10px" }}
          >
            Eliminar
          </Button>
        )}
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

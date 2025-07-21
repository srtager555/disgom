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

export async function getStaticProps() {
  // No necesitas pasar props, solo asegurar que la página se genere estáticamente.
  return {
    props: {},
  };
}

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
    <Container styles={{ margin: "0 auto", maxWidth: "600px" }}>
      <h1>Agregar o editar un vendedor</h1>
      <p>
        Para editar información basica de un vendedor seleccionelo en la lista
      </p>
      <Form
        ref={formRef}
        onSubmit={handlerCreateSeller}
        style={{ marginTop: "20px" }}
      >
        <FlexContainer
          styles={{
            marginBottom: "20px",
            gap: "10px",
            alignItems: "flex-start",
            flexDirection: "column",
          }}
        >
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
                name: "Manejará inventario",
                value: "1",
                selected: defaultSelected === "1",
              },
              {
                name: "No manejará inventario",
                value: "0",
                selected: defaultSelected === "0",
              },
            ]}
          >
            ¿Este vendedor manejará inventario?
          </Select>
          <Button $primary>{sellerSelected ? "Editar" : "Agregar"}</Button>
        </FlexContainer>
        {sellerSelected && (
          <Container>
            <p>
              Eliminar un vendedor es <b>INRREVERSIBLE</b>, las facturas
              vinculadas a el no desaparecerán
            </p>
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
          </Container>
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

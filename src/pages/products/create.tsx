import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { ProductsLayout } from "@/components/layouts/Products.layout";
import { TagManager } from "@/components/pages/products/TagManager";
import { NextPageWithLayout } from "@/pages/_app";
import { Button, Form } from "@/styles/Form.styles";
import { Container } from "@/styles/index.styles";
import { createProduct, productUnits } from "@/tools/products/create";
import { getUnits } from "@/tools/products/getUnits";
import { TagType } from "@/tools/products/tags";
import { FormEvent, ReactElement, useRef, useState } from "react";

const Page: NextPageWithLayout = () => {
  const [tagsAdded, setTagsAdded] = useState<Array<TagType>>([]);
  const productFormRef = useRef<HTMLFormElement>(null);
  const units = getUnits();

  async function handlerCreateProduct(e: FormEvent) {
    if (!productFormRef) return;
    e.preventDefault();
    const { productName, units } = e.target as EventTarget & {
      productName: HTMLInputElement;
      units: HTMLInputElement & { value: productUnits };
    };

    const tagsParsed = tagsAdded.map((el) => el.name);

    await createProduct(productName.value, units.value, tagsParsed);
    productFormRef.current?.reset();
    setTagsAdded([]);
  }

  return (
    <Container styles={{ padding: "0 1%" }}>
      <h1>Añadir un nuevo producto</h1>
      <Container
        styles={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(400px, 1fr)",
          gap: "20px",
        }}
      >
        <Form ref={productFormRef} onSubmit={handlerCreateProduct}>
          <h2>Información</h2>
          <InputText name="productName" type="text" required>
            Nombre del producto
          </InputText>
          <Select
            name="units"
            options={units.map((u) => ({ name: "en " + u, value: u }))}
          >
            ¿Como se medirá este producto?
          </Select>
          <Button $primary>Crear producto</Button>
        </Form>
        <TagManager state={tagsAdded} setState={setTagsAdded} />
      </Container>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

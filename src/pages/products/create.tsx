import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import { ProductsLayout } from "@/components/layouts/Products.layout";
import { NextPageWithLayout } from "@/pages/_app";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { getRandomColorContrastWhite } from "@/tools/generateColor";
import { createProduct, productUnits } from "@/tools/products/create";
import { getUnits } from "@/tools/products/getUnits";
import { getTags } from "@/tools/products/tags";
import { FormEvent, ReactElement, useEffect, useState } from "react";
import styled from "styled-components";

export const Tag = styled.span`
  padding: "5px 10px";
`;

const Page: NextPageWithLayout = () => {
  const [tags, setTags] = useState<Array<{ name: string; color: string }>>([]);
  const [tagsAdded, setTagsAdded] = useState<
    Array<{ name: string; color: string }>
  >([]);
  const units = getUnits();

  async function handlerCreateProduct(e: FormEvent) {
    e.preventDefault();
    const { productName, units } = e.target as EventTarget & {
      productName: HTMLInputElement;
      units: HTMLInputElement & { value: productUnits };
    };

    const tagsParsed = tagsAdded.map((el) => el.name);

    await createProduct(productName.value, units.value, tagsParsed);
  }

  useEffect(() => {
    (async () => {
      const tags = await getTags();
      const t = tags.data();
      if (t) setTags(Object.values(t.tags));
    })();
  }, []);

  return (
    <Container styles={{ padding: "0 1%" }}>
      <h1>Añadir un nuevo producto</h1>
      <Container
        styles={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(500px, 1fr)",
          gap: "20px",
        }}
      >
        <Form onSubmit={handlerCreateProduct}>
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
        </Form>
        <Container>
          <h2>Etiquetas</h2>
          <p>Las etiquetas sirven para facilitar la busqueda de productos</p>
          <Container styles={{ marginBottom: "20px" }}>
            {tagsAdded.length === 0 ? (
              <p>
                <b>¡El producto no tiene etiquetas!</b>
              </p>
            ) : (
              <Container>
                {tagsAdded.map((el, i) => {
                  return <Tag key={i}>{el.name}</Tag>;
                })}
              </Container>
            )}
          </Container>
          <p>Etiquetas disponibles:</p>
          <Form>
            <FlexContainer
              styles={{
                width: "auto",
                justifyContent: "flex-start",
                alignItems: "flex-start",
              }}
            >
              <Container
                styles={{ display: "inline-block", marginRight: "10px" }}
              >
                <InputText required>Nombre de la etiqueta</InputText>
              </Container>
              <Container styles={{ cursor: "pointer", marginRight: "10px" }}>
                <label>
                  <p>Color de la etiqueta</p>
                  <input
                    type="color"
                    value={(() => getRandomColorContrastWhite())()}
                  />
                </label>
              </Container>
              <Button $primary>Agregar</Button>
            </FlexContainer>
            {tags.length > 0 ? (
              tags.map((el, i) => <Tag key={i}>{el.name}</Tag>)
            ) : (
              <p>
                <i>No hay etiquetas, puedes crear ahí arriba</i>
              </p>
            )}
          </Form>
        </Container>
      </Container>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

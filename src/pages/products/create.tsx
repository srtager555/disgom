import { InputNumber } from "@/components/Inputs/number";
import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
import { TagManager } from "@/components/pages/products/TagManager";
import { NextPageWithLayout } from "@/pages/_app";
import { Button, Form } from "@/styles/Form.styles";
import { Container } from "@/styles/index.styles";
import {
  createProduct,
  productDoc,
  productUnits,
  unparseStep,
} from "@/tools/products/create";
import { disableProduct } from "@/tools/products/disable";
import { getUnits } from "@/tools/products/getUnits";
import { getTags, TagType } from "@/tools/products/tags";
import {
  FormEvent,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const Page: NextPageWithLayout = () => {
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);
  const [tagsAdded, setTagsAdded] = useState<Array<TagType>>([]);
  const [selectedProductData, setSelectedProductData] = useState<productDoc>();
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout>();
  const productFormRef = useRef<HTMLFormElement>(null);
  const units = getUnits();

  function handlerDisableProduct(e: FormEvent) {
    e.preventDefault();
    const timeout = setTimeout(async () => {
      if (selectedProduct) await disableProduct(selectedProduct.ref);

      if (setSelectedProduct) setSelectedProduct(undefined);
      productFormRef.current?.reset();
      setTagsAdded([]);
    }, 5000);

    setTimeOut(timeout);
  }

  async function handlerCreateProduct(e: FormEvent) {
    if (!productFormRef) return;
    e.preventDefault();
    const { productName, units, productStep } = e.target as EventTarget & {
      productName: HTMLInputElement;
      units: HTMLInputElement & { value: productUnits };
      productStep: HTMLInputElement;
    };

    const tagsParsed = tagsAdded.map((el) => el.name);

    await createProduct(
      selectedProduct?.ref,
      productName.value,
      units.value,
      tagsParsed,
      productStep.value
    );

    productFormRef.current?.reset();
    setTagsAdded([]);
    if (setSelectedProduct) setSelectedProduct(undefined);
  }

  useEffect(() => {
    async function getData() {
      // logic to get the data
      if (!selectedProduct) {
        setSelectedProductData(undefined);
        setTagsAdded([]);
        productFormRef.current?.reset();
        return;
      }

      const data = selectedProduct.data();
      setSelectedProductData(data);

      // logic to get the tags
      const tags = await getTags().then((_) => _.data()?.tags);
      if (!tags) return;
      const currentTags = data.tags.map((_) => tags[_]);

      setTagsAdded(currentTags);
    }
    getData();
  }, [selectedProduct]);

  return (
    <Container styles={{ padding: "0 1%" }}>
      <h1 style={{ marginBottom: "0px" }}>Añadir o edita un producto</h1>
      <p style={{ marginBottom: "10px" }}>
        Para editar un producto se tiene que seleccionar en la lista de
        productos
      </p>
      <Container
        styles={{
          display: "grid",
          gridTemplateColumns: "1fr minmax(400px, 1fr)",
          gap: "20px",
        }}
      >
        <Container>
          <Form ref={productFormRef} onSubmit={handlerCreateProduct}>
            <h2>Información</h2>
            <InputText
              name="productName"
              required
              defaultValue={selectedProductData?.name}
            >
              Nombre del producto
            </InputText>

            <Select
              name="units"
              options={units.map((u) => ({ name: "en " + u, value: u }))}
              defaultValue={selectedProductData?.units}
            >
              ¿Cómo se medirá este producto?
            </Select>

            <InputNumber
              name="productStep"
              defaultValue={
                selectedProductData?.step
                  ? unparseStep(selectedProductData?.step)
                  : 0
              }
              width="250px"
              max={5}
              min={0}
            >
              ¿Cuantos decimales manejará el peso?
            </InputNumber>

            <Button $primary style={{ marginRight: "10px" }}>
              {selectedProduct ? "Actualizar producto" : "Crear producto"}
            </Button>
            {selectedProduct && (
              <Button
                onPointerDown={handlerDisableProduct}
                onPointerUp={() => clearTimeout(timeOut)}
                onMouseUp={() => clearTimeout(timeOut)}
                onMouseLeave={() => clearTimeout(timeOut)}
                $warn
                $hold
              >
                Eliminar producto
              </Button>
            )}
          </Form>
          {selectedProduct && (
            <Button
              style={{ marginTop: "10px" }}
              onClick={() =>
                setSelectedProduct && setSelectedProduct(undefined)
              }
            >
              Eliminar selección
            </Button>
          )}
        </Container>
        <TagManager state={tagsAdded} setState={setTagsAdded} />
      </Container>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

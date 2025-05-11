import { InputNumber } from "@/components/Inputs/number";
import { Select } from "@/components/Inputs/select";
import { InputText } from "@/components/Inputs/text";
import {
  ProductContext,
  ProductsLayout,
} from "@/components/layouts/Products.layout";
// import { TagManager } from "@/components/pages/products/TagManager";
import { useGetProducts } from "@/hooks/products/getProducts";
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
  const products = useGetProducts();
  const [productVariant, setProductVariant] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [parentID, setParentID] = useState<string>("");

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
    const { productName, units, productStep, product_parent, followed } =
      e.target as EventTarget & {
        productName: HTMLInputElement;
        units?: HTMLInputElement & { value: productUnits };
        productStep?: HTMLInputElement;
        product_parent: HTMLInputElement;
        followed: HTMLInputElement;
      };

    const tagsParsed = tagsAdded.map((el) => el.name);

    await createProduct({
      product_ref: selectedProduct?.ref,
      name: productName.value,
      units: units?.value,
      stepRaw: productStep?.value,
      tags: tagsParsed,
      product_parent: !productVariant ? null : product_parent.value,
      followed: followed.checked,
    });

    productFormRef.current?.reset();
    setTagsAdded([]);
    setProductVariant(false);
    setFollowed(false);
    setParentID("");
    if (setSelectedProduct) setSelectedProduct(undefined);
  }

  useEffect(() => {
    const formRef = productFormRef.current;

    async function getData() {
      // logic to get the data
      if (!selectedProduct) {
        setSelectedProductData(undefined);
        setTagsAdded([]);
        productFormRef.current?.reset();
        setProductVariant(false);
        setFollowed(false);
        setParentID("");
        return;
      }

      const data = selectedProduct.data();
      setSelectedProductData(data);
      setFollowed(data?.followed || false);
      setProductVariant(data.product_parent ? true : false);
      setParentID(data.product_parent?.id || "");
      // logic to get the tags
      const tags = await getTags().then((_) => _.data()?.tags);
      if (!tags) return;
      const currentTags = data.tags.map((_) => tags[_]);

      setTagsAdded(currentTags);
    }
    getData();

    return () => {
      setParentID("");
      formRef?.reset();
    };
  }, [selectedProduct]);

  return (
    <Container styles={{ padding: "0 1%" }}>
      <h1 style={{ marginBottom: "0px" }}>Añade o edita un producto</h1>
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
              style={{ width: "300px" }}
            >
              Nombre del producto
            </InputText>
            <Container styles={{ marginBottom: "10px" }}>
              <label>
                <input
                  type="checkbox"
                  name="followed"
                  checked={followed}
                  onChange={(e) => setFollowed(e.target.checked)}
                  style={{ marginRight: "10px", display: "inline-block" }}
                />
                ¿Se debe hacer un seguimiento de las ventas semanales de este
                producto?
              </label>
            </Container>
            <Container styles={{ marginBottom: "10px" }}>
              <label>
                <input
                  onChange={function (e) {
                    const value = e.target.checked;

                    setProductVariant(value);
                  }}
                  type="checkbox"
                  checked={productVariant}
                  style={{ marginRight: "10px", display: "inline-block" }}
                />
                ¿Este producto es una variación de una existente?
              </label>
            </Container>
            {!productVariant ? (
              <>
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
              </>
            ) : (
              <Container styles={{ marginBottom: "20px" }}>
                {productVariant && typeof parentID !== "undefined" && (
                  <Container styles={{ marginTop: "10px" }}>
                    <Select
                      required
                      name="product_parent"
                      options={[
                        {
                          name: "Seleccione un producto",
                          value: "",
                          disabled: true,
                          selected: parentID === "",
                        },
                        ...(products.docsWithoutParent?.map((el) => {
                          const data = el.data();
                          return {
                            name: data.name,
                            value: el.ref.id,
                            selected: parentID === el.ref.id,
                          };
                        }) || []),
                      ]}
                    />
                  </Container>
                )}
              </Container>
            )}
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
        {/* <TagManager state={tagsAdded} setState={setTagsAdded} /> */}
      </Container>
    </Container>
  );
};

Page.getLayout = function getLayout(Page: ReactElement) {
  return <ProductsLayout>{Page}</ProductsLayout>;
};

export default Page;

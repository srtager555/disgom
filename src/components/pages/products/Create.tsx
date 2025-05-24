import AutoResizeTextarea from "@/components/Inputs/autosizetextarea";
import { Select } from "@/components/Inputs/select";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetProducts } from "@/hooks/products/getProducts";
import { Form, Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { productUnits, createProduct } from "@/tools/products/create"; // TagType and getTags removed
import { getUnits } from "@/tools/products/getUnits"; // TagType and getTags removed
import { useState, FormEvent, useEffect, useContext, useMemo } from "react"; // useRef removed

export function CreateProduct() {
  const { selectedProduct, setSelectedProduct } = useContext(ProductContext);
  const units = useMemo(() => getUnits(), []);
  const products = useGetProducts();

  // States for controlled inputs
  const [productName, setProductName] = useState("");
  const [currentProductUnits, setCurrentProductUnits] = useState<
    productUnits | ""
  >(units[0] || "");
  const [productVariant, setProductVariant] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [parentID, setParentID] = useState<string>("");

  async function handlerCreateProduct(e: FormEvent) {
    e.preventDefault();

    await createProduct({
      product_ref: selectedProduct?.ref,
      name: productName,
      units: currentProductUnits === "" ? undefined : currentProductUnits,
      stepRaw: "2",
      tags: [], // Tags are no longer managed by this component
      product_parent: productVariant && parentID ? parentID : null,
      followed: followed,
    });

    // Reset form state
    setProductName("");
    setCurrentProductUnits(units[0] || "");
    setProductVariant(false);
    setFollowed(false);
    setParentID("");
    if (setSelectedProduct) setSelectedProduct(undefined);
  }

  useEffect(() => {
    if (selectedProduct) {
      const data = selectedProduct.data();
      setProductName(data.name || "");
      setCurrentProductUnits(data.units || units[0] || "");
      setFollowed(data?.followed || false);
      const isVariant = !!data.product_parent;
      setProductVariant(isVariant);
      setParentID(
        isVariant && data.product_parent ? data.product_parent.id : ""
      );
    } else {
      // Reset form for new product creation or when selection is cleared
      setProductName("");
      setCurrentProductUnits(units[0] || "");
      setFollowed(false);
      setProductVariant(false);
      setParentID("");
    }
  }, [selectedProduct, units]);

  return (
    <Container>
      <Container>
        <Form onSubmit={handlerCreateProduct}>
          <Container styles={{ marginBottom: "10px" }}>
            <AutoResizeTextarea
              name="productName"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Nombre del producto"
            />
          </Container>
          <FlexContainer styles={{ gap: "10px", marginBottom: "10px" }}>
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
          </FlexContainer>
          {!productVariant ? (
            <>
              <Select
                name="units"
                value={currentProductUnits}
                onChange={(e) =>
                  setCurrentProductUnits(e.target.value as productUnits | "")
                }
                options={units.map((u) => ({ name: "en " + u, value: u }))}
              >
                ¿Cómo se medirá este producto?
              </Select>
            </>
          ) : (
            <Container styles={{ marginBottom: "20px" }}>
              {productVariant && typeof parentID !== "undefined" && (
                <Container styles={{ marginTop: "10px" }}>
                  <Select
                    required
                    name="product_parent"
                    value={parentID}
                    onChange={(e) => setParentID(e.target.value)}
                    options={[
                      {
                        name: "Seleccione un producto",
                        value: "",
                        disabled: true,
                      },
                      ...(products.docsWithoutParent?.map((el) => {
                        const data = el.data();
                        return {
                          name: data.name,
                          value: el.ref.id,
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
        </Form>
      </Container>
    </Container>
  );
}

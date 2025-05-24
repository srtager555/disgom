import { InputNumber } from "@/components/Inputs/number";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetProduct } from "@/hooks/products/getProduct";
import { Form, Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { addEntry } from "@/tools/products/addEntry";
import { stockType } from "@/tools/products/addToStock";
import { productDoc } from "@/tools/products/create";
import { EditEntry } from "@/tools/products/editEntry";
import { removeEntry } from "@/tools/products/removeEntry";
import { getDoc, DocumentSnapshot } from "firebase/firestore";
import {
  FormEvent,
  ChangeEvent,
  useRef,
  useState,
  useContext,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";

type props = {
  stock: stockType[];
  entryToEdit: stockType | undefined;
  setEntryToEdit: Dispatch<SetStateAction<stockType | undefined>>;
};

export function FormToAddStock({ stock, entryToEdit, setEntryToEdit }: props) {
  const product = useGetProduct();
  const { selectedProduct } = useContext(ProductContext);
  const [timeoutSaved, setTimeoutSaved] = useState<NodeJS.Timeout>();
  const [parentProduct, setParentProduct] =
    useState<DocumentSnapshot<productDoc>>();
  const [defaultCost, setDefaultCost] = useState(0);
  const [dynamicMinCost, setDynamicMinCost] = useState<number | undefined>(
    undefined
  );
  const [defaultProfitOwner, setDefaultProfitOwner] = useState(0);
  const [defaultProfitSeller, setDefaultProfitSeller] = useState(0);
  const [originalAmount, setOriginalAmount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const ownerRef = useRef<HTMLInputElement>(null);

  const handlerOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const {
      productCostPrice,
      productSalePrice,
      sellerProfit,
      amount: a,
    } = e.target as EventTarget & {
      sellerProfit: HTMLInputElement;
      productCostPrice: HTMLInputElement;
      productSalePrice: HTMLInputElement;
      amount: HTMLInputElement;
    };

    const purchase_price = parentProduct
      ? parentProduct.data()?.stock[0]?.purchase_price ?? 0
      : Number(productCostPrice.value);
    const sale_price = Number(productSalePrice.value);
    const seller_commission = Number(sellerProfit.value);
    const amount = parentProduct ? 0 : Number(a.value);

    const entryToManege = parentProduct ? product.data?.stock[0] : entryToEdit;
    console.log("theEntry", entryToManege);

    if (entryToManege) {
      console.log("?????");
      await EditEntry(
        selectedProduct.ref,
        entryToManege,
        {
          amount,
          purchase_price,
          sale_price,
          seller_commission,
          product_ref: selectedProduct.ref,
        },
        parentProduct ? true : false
      );

      setEntryToEdit(undefined);
    } else {
      console.log("!!!!");
      await addEntry(selectedProduct?.ref, {
        amount,
        purchase_price: purchase_price,
        sale_price,
        seller_commission,
      });
    }

    formRef.current?.reset();
  };

  // functions to remove a stock
  async function handlerRemoveStock() {
    if (process.env.NODE_ENV === "development") {
      if (!entryToEdit || !selectedProduct?.ref) return;
      await removeEntry(entryToEdit, selectedProduct?.ref, false);
      setEntryToEdit(undefined);
      return;
    }

    setTimeoutSaved(
      setTimeout(async () => {
        if (!entryToEdit || !selectedProduct?.ref) return;
        await removeEntry(entryToEdit, selectedProduct?.ref, false);

        setEntryToEdit(undefined);
      }, 5000)
    );
  }

  function handlerCancelRemoveStock() {
    clearTimeout(timeoutSaved);
  }

  // functions to manage the min input value
  function handlerOnChangeOwnerMin(e: ChangeEvent<HTMLInputElement>) {
    const newMin = e.target.value;
    setDynamicMinCost(Number(newMin));
  }

  // effect to get the parent
  useEffect(() => {
    async function getParent() {
      const parent_ref = product.data?.product_parent;

      if (!parent_ref) return;

      const parent = await getDoc(parent_ref);

      console.log("the parent", parent);
      setParentProduct(parent);
    }

    getParent();
  }, [product]);

  // effect to set the default values in the inputs
  // if there is a entry selected the code will put their values
  // in the default input values
  useEffect(() => {
    if (!stock || stock?.length === 0) {
      setDefaultCost(0);
      setDefaultProfitOwner(0);
      setDefaultProfitSeller(0);

      return;
    }

    const currentPriceData = stock[0];

    setDefaultCost(
      entryToEdit?.purchase_price ?? currentPriceData.purchase_price
    );
    setDefaultProfitOwner(
      entryToEdit?.sale_price ?? currentPriceData.sale_price
    );
    setDefaultProfitSeller(
      entryToEdit?.seller_commission ?? currentPriceData.seller_commission
    );
  }, [stock, entryToEdit]);

  // effect to get the original entry amount
  useEffect(() => {
    async function getEntry() {
      if (!entryToEdit) {
        setOriginalAmount(0);
        return;
      }

      const query = await getDoc(entryToEdit.entry_ref);
      const originalAmount = query.data()?.amount;

      if (originalAmount) setOriginalAmount(originalAmount);
    }
    getEntry();
  }, [entryToEdit]);

  // effect to reset the form when the selected product changes
  useEffect(() => {
    if (!formRef.current) return;

    formRef.current.reset();
    setParentProduct(undefined);
    setEntryToEdit(undefined);
  }, [selectedProduct]);

  return (
    <>
      <Form name="FormEditEntry" ref={formRef} onSubmit={handlerOnSubmit}>
        <h3>
          {parentProduct ? "Actualizar precios" : "Crear una nueva entrada"}
        </h3>
        <p>
          {parentProduct
            ? "Actualizar el precio del producto"
            : entryToEdit
            ? "Edita la entrada seleccionada"
            : "Ingresa nuevo producto al stock."}
        </p>
        <FlexContainer>
          {parentProduct ? (
            <Container styles={{ marginRight: "15px" }}>
              <p>Costo</p>
              <p style={{ fontSize: "1.3rem" }}>
                {numberParser(
                  parentProduct.data()?.stock[0]?.purchase_price ?? 0
                )}
              </p>
              <p style={{ fontSize: "1.3rem" }}>
                El precio de este producto se maneja desde la factura
              </p>
            </Container>
          ) : (
            <>
              <InputNumber
                ref={costRef}
                defaultValue={defaultCost}
                min={0}
                step={0.01}
                onChange={handlerOnChangeOwnerMin}
                name="productCostPrice"
                inline
                required
                width="90px"
              >
                Costó
              </InputNumber>
              <InputNumber
                ref={ownerRef}
                min={dynamicMinCost ?? defaultCost}
                defaultValue={defaultProfitOwner}
                name="productSalePrice"
                step="0.01"
                inline
                required
                width="90px"
              >
                Precio
              </InputNumber>
              <InputNumber
                defaultValue={defaultProfitSeller}
                name="sellerProfit"
                step="0.01"
                inline
                width={"90px"}
                required
              >
                Com.
              </InputNumber>
              <InputNumber
                defaultValue={entryToEdit?.amount}
                inline
                name="amount"
                required
                step="0.01"
                width="110px"
              >
                {entryToEdit ? (
                  <>Stock ({originalAmount})</>
                ) : (
                  <>
                    Ingresó{" "}
                    {selectedProduct?.data()
                      ? `${selectedProduct.data().units}`
                      : ""}
                  </>
                )}
              </InputNumber>
            </>
          )}
        </FlexContainer>
        {!parentProduct && (
          <FlexContainer
            styles={{
              display: "inline-flex",
              justifyContent: "space-between",
            }}
          >
            <Container>
              <Button style={{ marginRight: "10px" }}>
                {parentProduct
                  ? "Editar precio"
                  : entryToEdit
                  ? "Editar entrada"
                  : "Agregar entrada"}
              </Button>
            </Container>
            {entryToEdit && (
              <Button
                $warn
                $hold
                onClick={(e) => e.preventDefault()}
                onPointerDown={handlerRemoveStock}
                onPointerUp={handlerCancelRemoveStock}
                onPointerLeave={handlerCancelRemoveStock}
              >
                {entryToEdit.amount === originalAmount
                  ? "Eliminar entrada"
                  : "Eliminar existencias"}
              </Button>
            )}
          </FlexContainer>
        )}
      </Form>
    </>
  );
}

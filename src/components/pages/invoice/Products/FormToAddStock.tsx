import { InputNumber } from "@/components/Inputs/number";
import { ProductContext } from "@/components/layouts/Products.layout";
import { useGetProduct } from "@/hooks/products/getProduct";
import { Form, Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { numberParser } from "@/tools/numberPaser";
import { parseNumberInput } from "@/tools/parseNumericInput"; // Asegúrate que la ruta sea correcta
import { addEntry } from "@/tools/products/addEntry";
import { stockType } from "@/tools/products/addToStock";
import { productDoc } from "@/tools/products/create";
import { EditEntry } from "@/tools/products/editEntry";
import { removeEntry } from "@/tools/products/removeEntry";
import { getDoc, DocumentSnapshot } from "firebase/firestore";
import {
  FormEvent,
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

interface FormState {
  productCostPrice: string;
  productSalePrice: string;
  sellerProfit: string;
  amount: string;
}

const initialFormState: FormState = {
  productCostPrice: "0",
  productSalePrice: "0",
  sellerProfit: "0",
  amount: "0",
};

// Tipo para el evento de input, compatible con parseNumberInput
type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export function FormToAddStock({ stock, entryToEdit, setEntryToEdit }: props) {
  const product = useGetProduct();
  const { selectedProduct } = useContext(ProductContext);
  const [timeoutSaved, setTimeoutSaved] = useState<NodeJS.Timeout>();
  const [parentProduct, setParentProduct] =
    useState<DocumentSnapshot<productDoc>>();
  const [dynamicMinCost, setDynamicMinCost] = useState<number | undefined>(
    undefined
  );
  const [originalAmount, setOriginalAmount] = useState(0);
  const [formValues, setFormValues] = useState<FormState>(initialFormState);

  const handlerOnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const {
      productCostPrice: formProductCostPrice, // Renombrado para evitar conflicto de scope si es necesario
      productSalePrice: formProductSalePrice,
      sellerProfit: formSellerProfit,
      amount: formAmount,
    } = formValues;

    const numericFormAmount = Number(formAmount);
    const numericFormProductCostPrice = Number(formProductCostPrice);
    const numericFormProductSalePrice = Number(formProductSalePrice);
    const numericFormSellerProfit = Number(formSellerProfit);

    if (numericFormAmount === 0) {
      alert("El ingreso del producto no puede ser 0");

      return;
    }

    if (numericFormProductCostPrice === 0) {
      alert("El precio del costo del producto no puede ser 0");

      return;
    }

    if (numericFormProductCostPrice > numericFormProductSalePrice) {
      alert(
        "El precio del costo del producto no puede ser mayor al precio de venta"
      );

      return;
    }

    if (numericFormSellerProfit === 0) {
      if (!confirm("¿Esta seguro que la comision del vendedor es 0?")) return;
    }

    const purchase_price = parentProduct
      ? parentProduct.data()?.stock[0]?.purchase_price ?? 0
      : numericFormProductCostPrice;
    const sale_price = numericFormProductSalePrice;
    const seller_commission = numericFormSellerProfit;
    const amount = parentProduct ? 0 : numericFormAmount;

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

    setFormValues(initialFormState);
    setDynamicMinCost(Number(initialFormState.productCostPrice));
  };

  // functions to remove a stock
  async function handlerRemoveStock() {
    setTimeoutSaved(
      setTimeout(
        async () => {
          if (!entryToEdit || !selectedProduct?.ref) return;
          await removeEntry(entryToEdit, selectedProduct?.ref, false);

          setEntryToEdit(undefined);
        },
        process.env.NODE_ENV === "development" ? 0 : 5000
      )
    );
  }

  function handlerCancelRemoveStock() {
    clearTimeout(timeoutSaved);
  }

  // Generic handler to update formValues
  const handleFormValueChange = (fieldName: keyof FormState, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  console.log("formValues", formValues);

  // Specific handlers for each numeric input using parseNumberInput
  const handleCostPriceChange = (event: InputChangeEvent) => {
    parseNumberInput(
      (newCost) => {
        const numericNewCost = Number(newCost);

        if (isNaN(numericNewCost)) return;

        console.log("newCost", newCost);
        handleFormValueChange("productCostPrice", newCost);
        setDynamicMinCost(numericNewCost); // Update min for sale price
      },
      event,
      { min: 0 }
    );
  };

  const handleSalePriceChange = (event: InputChangeEvent) => {
    parseNumberInput(
      (newPrice) => handleFormValueChange("productSalePrice", newPrice),
      event,
      { min: 0 }
    );
  };

  const handleSellerProfitChange = (event: InputChangeEvent) => {
    parseNumberInput(
      (newProfit) => handleFormValueChange("sellerProfit", newProfit),
      event,
      { min: 0 }
    );
  };

  const handleAmountChange = (event: InputChangeEvent) => {
    parseNumberInput(
      (newAmount) => handleFormValueChange("amount", newAmount),
      event,
      { min: 0 }
    );
  };

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
      // Reset to initial if no stock, unless an entry is being edited
      if (!entryToEdit) {
        setFormValues((prev) => ({
          ...prev, // Keep amount if it was set by entryToEdit effect
          productCostPrice: initialFormState.productCostPrice,
          productSalePrice: initialFormState.productSalePrice,
          sellerProfit: initialFormState.sellerProfit,
        }));
        setDynamicMinCost(Number(initialFormState.productCostPrice));
      }
      return;
    }

    const currentPriceData = stock[0];
    const cost = entryToEdit?.purchase_price ?? currentPriceData.purchase_price;
    const salePrice = entryToEdit?.sale_price ?? currentPriceData.sale_price;
    const sellerCommission =
      entryToEdit?.seller_commission ?? currentPriceData.seller_commission;

    setFormValues((prev) => ({
      ...prev, // Keep amount if it was set by entryToEdit effect
      productCostPrice: String(cost),
      productSalePrice: String(salePrice),
      sellerProfit: String(sellerCommission),
    }));
    setDynamicMinCost(cost);
  }, [stock, entryToEdit]);

  // effect to get the original entry amount
  useEffect(() => {
    async function getEntry() {
      if (!entryToEdit) {
        setOriginalAmount(0);
        // If not editing, amount should be initial (e.g., 0 for new entry)
        // This might be redundant if selectedProduct effect already reset formValues
        setFormValues((prev) => ({ ...prev, amount: initialFormState.amount }));
        return;
      }

      setFormValues((prev) => ({
        ...prev,
        amount: String(entryToEdit.amount),
      }));
      const query = await getDoc(entryToEdit.entry_ref);
      const originalAmount = query.data()?.amount;
      if (originalAmount) setOriginalAmount(originalAmount);
      else setOriginalAmount(entryToEdit.amount); // Fallback
    }
    getEntry();
  }, [entryToEdit]);

  // effect to reset the form when the selected product changes
  useEffect(() => {
    setFormValues(initialFormState);
    setParentProduct(undefined);
    setEntryToEdit(undefined);
    setDynamicMinCost(Number(initialFormState.productCostPrice));
  }, [selectedProduct, setEntryToEdit]);

  return (
    <>
      <Form name="FormEditEntry" onSubmit={handlerOnSubmit}>
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
                value={formValues.productCostPrice}
                onChange={handleCostPriceChange}
                typeText
                inline
                required
                width="90px"
              >
                Costó
              </InputNumber>
              <InputNumber
                typeText
                value={formValues.productSalePrice}
                onChange={handleSalePriceChange}
                name="productSalePrice"
                inline
                required
                width="90px"
              >
                Precio
              </InputNumber>
              <InputNumber
                typeText
                value={formValues.sellerProfit}
                onChange={handleSellerProfitChange}
                name="sellerProfit"
                inline
                width={"90px"}
                required
              >
                Com.
              </InputNumber>
              <InputNumber
                typeText
                value={formValues.amount}
                onChange={handleAmountChange}
                inline
                name="amount"
                required
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
        {(!parentProduct || (parentProduct && product.data?.stock[0])) && ( // Show buttons if not parent OR if parent and has stock to edit prices
          <FlexContainer
            styles={{
              display: "inline-flex",
              justifyContent: "space-between",
            }}
          >
            <Container>
              <Button style={{ marginRight: "10px" }}>
                {parentProduct && product.data?.stock[0] // Check if parentProduct has stock data to determine button text
                  ? "Editar precio"
                  : entryToEdit
                  ? "Editar entrada"
                  : "Agregar entrada"}
              </Button>
            </Container>
            {entryToEdit && (
              <Button // This button is for deleting an entry, should only show if entryToEdit exists
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

import {
  Dispatch,
  memo,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  MutableRefObject,
} from "react";
import { Column, Input } from "../../Product";
import { Container } from "@/styles/index.styles";
import { useDebounce } from "@/hooks/debounce";
import { useInvoice } from "@/contexts/InvoiceContext";
import { someHumanChangesDetected } from "./Product";
import { useNewDefaultCustomPricesContext } from "@/hooks/invoice/useNewDefaultCustomPricesContext";
import { outputType } from "@/tools/products/addOutputs";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";
import { isEqual } from "lodash";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { getParentStock } from "@/tools/products/getParentStock";
import { numberParser } from "@/tools/numberPaser";

type props = {
  product_doc: DocumentSnapshot<productDoc>;
  product_ref: DocumentReference<productDoc>;
  defaultCustomPrice: number | undefined;
  outputs: DocumentSnapshot<outputType>[];
  sellerHasInventory: boolean | undefined;
  setCustomPrice: Dispatch<SetStateAction<number | undefined>>;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
};

// サラマンダー
export const Price = memo(BasePrice, (prev, next) => {
  if (prev.product_ref.id !== next.product_ref.id) return false;
  if (prev.defaultCustomPrice !== next.defaultCustomPrice) return false;
  if (isEqual(prev.outputs, next.outputs)) return false;

  return true;
});

export function BasePrice({
  product_ref,
  product_doc,
  defaultCustomPrice,
  sellerHasInventory,
  outputs,
  setCustomPrice,
  someHumanChangesDetected,
}: props) {
  const [isDefaultCustomPrice, setIsDefaultCustomPrice] = useState({
    isThat: false,
    areTheSame: false,
  });
  const { invoice } = useInvoice(); // Get invoice context
  const invoiceType = invoice?.data()?.invoice_type;
  const priceMultiplier = invoiceType !== "normal" ? -1 : 1; // Determine multiplier
  const [normalPrice, setNormalPrice] = useState(0);
  // Initialize state
  const [newPrice, setNewPrice] = useState(0);
  const humanAmountChanged = useRef(false);
  const debounceNewPrice = useDebounce(newPrice, 1000);

  // get the normalPrice
  useEffect(() => {
    async function getNormalPrice() {
      const parent = product_doc.data()?.product_parent;
      const productData = product_doc.data();

      if (parent) {
        const parentDoc = await getParentStock(parent);
        parentDoc.sort(
          (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
        );

        const price = parentDoc[0]?.sale_price || 0;
        setNormalPrice(price * priceMultiplier);
      } else {
        const productStock =
          productData?.stock.sort(
            (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
          ) ?? [];
        const price = productStock[0]?.sale_price || 0;
        setNormalPrice(price * priceMultiplier);
      }
    }

    getNormalPrice();
  }, [priceMultiplier, product_doc]);

  // Effect to update custom price based on debounced input
  useEffect(() => {
    if (!humanAmountChanged.current) return;

    // Compare debounced value with potentially negated normalPrice
    const effectiveNormalPrice = normalPrice * priceMultiplier;
    // Use a small tolerance for floating point comparison if necessary
    const tolerance = 0.001;
    if (
      Math.abs((debounceNewPrice as number) - effectiveNormalPrice) < tolerance
    ) {
      setCustomPrice(undefined);
    } else {
      setCustomPrice(debounceNewPrice as number);
    }
    humanAmountChanged.current = false;
  }, [
    debounceNewPrice,
    normalPrice,
    setCustomPrice,
    humanAmountChanged,
    priceMultiplier,
  ]);

  // Effect to set the initial price based on existing outputs or normal price
  useEffect(() => {
    async function manageThePrice() {
      // use the normal price or the default custom price if exits
      console.log(
        "checking prices, custom seller/client price and normal price",
        defaultCustomPrice,
        normalPrice
      );
      const priceToUse = defaultCustomPrice || normalPrice;

      // Getting the price from the outputs
      if (outputs.length > 0) {
        const output = outputs[0].data();
        const priceFromOutput = output?.sale_price as number;

        // check if the price a default custom price
        if (output?.default_custom_price_ref) {
          setIsDefaultCustomPrice({
            isThat: true,
            areTheSame: defaultCustomPrice === priceFromOutput,
          });
        } else {
          setIsDefaultCustomPrice({
            isThat: false,
            areTheSame: false,
          });
        }

        setNewPrice(priceFromOutput * priceMultiplier); // Apply multiplier
      } else {
        setNewPrice(priceToUse * priceMultiplier); // Apply multiplier to default
      }
    }

    manageThePrice();
  }, [outputs, normalPrice, priceMultiplier, defaultCustomPrice]); // Add dependencies

  return (
    <Column
      gridColumn={sellerHasInventory ? "" : "span 2"}
      printGridColumn={sellerHasInventory ? "" : "span 3"}
    >
      <Container className="show-print" styles={{ textAlign: "center" }}>
        {numberParser(newPrice, true)}
      </Container>
      <PriceInputMemo
        product_ref={product_ref}
        newPrice={newPrice}
        normalPrice={normalPrice}
        setNewPrice={setNewPrice}
        humanAmountChanged={humanAmountChanged}
        someHumanChangesDetected={someHumanChangesDetected}
        priceMultiplier={priceMultiplier} // Pass multiplier
        isDefaultCustomPrice={isDefaultCustomPrice}
      />
    </Column>
  );
}

type inputProps = {
  product_ref: DocumentReference<productDoc>;
  newPrice: number;
  normalPrice: number;
  setNewPrice: Dispatch<SetStateAction<number>>;
  humanAmountChanged: MutableRefObject<boolean>;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
  isDefaultCustomPrice: {
    isThat: boolean;
    areTheSame: boolean;
  };
  priceMultiplier: number; // Receive multiplier
};

const PriceInputMemo = memo(PriceInputBase, (prev, next) => {
  if (prev.newPrice != next.newPrice) return false;
  if (prev.normalPrice != next.normalPrice) return false;
  if (prev.priceMultiplier != next.priceMultiplier) return false; // Compare multiplier
  if (
    isEqual(prev.isDefaultCustomPrice.isThat, next.isDefaultCustomPrice.isThat)
  )
    return false;

  // No need to compare refs or setters
  return true;
});

function PriceInputBase({
  product_ref,
  newPrice,
  normalPrice,
  setNewPrice,
  humanAmountChanged,
  someHumanChangesDetected,
  priceMultiplier,
  isDefaultCustomPrice,
}: inputProps) {
  const { setNewDefaultCustomPrices } = useNewDefaultCustomPricesContext();
  const { checkHasNextInvoice } = useHasNextInvoice();
  const [priceValue, setPriceValue] = useState("0");

  // effect to update the priceValue with the newPrice
  useEffect(() => {
    setPriceValue(String(newPrice));
  }, [newPrice]);

  return (
    <Container className="hide-print">
      <Input
        onChange={(e) => {
          const value = parseNumberInput(() => {}, e, { returnRaw: true });
          if (value === undefined) return;

          setPriceValue(value);

          const numericValue = Number(value);
          if (isNaN(numericValue)) {
            console.log("Invalid price detected, maybe is a decimal number?");
            return;
          }

          checkHasNextInvoice(
            () => setNewPrice(numericValue),
            true,
            product_ref.id
          );

          if (normalPrice != numericValue && !isDefaultCustomPrice.areTheSame) {
            setNewDefaultCustomPrices((prev) => ({
              ...prev,
              [product_ref.id]: {
                price: numericValue,
                product_ref,
              },
            }));
          } else {
            setNewDefaultCustomPrices((prev) => {
              const newPrev = { ...prev };
              delete newPrev[product_ref.id];
              return newPrev;
            });
          }
          humanAmountChanged.current = true;
          someHumanChangesDetected.current.price = true;
        }}
        value={priceValue} // Use the state value directly (already potentially negative)
        style={{ zIndex: "1", position: "relative" }}
        type="number"
      />
      <Container
        styles={{
          position: "absolute",
          top: "0",
          left: "-10px",
          width: "calc(100% + 10px)",
          height: "100%",
          // Compare current price with potentially negated normal price
          backgroundColor:
            newPrice !== normalPrice * priceMultiplier
              ? isDefaultCustomPrice.isThat
                ? isDefaultCustomPrice.areTheSame
                  ? "orange"
                  : "orangered"
                : "green"
              : "transparent",
          zIndex: "0",
        }}
      ></Container>
    </Container>
  );
}

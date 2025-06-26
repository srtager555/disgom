import {
  Dispatch,
  memo,
  SetStateAction,
  useEffect,
  useState,
  MutableRefObject,
} from "react";
import { Column, Input } from "../../Product";
import { Container } from "@/styles/index.styles";
import { useInvoice } from "@/contexts/InvoiceContext";
import { someHumanChangesDetected } from "./Product";
import { useNewDefaultCustomPricesContext } from "@/hooks/invoice/useNewDefaultCustomPricesContext";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { isEqual } from "lodash";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { numberParser } from "@/tools/numberPaser";
import { rawOutput } from "./AddOutput";

type props = {
  product_doc: DocumentSnapshot<productDoc>;
  product_ref: DocumentReference<productDoc>;
  defaultCustomPrice: number | undefined;
  outputs: rawOutput[];
  sellerHasInventory: boolean | undefined;
  setCustomPrice: Dispatch<SetStateAction<number | undefined>>; // Keep this prop for now, it's an input to useManageOutputs
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
};

// サラマンダー
export const Price = memo(BasePrice, (prev, next) => {
  if (prev.product_ref.id !== next.product_ref.id) return false;
  if (prev.defaultCustomPrice !== next.defaultCustomPrice) return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;

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
  const [normalPrice, setNormalPrice] = useState(0); // This is the product's base price
  const [priceValue, setPriceValue] = useState("0");
  const { setNewDefaultCustomPrices } = useNewDefaultCustomPricesContext();

  // --- Effects ---
  // get the normalPrice
  useEffect(() => {
    const productData = product_doc.data();
    if (productData) {
      if (productData.product_parent) {
        // If it has a parent, its price comes from the parent's stock
        // This logic might need to be moved to a shared hook if parent stock is dynamic
        // For now, assuming product_doc.data()?.stock is the source for normal price
        const price = productData.stock[0]?.sale_price || 0; // Assuming first stock item has the sale price
        setNormalPrice(price);
      } else {
        const productStock =
          productData?.stock.sort(
            (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
          ) ?? [];
        const price = productStock[0]?.sale_price || 0;
        setNormalPrice(price * priceMultiplier);
      }
    }
  }, [priceMultiplier, product_doc]);

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
        const output = outputs[0];
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

        setPriceValue(String(priceFromOutput * priceMultiplier)); // Apply multiplier
      } else {
        setPriceValue(String(priceToUse * priceMultiplier)); // Apply multiplier to default
      }
    }

    manageThePrice();
  }, [outputs, normalPrice, priceMultiplier, defaultCustomPrice]); // Add dependencies

  // --- Handlers (only update local state and human interaction flag) ---
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(() => {}, e, { returnRaw: true });
    if (value === undefined) return;
    setPriceValue(value);
  };

  const handlePriceBlur = () => {
    const numericValue = Number(priceValue);
    if (isNaN(numericValue)) {
      console.log("Invalid price detected, maybe is a decimal number?");
      return;
    }

    // Compare with potentially negated normal price
    const effectiveNormalPrice = normalPrice * priceMultiplier;
    const tolerance = 0.001;

    // Update customPrice state, which is an input to useManageOutputs
    if (Math.abs(numericValue - effectiveNormalPrice) < tolerance) {
      setCustomPrice(undefined);
    } else {
      setCustomPrice(numericValue);
    }

    // Update context for new default custom prices
    if (numericValue !== normalPrice && !isDefaultCustomPrice.areTheSame) {
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

    // Notify parent component of human interaction
    someHumanChangesDetected.current.price = true;
  };

  return (
    <Column
      gridColumn={sellerHasInventory ? "" : "span 2"}
      printGridColumn={sellerHasInventory ? "" : "span 3"}
    >
      <Container className="show-print" styles={{ textAlign: "center" }}>
        {numberParser(Number(priceValue), true)}
      </Container>
      <Container className="hide-print">
        <Input
          onChange={handlePriceChange}
          onBlur={handlePriceBlur}
          value={priceValue}
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
              Number(priceValue) !== normalPrice * priceMultiplier
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
    </Column>
  );
}

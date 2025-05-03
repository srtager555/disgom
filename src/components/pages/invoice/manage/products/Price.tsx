import {
  Dispatch,
  memo,
  SetStateAction,
  useEffect,
  useRef,
  RefObject,
  useState,
} from "react";
import { Column, Input } from "../../Product";
import { Container } from "@/styles/index.styles";
import { useDebounce } from "@/hooks/debounce";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { useInvoice } from "@/contexts/InvoiceContext"; // Import useInvoice
import { someHumanChangesDetected } from "./Product";

type props = {
  product_id: string;
  normalPrice: number;
  setCustomPrice: Dispatch<SetStateAction<number | undefined>>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
};

export function Price({
  product_id,
  normalPrice,
  setCustomPrice,
  someHumanChangesDetected,
}: props) {
  const { invoice } = useInvoice(); // Get invoice context
  const invoiceType = invoice?.data()?.invoice_type;
  const priceMultiplier = invoiceType !== "normal" ? -1 : 1; // Determine multiplier

  // Initialize state considering the multiplier
  const [newPrice, setNewPrice] = useState(normalPrice * priceMultiplier);
  const humanAmountChanged = useRef(false);
  const outputs = useGetProductOutputByID(product_id);
  const debounceNewPrice = useDebounce(newPrice);

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
    if (outputs.length > 0) {
      const priceFromOutput = outputs[0].data()?.sale_price as number;
      setNewPrice(priceFromOutput * priceMultiplier); // Apply multiplier
    } else {
      setNewPrice(normalPrice * priceMultiplier); // Apply multiplier to default
    }
  }, [outputs, normalPrice, priceMultiplier]); // Add dependencies

  return (
    <Column>
      <PriceInputMemo
        newPrice={newPrice}
        normalPrice={normalPrice}
        setNewPrice={setNewPrice}
        humanAmountChanged={humanAmountChanged}
        someHumanChangesDetected={someHumanChangesDetected}
        priceMultiplier={priceMultiplier} // Pass multiplier
      />
    </Column>
  );
}

type inputProps = {
  newPrice: number;
  normalPrice: number;
  setNewPrice: Dispatch<SetStateAction<number>>;
  humanAmountChanged: RefObject<boolean>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
  priceMultiplier: number; // Receive multiplier
};

const PriceInputMemo = memo(PriceInputBase, (prev, next) => {
  if (prev.newPrice != next.newPrice) return false;
  if (prev.normalPrice != next.normalPrice) return false;
  if (prev.priceMultiplier != next.priceMultiplier) return false; // Compare multiplier
  // No need to compare refs or setters
  return true;
});

function PriceInputBase({
  newPrice,
  normalPrice,
  setNewPrice,
  humanAmountChanged,
  someHumanChangesDetected,
  priceMultiplier,
}: inputProps) {
  return (
    <>
      <Input
        onChange={(e) => {
          const value = e.target.value;
          setNewPrice(Number(value));
          humanAmountChanged.current = true;
          someHumanChangesDetected.current.price = true;
        }}
        value={newPrice} // Use the state value directly (already potentially negative)
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
              ? "green"
              : "transparent",
          zIndex: "0",
        }}
      ></Container>
    </>
  );
}

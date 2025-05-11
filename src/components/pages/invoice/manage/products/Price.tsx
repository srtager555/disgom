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
import { useInvoice } from "@/contexts/InvoiceContext"; // Import useInvoice
import { someHumanChangesDetected } from "./Product";
import { useNewDefaultCustomPricesContext } from "@/hooks/invoice/useNewDefaultCustomPricesContext";
import { outputType } from "@/tools/products/addOutputs";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { defaultCustomPrice } from "@/tools/sellers/customPrice/createDefaultCustomPrice";
import { productDoc } from "@/tools/products/create";
import { useHasNextInvoice } from "@/hooks/invoice/useHasNextInvoice";

type props = {
  product_ref: DocumentReference<productDoc>;
  defaultCustomPrice: defaultCustomPrice | undefined;
  outputs: DocumentSnapshot<outputType>[];
  normalPrice: number;
  setCustomPrice: Dispatch<SetStateAction<number | undefined>>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
};

export function Price({
  product_ref,
  defaultCustomPrice,
  normalPrice,
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

  // Initialize state considering the multiplier
  const [newPrice, setNewPrice] = useState(normalPrice * priceMultiplier);
  const humanAmountChanged = useRef(false);
  const debounceNewPrice = useDebounce(newPrice, 1000);

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
      const priceToUse = defaultCustomPrice?.price || normalPrice;

      // Getting the price from the outputs
      if (outputs.length > 0) {
        const output = outputs[0].data();
        const priceFromOutput = output?.sale_price as number;

        // check if the price a default custom price
        if (output?.default_custom_price_ref) {
          setIsDefaultCustomPrice({
            isThat: true,
            areTheSame: defaultCustomPrice?.price === priceFromOutput,
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
    <Column>
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
  humanAmountChanged: RefObject<boolean>;
  someHumanChangesDetected: RefObject<someHumanChangesDetected>;
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

  return (
    <>
      <Input
        onChange={(e) => {
          const value = Number(e.target.value);
          checkHasNextInvoice(() => setNewPrice(value), true, product_ref.id);

          if (normalPrice != value && !isDefaultCustomPrice.areTheSame) {
            setNewDefaultCustomPrices((prev) => ({
              ...prev,
              [product_ref.id]: {
                price: value,
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
              ? isDefaultCustomPrice.isThat
                ? isDefaultCustomPrice.areTheSame
                  ? "orange"
                  : "orangered"
                : "green"
              : "transparent",
          zIndex: "0",
        }}
      ></Container>
    </>
  );
}

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
import { someHumanChangesDetected } from "./Product";
import { debounce } from "lodash";
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
  const [newPrice, setNewPrice] = useState(normalPrice);
  const humanAmountChanged = useRef(false);
  const outputs = useGetProductOutputByID(product_id);
  const debounceNewPrice = useDebounce(newPrice);
  const debouncedDetectChange = useRef(
    debounce(() => {
      someHumanChangesDetected.current.price = true;
    }, 1000)
  ).current;

  useEffect(() => {
    if (!humanAmountChanged.current) return;

    if (debounceNewPrice === normalPrice) {
      setCustomPrice(undefined);
    } else {
      setCustomPrice(debounceNewPrice as number);
    }
    humanAmountChanged.current = false;
  }, [debounceNewPrice, normalPrice, setCustomPrice, humanAmountChanged]);

  // effect to set the custom price if exists
  useEffect(() => {
    if (outputs.length === 0) return;
    const customPrice = outputs[0].data()?.sale_price as number;

    setNewPrice(customPrice);
  }, [outputs]);

  return (
    <Column>
      <PriceInputMemo
        newPrice={newPrice}
        normalPrice={normalPrice}
        setNewPrice={setNewPrice}
        humanAmountChanged={humanAmountChanged}
        debouncedDetectChange={debouncedDetectChange}
      />
    </Column>
  );
}

type inputProps = {
  newPrice: number;
  normalPrice: number;
  setNewPrice: Dispatch<SetStateAction<number>>;
  humanAmountChanged: RefObject<boolean>;
  debouncedDetectChange: () => void;
};

const PriceInputMemo = memo(PriceInputBase, (prev, next) => {
  if (prev.newPrice != next.newPrice) return false;
  if (prev.normalPrice != next.normalPrice) return false;

  return true;
});

function PriceInputBase({
  newPrice,
  normalPrice,
  setNewPrice,
  humanAmountChanged,
  debouncedDetectChange,
}: inputProps) {
  return (
    <>
      <Input
        onChange={(e) => {
          const value = e.target.value;
          setNewPrice(Number(value));
          humanAmountChanged.current = true;
          debouncedDetectChange();
        }}
        value={newPrice || normalPrice}
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
          backgroundColor: newPrice != normalPrice ? "green" : "transparent",
          zIndex: "0",
        }}
      ></Container>
    </>
  );
}

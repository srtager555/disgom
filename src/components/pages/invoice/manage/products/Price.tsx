import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";
import { Column, Input } from "../../Product";
import { Container } from "@/styles/index.styles";
import { useDebounce } from "@/hooks/debounce";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";

type props = {
  product_id: string;
  normalPrice: number;
  setCustomPrice: Dispatch<SetStateAction<number | undefined>>;
};

export const Price = memo(PriceBase, (prev, next) => {
  if (prev.normalPrice != next.normalPrice) return false;

  return true;
});

export function PriceBase({ product_id, normalPrice, setCustomPrice }: props) {
  const [newPrice, setNewPrice] = useState(normalPrice);
  const outputs = useGetProductOutputByID(product_id);
  const debounceNewPrice = useDebounce(newPrice);

  useEffect(() => {
    if (debounceNewPrice === normalPrice) return setCustomPrice(undefined);
    else setCustomPrice(debounceNewPrice as number);
  }, [debounceNewPrice, normalPrice, setCustomPrice]);

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
      />
    </Column>
  );
}

type inputProps = {
  newPrice: number;
  normalPrice: number;
  setNewPrice: Dispatch<SetStateAction<number>>;
};

const PriceInputMemo = memo(PriceInputBase, (prev, next) => {
  if (prev.newPrice != next.newPrice) return false;
  if (prev.normalPrice != next.normalPrice) return false;

  return true;
});

function PriceInputBase({ newPrice, normalPrice, setNewPrice }: inputProps) {
  return (
    <>
      <Input
        onChange={(e) => {
          const value = e.target.value;
          setNewPrice(Number(value));
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

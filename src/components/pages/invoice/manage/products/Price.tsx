import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Column, Input } from "../../Product";
import { Container } from "@/styles/index.styles";
import { useDebounce } from "@/hooks/debounce";

type props = {
  normalPrice: number;
  customPrice: number | undefined;
  setCustomPrice: Dispatch<SetStateAction<number | undefined>>;
};

export function Price({ normalPrice, customPrice, setCustomPrice }: props) {
  const [newPrice, setNewPrice] = useState(0);
  const debounceNewPrice = useDebounce(newPrice);

  useEffect(() => {
    if (debounceNewPrice === normalPrice) setCustomPrice(undefined);
    else setCustomPrice(debounceNewPrice as number);
  }, [debounceNewPrice, normalPrice, setCustomPrice]);

  return (
    <Column>
      <Input
        onChange={(e) => {
          const value = e.target.value;
          setNewPrice(Number(value));
        }}
        style={{ zIndex: "1", position: "relative" }}
        type="number"
        defaultValue={customPrice || normalPrice}
      />
      <Container
        styles={{
          position: "absolute",
          top: "0",
          left: "-10px",
          width: "calc(100% + 10px)",
          height: "100%",
          backgroundColor: customPrice ? "green" : "transparent",
          zIndex: "0",
        }}
      ></Container>
    </Column>
  );
}

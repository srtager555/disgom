import { memo, ChangeEvent } from "react";
import { Column, Input } from "../../Product";
import { Container } from "@/styles/index.styles";
import { isEqual } from "lodash";
import { numberParser } from "@/tools/numberPaser";

type props = {
  sellerHasInventory: boolean | undefined;
  priceValue: string;
  normalPrice: number;
  priceMultiplier: number;
  isDefaultCustomPrice: {
    isThat: boolean;
    areTheSame: boolean;
  };
  handlePriceChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handlePriceBlur: () => void;
};

// サラマンダー
export const Price = memo(BasePrice, (prev, next) => {
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.priceValue !== next.priceValue) return false;
  if (prev.normalPrice !== next.normalPrice) return false;
  if (!isEqual(prev.isDefaultCustomPrice, next.isDefaultCustomPrice))
    return false;

  return true;
});

export function BasePrice({
  sellerHasInventory,
  priceValue,
  normalPrice,
  priceMultiplier,
  isDefaultCustomPrice,
  handlePriceChange,
  handlePriceBlur,
}: props) {
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

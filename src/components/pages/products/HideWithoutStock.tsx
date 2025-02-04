import { Button } from "@/styles/Form.styles";
import { Dispatch, SetStateAction } from "react";

type props = {
  setHideProductWithoutStock: Dispatch<SetStateAction<boolean>>;
  hideProductWithoutStock: boolean;
};

export function HideWithoutStock({
  hideProductWithoutStock,
  setHideProductWithoutStock,
}: props) {
  return (
    <Button
      onClick={() => setHideProductWithoutStock(!hideProductWithoutStock)}
    >
      {hideProductWithoutStock ? "Mostrar todo" : "Solo con existencias"}
    </Button>
  );
}

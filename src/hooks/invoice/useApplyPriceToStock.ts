import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { someHumanChangesDetected } from "@/components/pages/invoice/manage/products/Product";
import { productDoc } from "@/tools/products/create";
import { amountListener, rawOutputToStock } from "@/tools/products/ManageSaves";
import { DocumentSnapshot } from "firebase/firestore";
import { isEqual } from "lodash";
import { MutableRefObject, useEffect, useRef, useState } from "react";

type props = {
  customPriceInput: number | undefined;
  devoRemainStock: rawOutput[];
  humanInteractionDetectedRef: MutableRefObject<someHumanChangesDetected>;
  isLoadingPrice: boolean;
  productDoc: DocumentSnapshot<productDoc>;
};

export function useApplyPriceToStock({
  customPriceInput,
  devoRemainStock,
  productDoc,
  isLoadingPrice = true,
  humanInteractionDetectedRef,
}: props) {
  const [remainStock, setRemainStock] = useState<rawOutput[]>([]);
  const lastCustomPriceInput = useRef<number | undefined>(undefined);
  const lastDevoRemainStock = useRef<rawOutput[]>([]);

  // effect to manage the remainStock with the correct Price
  useEffect(() => {
    if (isLoadingPrice) return;

    const diffRemain = !isEqual(devoRemainStock, lastDevoRemainStock.current);
    const diffCustom = customPriceInput !== lastCustomPriceInput.current;
    if (!diffRemain && !diffCustom) return;

    console.log(
      "upgrading the remainStock with the correct price, last price, current price",
      lastCustomPriceInput.current,
      customPriceInput
    );

    const rootStock = devoRemainStock.map(rawOutputToStock);
    const amount = devoRemainStock.reduce((acc, next) => acc + next.amount, 0);

    const { outputsToCreate } = amountListener(
      amount,
      rootStock,
      undefined,
      productDoc,
      customPriceInput
    );

    if (humanInteractionDetectedRef.current.price) {
      humanInteractionDetectedRef.current.outputsSolds = true;
      humanInteractionDetectedRef.current.price = false;
    }

    console.log("the remain updated:", outputsToCreate);

    setRemainStock(outputsToCreate);
    lastDevoRemainStock.current = devoRemainStock;
    lastCustomPriceInput.current = customPriceInput;
  }, [
    devoRemainStock,
    customPriceInput,
    productDoc,
    isLoadingPrice,
    humanInteractionDetectedRef,
  ]);

  return { remainStock };
}

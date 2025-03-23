import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import { DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { useGetCurrentDevolutionByProduct } from "@/hooks/invoice/getCurrentDevolution";

type devolutionBase = {
  productDoc: DocumentSnapshot<productDoc>;
  setDevolutionAmount: Dispatch<SetStateAction<number>>;
  setHumanAmountChanged: Dispatch<SetStateAction<boolean>>;
  // totalOutputs: DocumentSnapshot<outputType>[];
  sellerHasInventory: boolean | undefined;
  currentDevolution: number;
};

export const Devolution = (
  props: Omit<devolutionBase, "totalOutputs" | "currentDevolution">
) => {
  const currentInventory = useGetCurrentDevolutionByProduct(
    props.productDoc.id
  );
  // const outputs = useGetProductOutputByID(props.productDoc.id);
  // const totalOutputs = [...outputs];

  useEffect(() => {
    console.log(currentInventory);
  }, [currentInventory]);

  return (
    <DevolutionMemo
      {...props}
      currentDevolution={currentInventory.amount}
      //  totalOutputs={totalOutputs}
    />
  );
};

const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.setDevolutionAmount !== next.setDevolutionAmount) return false;
  if (prev.setHumanAmountChanged !== next.setHumanAmountChanged) return false;
  // if (!isEqual(prev.totalOutputs, next.totalOutputs)) return false;
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.currentDevolution !== next.currentDevolution) return false;

  return true;
});

function DevolutionBase({
  setDevolutionAmount,
  setHumanAmountChanged,
  // totalOutputs,
  sellerHasInventory,
  currentDevolution,
}: devolutionBase) {
  const [devo, setDevo] = useState(0);
  const devoDebounce = useDebounce(devo);

  // effect to set the debouce to the devo
  useEffect(() => {
    setDevolutionAmount(devoDebounce as number);
  }, [devoDebounce, setDevolutionAmount]);

  useEffect(() => {
    if (devo != currentDevolution) setDevo(currentDevolution);
  }, [currentDevolution]);

  // useEffect(() => {
  //   const outputsParsedToStockType = totalOutputs.map((output) => {
  //     const data = output.data() as outputType;

  //     const parsed = createStockFromOutputType(data);
  //     return parsed;
  //   });
  // }, []);

  if (sellerHasInventory) {
    return (
      <Column>
        <Input
          value={devo}
          onChange={(e) => {
            setDevo(Number(e.target.value));
            setHumanAmountChanged(true);
          }}
          type="number"
        />
      </Column>
    );
  }
}

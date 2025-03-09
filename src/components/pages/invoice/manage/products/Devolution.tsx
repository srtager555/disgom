import { Dispatch, memo, SetStateAction, useEffect, useState } from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import { DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { isEqual } from "lodash";
import { createStockFromOutputType } from "@/tools/products/ManageSaves";

type devolutionBase = {
  productDoc: DocumentSnapshot<productDoc>;
  setDevolutionAmount: Dispatch<SetStateAction<number>>;
  setHumanAmountChanged: Dispatch<SetStateAction<boolean>>;
  totalOutputs: DocumentSnapshot<outputType>[];
  sellerHasInventory: boolean | undefined;
};

export const Devolution = (props: Omit<devolutionBase, "totalOutputs">) => {
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const totalOutputs = [...outputs];

  return <DevolutionMemo {...props} totalOutputs={totalOutputs} />;
};

const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.setDevolutionAmount !== next.setDevolutionAmount) return false;
  if (prev.setHumanAmountChanged !== next.setHumanAmountChanged) return false;
  if (!isEqual(prev.totalOutputs, next.totalOutputs)) return false;
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;

  return true;
});

function DevolutionBase({
  setDevolutionAmount,
  setHumanAmountChanged,
  totalOutputs,
  sellerHasInventory,
}: devolutionBase) {
  const [devo, setDevo] = useState(0);
  const devoDebounce = useDebounce(devo);

  // effect to set the debouce to the devo
  useEffect(() => {
    setDevolutionAmount(devoDebounce as number);
  }, [devoDebounce, setDevolutionAmount]);

  useEffect(() => {
    const outputsParsedToStockType = totalOutputs.map((output) => {
      const data = output.data() as outputType;

      const parsed = createStockFromOutputType(data);
      return parsed;
    });
  }, []);

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

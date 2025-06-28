import { DocumentSnapshot, DocumentReference } from "firebase/firestore";
import { productDoc } from "../products/create";
import { outputType } from "../products/addOutputs";

export function getInventoryByProduct(
  inventory: DocumentSnapshot<outputType>[] = [],
  product_ref: DocumentReference<productDoc>
) {
  const outputs = inventory.filter((output) => {
    return output.data()?.product_ref.id === product_ref.id;
  });

  const totalAmount = outputs.reduce((acc, output) => {
    return acc + (output.data()?.amount || 0);
  }, 0);

  return {
    totalAmount,
    outputs,
  };
}

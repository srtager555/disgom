import { DocumentSnapshot, DocumentReference } from "firebase/firestore";
import { inventory_output } from "../sellers/invetory/addProduct";
import { productDoc } from "../products/create";

export function getInventoryByProduct(
  inventory: DocumentSnapshot<inventory_output>[] = [],
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

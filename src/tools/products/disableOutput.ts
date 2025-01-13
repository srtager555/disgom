import { DocumentReference, getDoc, updateDoc } from "firebase/firestore";
import { outputType } from "./addOutputs";
import { addToStock } from "./addToStock";
import { productDoc } from "./create";

export async function disableOutput(ref: DocumentReference<outputType>) {
  await updateDoc(ref, {
    disabled: true,
  });

  await updateDoc(ref, { disabled: true });
  const o = await getDoc(ref);
  const output = o.data();

  if (!output) return;

  const productRef = ref.parent.parent as DocumentReference<productDoc>;

  const p = await getDoc(productRef);
  const product = p.data();

  const lastStock = product?.stock.sort((a, b) => {
    return b.created_at.toDate().getTime() - a.created_at.toDate().getTime();
  })[0];

  if (!lastStock) return;

  await addToStock(productRef, {
    ...lastStock,
    amount: output.amount,
    purchase_price: output.cost_price,
    entry_ref: output.entry_ref,
  });
}

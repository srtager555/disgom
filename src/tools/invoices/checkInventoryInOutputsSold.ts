import {
  collection,
  DocumentSnapshot,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { invoiceType } from "./createInvoice";
import { outputType } from "../products/addOutputs";
import { isEqual, sortBy } from "lodash";
import { productDoc } from "../products/create";

export async function checkInventoryInOutputsSold(
  invoice: DocumentSnapshot<invoiceType>,
  invOutputs: DocumentSnapshot<outputType>[],
  product_ref: DocumentReference<productDoc>
) {
  const coll = collection(invoice.ref, "outputs_sold");

  // If there's no inventory to be sold, check if there are any sold outputs.
  // They are "equal" only if both are empty.
  if (invOutputs.length === 0) {
    const q = query(
      coll,
      where("product_ref", "==", product_ref),
      where("disabled", "==", false)
    );
    const soldOutputsSnap = await getDocs(q);
    return soldOutputsSnap.size === 0;
  }

  // 1. Get all currently active 'outputs_sold' for this product.
  const q = query(
    coll,
    where("product_ref", "==", product_ref),
    where("disabled", "==", false)
  );
  const soldOutputsSnap = await getDocs(q);

  // 2. Quick check on the count of items. If they don't match, they can't be equal.
  if (soldOutputsSnap.size !== invOutputs.length) {
    return false;
  }

  // 3. If counts match, perform a deep, order-independent comparison of the key values.

  const createReducedOutput = (data: outputType) => ({
    amount: data.amount,
    purchase_price: data.purchase_price,
    sale_price: data.sale_price,
    commission: data.commission,
  });

  // Create sorted arrays of the reduced objects for a stable comparison.
  const invReducedAndSorted = sortBy(
    invOutputs.map((doc) => createReducedOutput(doc.data() as outputType)),
    ["purchase_price", "sale_price", "amount", "commission"]
  );

  const soldReducedAndSorted = sortBy(
    soldOutputsSnap.docs.map((doc) =>
      createReducedOutput(doc.data() as outputType)
    ),
    ["purchase_price", "sale_price", "amount", "commission"]
  );

  // 4. Use isEqual to do a deep comparison of the two sorted arrays.
  return isEqual(invReducedAndSorted, soldReducedAndSorted);
}

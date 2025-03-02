import { getDoc } from "firebase/firestore";
import { getInvoiceByQuery } from "../invoices/getInvoiceByQuery";

export async function getProductOutputsByID(id: string) {
  const invoice = await getInvoiceByQuery();
  const data = invoice?.data();
  if (!data) return;

  const outputsRefs = data.products_outputs[id];
  const outputs = await Promise.all(
    outputsRefs.map(async (output) => await getDoc(output))
  );
  const totalAmount = outputs.reduce((acc, now) => {
    return acc + (now.data()?.amount || 0);
  }, 0);

  return { outputs, totalAmount };
}

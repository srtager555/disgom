import { doc, DocumentReference, getDoc } from "firebase/firestore";
import { getInvoiceByQuery } from "../invoices/getInvoiceByQuery";
import { DocumentWithTheOutputs } from "@/hooks/invoice/getProductOutputsByID";

export async function getProductOutputsByID(id: string) {
  const invoice = await getInvoiceByQuery();
  const data = invoice?.data();
  if (!data) return;

  if (!invoice) return;
  const ref = doc(
    invoice.ref,
    "outputs",
    id
  ) as DocumentReference<DocumentWithTheOutputs>;

  const outputs = await getDoc(ref).then(async (snap) => {
    const data = snap.data();
    if (!data) return;

    return await Promise.all(
      data?.outputs.map(async (ref) => await getDoc(ref))
    );
  });

  const totalAmount = outputs?.reduce((acc, now) => {
    return acc + (now.data()?.amount || 0);
  }, 0);

  return { outputs, totalAmount };
}

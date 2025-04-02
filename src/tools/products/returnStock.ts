import { DocumentReference, collection, addDoc } from "firebase/firestore";
import { productDoc } from "./create";
import { addToStock } from "./addToStock";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";

export async function returnStock(
  product_ref: DocumentReference<productDoc>,
  output: rawOutput
) {
  // Crear una nueva entrada con los precios del output
  const entryColl = collection(product_ref, ProductsCollection.entry);
  const entryDocRef = await addDoc(entryColl, {
    amount: output.amount,
    purchase_price: output.purchase_price,
    sale_price: output.sale_price,
    seller_commission: output.commission,
    created_at: new Date(),
    disabled: false,
  });

  // Añadir al stock usando la referencia de la entrada
  await addToStock(product_ref, {
    amount: output.amount,
    purchase_price: output.purchase_price,
    sale_price: output.sale_price,
    seller_commission: output.commission,
    product_ref,
    entry_ref: entryDocRef,
  });
}

import { DocumentSnapshot, writeBatch } from "firebase/firestore";
import { productDoc } from "./create";
import { amountListener, rawOutputToStock } from "./ManageSaves";
import { invoiceType } from "../invoices/createInvoice";
import { addOutputs } from "./addOutputs";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { stockType } from "./addToStock";
import { getAuth } from "firebase/auth";
import { MutableRefObject } from "react";
import { someHumanChangesDetected } from "@/components/pages/invoice/manage/products/Product";

async function saveNewOutputs(
  productDoc: DocumentSnapshot<productDoc>,
  outputsToCreate: rawOutput[],
  remainingStocks: rawOutput[],
  invoice: DocumentSnapshot<invoiceType>,
  currentUid: string,
  humanInteractionDetectedRef: MutableRefObject<someHumanChangesDetected>
) {
  try {
    const data = productDoc.data();
    const batch = writeBatch(productDoc.ref.firestore);

    // 4. Actualizar el stock del producto con los stocks restantes
    batch.update(data?.product_parent || productDoc.ref, {
      stock: remainingStocks.map(rawOutputToStock),
    });

    // 5. Agregar los nuevos outputs a firestore
    await addOutputs({
      invoice,
      product_doc: productDoc,
      rawOutputs: outputsToCreate,
      uid: currentUid,
      batch,
    });

    await batch.commit();

    console.log("Proceso de suma completado");
  } catch (error) {
    console.error(
      "ocurrio un error al guardar la consignacion, se cancelo la operacion atomica"
    );
    humanInteractionDetectedRef.current.outputsSolds = false;
    console.error(error);
  }
}

export function sumaOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  amount: number,
  currentAmount: number,
  defaulCustomPrices:
    | DocumentSnapshot<defaultCustomPrice>
    | undefined = undefined,
  parentStock: stockType[] | undefined,
  setRawOutputs: React.Dispatch<React.SetStateAction<rawOutput[]>>, // Re-added
  humanInteractionDetectedRef: MutableRefObject<someHumanChangesDetected>,
  customPrice?: number
) {
  const data = productDoc.data();

  // 1. Obtener el stock actual del producto
  const currentStock = data?.product_parent
    ? parentStock || []
    : productDoc.data()?.stock || [];

  // 2. Calcular la diferencia que necesitamos agregar
  const difference = amount - currentAmount;
  console.log(
    "The new amount is:",
    amount,
    "the current amount in the server is:",
    currentAmount
  );
  console.log("The diff is:", difference);

  // 3. Usar amountListener para obtener los outputs a crear y el stock restante
  const { outputsToCreate, remainingStocks } = amountListener(
    difference,
    currentStock,
    defaulCustomPrices,
    productDoc,
    customPrice
  );

  // Update the rawOutputs state immediately for UI responsiveness
  setRawOutputs((prev) => prev.concat(outputsToCreate));

  const currentUser = getAuth().currentUser;
  if (!currentUser?.uid) {
    console.error("User not authenticated. Cannot save outputs.");
    return () => {};
  }

  console.log("Proceso de suma listo para ser guardado");
  saveNewOutputs(
    productDoc,
    outputsToCreate,
    remainingStocks,
    invoice,
    currentUser.uid,
    humanInteractionDetectedRef
  );

  return () => {}; // No-op cleanup
}

import { useEffect, useState, useRef } from "react";
import { DocumentSnapshot, getFirestore } from "firebase/firestore";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { productDoc } from "@/tools/products/create";
import { SellersDoc } from "@/tools/sellers/create";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { getAuth } from "firebase/auth";
import { isEqual } from "lodash";
import {
  createStockFromOutputType,
  amountListener,
} from "@/tools/products/ManageSaves";
import { rawOutputToStock } from "@/tools/products/ManageSaves";
import { outputType } from "@/tools/products/addOutputs";
import { saveDevolution } from "@/tools/products/saveDevolution"; // Assuming saveDevolution is now direct
import { useGetCurrentDevolutionByProduct } from "./getCurrentDevolution";
import { someHumanChangesDetected } from "@/components/pages/invoice/manage/products/Product";
import { useHasNextInvoice } from "./useHasNextInvoice";

interface UseManageDevolutionsProps {
  invoice: DocumentSnapshot<invoiceType> | undefined;
  productDoc: DocumentSnapshot<productDoc>;
  seletedSeller: DocumentSnapshot<SellersDoc> | undefined;
  inventoryOutputs: DocumentSnapshot<outputType>[];
  rawOutputs: rawOutput[]; // Raw outputs from useManageOutputs
  // devoInput: string; // Raw input value from Devolution component - Este prop será gestionado internamente
  customPriceInput: number | undefined; // Raw input value from Price
  humanInteractionDetectedRef: React.MutableRefObject<someHumanChangesDetected>;
}

export function useManageDevolutions({
  invoice,
  productDoc,
  seletedSeller,
  inventoryOutputs,
  rawOutputs,
  // devoInput, // Eliminado ya que ahora se gestiona internamente
  customPriceInput,
  humanInteractionDetectedRef,
}: UseManageDevolutionsProps) {
  const [remainStock, setRemainStock] = useState<rawOutput[]>([]);
  const [verifiedDevolutionAmount, setVerifiedDevolutionAmount] = useState(0);
  const [localDevoInput, setLocalDevoInput] = useState<string>(""); // Nuevo estado para el valor del campo de entrada
  const {
    amount: currentDevolutionServerAmount,
    outputs: currentDevolutionOutputs,
  } = useGetCurrentDevolutionByProduct(productDoc.id);
  const { checkHasNextInvoice } = useHasNextInvoice();
  const lastProcessedDevoAmount = useRef(0); // To track the amount that was last saved/synced

  const currentUid = getAuth(getFirestore().app).currentUser?.uid;

  useEffect(() => {
    console.log("devo in outputs", currentDevolutionOutputs);
  }, [currentDevolutionOutputs]);

  // Effect to sync the verified amount with the server state.
  // This ensures that the initial load and changes from other users are correctly reflected.
  useEffect(() => {
    const serverAmount = currentDevolutionServerAmount || 0;
    // This condition is key. We update our "verified" state from the server
    // ONLY if it's different from what we already have. This handles the initial
    // load (0 -> server value) and changes from other users.
    if (serverAmount !== verifiedDevolutionAmount) {
      setVerifiedDevolutionAmount(serverAmount);
    }
  }, [currentDevolutionServerAmount, verifiedDevolutionAmount]);

  // NUEVO EFECTO: Sincronizar localDevoInput con verifiedDevolutionAmount
  useEffect(() => {
    // Solo actualizar localDevoInput desde el servidor si no se detecta interacción humana.
    // Si humanInteractionDetectedRef.current.devolution es true, significa que el usuario está escribiendo,
    // por lo que dejamos que su entrada controle el localDevoInput.
    if (!humanInteractionDetectedRef.current.devolution) {
      setLocalDevoInput(String(verifiedDevolutionAmount));
    }
  }, [verifiedDevolutionAmount, humanInteractionDetectedRef]);

  // Effect to calculate remainStock based on rawOutputs and currentDevolutionServerAmount
  useEffect(() => {
    const soldStocks = rawOutputs.map(rawOutputToStock);
    const inventoryStocks = inventoryOutputs.map((invDoc) =>
      createStockFromOutputType(invDoc.data() as outputType)
    );
    const combinedStocks = [...soldStocks, ...inventoryStocks];

    const { remainingStocks } = amountListener(
      Number(localDevoInput), // Siempre usar localDevoInput para el cálculo
      combinedStocks,
      undefined,
      productDoc,
      customPriceInput
    );

    if (!isEqual(remainingStocks, remainStock)) {
      setRemainStock(remainingStocks);
    }
  }, [
    rawOutputs,
    localDevoInput, // Usar localDevoInput aquí
    inventoryOutputs,
    productDoc,
    remainStock,
  ]);

  // Effect to trigger save logic when devoInput changes due to human interaction
  useEffect(() => {
    if (!invoice || !seletedSeller || !currentUid) return;

    const amountToSave = Number(localDevoInput); // Usar localDevoInput para guardar

    // Only trigger save if human interaction is detected AND there's an actual change
    console.log(
      `conditional devo: ${
        humanInteractionDetectedRef.current.devolution
          ? "Human detected"
          : "Human NO detected"
      } ${
        amountToSave === currentDevolutionServerAmount
          ? "NO CHANGE"
          : `local (${amountToSave}) and server (${currentDevolutionServerAmount})`
      }`
    );

    if (
      humanInteractionDetectedRef.current.devolution &&
      amountToSave !== (currentDevolutionServerAmount || 0)
    ) {
      console.log("Devolution: Saving changes...");
      // Assuming saveDevolution is now a direct, non-debounced function
      // and accepts a UID.

      checkHasNextInvoice(
        () =>
          saveDevolution(
            invoice,
            productDoc,
            seletedSeller,
            inventoryOutputs,
            rawOutputs, // Pass rawOutputs, saveDevolution should handle parsing
            amountToSave,
            customPriceInput,
            // setRemainStock, // To update UI immediately
            currentUid // Pass the UID
          ),
        true,
        productDoc.id
      );

      lastProcessedDevoAmount.current = amountToSave;
      humanInteractionDetectedRef.current.devolution = false;
      humanInteractionDetectedRef.current.outputsSolds = true;
    }
  }, [
    localDevoInput, // Dependencia
    // customPriceInput,
    invoice,
    productDoc,
    seletedSeller,
    inventoryOutputs,
    rawOutputs,
    currentDevolutionServerAmount,
    currentUid,
    humanInteractionDetectedRef,
    setRemainStock,
  ]);

  return {
    remainStock,
    // currentDevolutionServerAmount: verifiedDevolutionAmount, // Ya no es necesario retornar de esta manera
    localDevoInput, // Retornar el estado local para el campo de entrada
    setLocalDevoInput, // Retornar el setter para el campo de entrada
  };
}

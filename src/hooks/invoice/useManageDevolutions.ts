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
import { getParentStock } from "@/tools/products/getParentStock";
import { stockType } from "@/tools/products/addToStock";

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
  customPriceInput,
  humanInteractionDetectedRef,
}: UseManageDevolutionsProps) {
  const [remainStock, setRemainStock] = useState<rawOutput[]>([]);
  const [verifiedDevolutionAmount, setVerifiedDevolutionAmount] = useState(0);
  const [localDevoInput, setLocalDevoInput] = useState<string>(""); // Nuevo estado para el valor del campo de entrada
  const [runAgainOnBlurEvent, setRunAgainOnBlurEvent] = useState(false);
  const checkOnBlurEventAgain = useRef(false);
  const {
    amount: currentDevolutionServerAmount,
    // outputs: currentDevolutionOutputs,
  } = useGetCurrentDevolutionByProduct(productDoc.id);
  const { checkHasNextInvoice } = useHasNextInvoice();
  const lastProcessedDevoAmount = useRef(0); // To track the amount that was last saved/synced

  const currentUid = getAuth(getFirestore().app).currentUser?.uid;

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
    async function calculateRemainStock() {
      const soldStocks = rawOutputs.map(rawOutputToStock);
      const inventoryStocks = inventoryOutputs.map((invDoc) =>
        createStockFromOutputType(invDoc.data() as outputType)
      );
      const combinedStocks = [...soldStocks, ...inventoryStocks];
      const parsedCombinedStocks = await parseCombinedStocks({
        productDoc,
        combinedStocks,
      });

      const { remainingStocks } = amountListener(
        Number(localDevoInput), // Siempre usar localDevoInput para el cálculo
        parsedCombinedStocks,
        undefined,
        productDoc,
        customPriceInput
      );

      if (!isEqual(remainingStocks, remainStock)) {
        setRemainStock(remainingStocks);
      }
    }

    calculateRemainStock();
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
    if (humanInteractionDetectedRef.current.devolution) {
      console.log(
        "Human detected (devolution) " +
          `local (${amountToSave}) and server (${currentDevolutionServerAmount})`
      );

      if (amountToSave === (currentDevolutionServerAmount || 0)) {
        console.warn(
          "No change detected, may be a react bug, running the onBlur event again"
        );

        // if the ref is false the code will run the onBlur event again
        // to check if the value is correct
        if (!checkOnBlurEventAgain.current) {
          setRunAgainOnBlurEvent(true);
          checkOnBlurEventAgain.current = true;
        } else {
          // if the ref is true turn to false
          // this means that the onBlur event was executed again
          checkOnBlurEventAgain.current = false;
        }
      } else {
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
    }
  }, [
    localDevoInput,
    invoice,
    productDoc,
    seletedSeller,
    inventoryOutputs,
    rawOutputs,
    currentDevolutionServerAmount,
    currentUid,
    humanInteractionDetectedRef,
    setRemainStock,
    checkHasNextInvoice,
    // customPriceInput,
  ]);

  return {
    remainStock,
    // currentDevolutionServerAmount: verifiedDevolutionAmount, // Ya no es necesario retornar de esta manera
    localDevoInput, // Retornar el estado local para el campo de entrada
    setLocalDevoInput, // Retornar el setter para el campo de entrada
    runAgainOnBlurEvent,
    setRunAgainOnBlurEvent,
  };
}

async function parseCombinedStocks({
  productDoc,
  combinedStocks,
}: {
  productDoc: DocumentSnapshot<productDoc>;
  combinedStocks: stockType[];
}) {
  // Add the lasted commision to combinedStocks from the product
  const productData = productDoc.data();
  if (!productData) return combinedStocks;

  const hasParent = productData.product_parent;
  let parent = null;
  if (hasParent) {
    parent = await getParentStock(hasParent);
  }

  let commission = 0;

  if (parent) {
    commission = parent[0]?.seller_commission || 0;
  } else {
    commission =
      productData.last_sales_amounts?.seller_commission ||
      productData.stock[0]?.seller_commission ||
      0;
  }

  if (commission > 0) {
    return combinedStocks.map((stock) => ({
      ...stock,
      seller_commission: commission,
    }));
  } else {
    return combinedStocks;
  }
}

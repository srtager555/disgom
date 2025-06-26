import { useEffect, useState, useRef } from "react";
import { DocumentSnapshot, getFirestore } from "firebase/firestore";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { productDoc } from "@/tools/products/create";
import { SellersDoc } from "@/tools/sellers/create";
import { inventory_output } from "@/tools/sellers/invetory/addProduct";
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

interface UseManageDevolutionsProps {
  invoice: DocumentSnapshot<invoiceType> | undefined;
  productDoc: DocumentSnapshot<productDoc>;
  seletedSeller: DocumentSnapshot<SellersDoc> | undefined;
  inventoryOutputs: DocumentSnapshot<inventory_output>[];
  rawOutputs: rawOutput[]; // Raw outputs from useManageOutputs
  devoInput: string; // Raw input value from Devolution component
  customPriceInput: number | undefined; // Raw input value from Price
  humanInteractionDetectedRef: React.MutableRefObject<someHumanChangesDetected>;
}

export function useManageDevolutions({
  invoice,
  productDoc,
  seletedSeller,
  inventoryOutputs,
  rawOutputs,
  devoInput,
  customPriceInput,
  humanInteractionDetectedRef,
}: UseManageDevolutionsProps) {
  const [remainStock, setRemainStock] = useState<rawOutput[]>([]);
  const {
    amount: currentDevolutionServerAmount,
    outputs: currentDevolutionOutputs,
  } = useGetCurrentDevolutionByProduct(productDoc.id);
  const lastProcessedDevoAmount = useRef(0); // To track the amount that was last saved/synced

  const currentUid = getAuth(getFirestore().app).currentUser?.uid;

  useEffect(() => {
    console.log("devo in outputs", currentDevolutionOutputs);
  }, [currentDevolutionOutputs]);

  // Effect to calculate remainStock based on rawOutputs and currentDevolutionServerAmount
  useEffect(() => {
    const soldStocks = rawOutputs.map(rawOutputToStock);
    const inventoryStocks = inventoryOutputs.map((invDoc) =>
      createStockFromOutputType(invDoc.data() as outputType)
    );
    const combinedStocks = [...soldStocks, ...inventoryStocks];

    const { remainingStocks } = amountListener(
      currentDevolutionServerAmount || 0, // Use the server amount for calculation
      combinedStocks,
      undefined,
      productDoc,
      undefined
    );

    if (!isEqual(remainingStocks, remainStock)) {
      setRemainStock(remainingStocks);
    }
  }, [
    rawOutputs,
    currentDevolutionServerAmount,
    inventoryOutputs,
    productDoc,
    remainStock,
  ]);

  // Effect to trigger save logic when devoInput changes due to human interaction
  useEffect(() => {
    if (!invoice || !seletedSeller || !currentUid) return;

    const amountToSave = Number(devoInput);

    // Only trigger save if human interaction is detected AND there's an actual change
    console.log("conditional devo");
    console.log(
      "is a human interaction?",
      humanInteractionDetectedRef.current.devolution
    );
    console.log(
      "the amount has been changed? local, server",
      amountToSave,
      currentDevolutionServerAmount
    );

    if (
      humanInteractionDetectedRef.current.devolution &&
      amountToSave !== (currentDevolutionServerAmount || 0)
    ) {
      console.log("Devolution: Saving changes...");
      // Assuming saveDevolution is now a direct, non-debounced function
      // and accepts a UID.
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
      );

      lastProcessedDevoAmount.current = amountToSave;
      humanInteractionDetectedRef.current.devolution = false;
    }
  }, [
    devoInput,
    customPriceInput,
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
    currentDevolutionServerAmount: currentDevolutionServerAmount || 0,
  };
}

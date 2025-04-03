import {
  Dispatch,
  memo,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Column, Input } from "../../Product";
import { useDebounce } from "@/hooks/debounce";
import {
  collection,
  DocumentSnapshot,
  getDocs,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { useGetCurrentDevolutionByProduct } from "@/hooks/invoice/getCurrentDevolution";
import { outputType } from "@/tools/products/addOutputs";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";
import {
  amountListener,
  createStockFromOutputType,
} from "@/tools/products/ManageSaves";
import { rawOutput } from "./AddOutput";
import { SellersDoc } from "@/tools/sellers/create";
import { isEqual } from "lodash";
import { createInventory } from "@/tools/sellers/invetory/create";
import {
  addInventoryProduct,
  inventory_output,
} from "@/tools/sellers/invetory/addProduct";
import { useGetInvoiceByQueryOnSnapshot } from "@/hooks/invoice/getInvoiceByQueryOnSnapshot";
import { invoiceType } from "@/tools/invoices/createInvoice";

type devolutionBase = {
  outputs: DocumentSnapshot<outputType>[];
  productDoc: DocumentSnapshot<productDoc>;
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>;
  setDevolutionAmount: Dispatch<SetStateAction<number>>;
  humanAmountChanged: boolean;
  setHumanAmountChanged: Dispatch<SetStateAction<boolean>>;
  // totalOutputs: DocumentSnapshot<outputType>[];
  customPrice: number | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  sellerHasInventory: boolean | undefined;
  currentDevolution: number;
};

export const Devolution = (
  props: Omit<devolutionBase, "currentDevolution" | "outputs" | "invoiceDoc">
) => {
  const currentInventory = useGetCurrentDevolutionByProduct(
    props.productDoc.id
  );
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const invoiceDoc = useGetInvoiceByQueryOnSnapshot();
  const currentDevolution = useMemo(
    () =>
      currentInventory.outputs?.reduce(
        (acc, next) => acc + next.data().amount,
        0
      ) || 0,
    [currentInventory]
  );

  return (
    <DevolutionMemo
      {...props}
      outputs={outputs}
      invoiceDoc={invoiceDoc}
      currentDevolution={currentDevolution}
      //  totalOutputs={totalOutputs}
    />
  );
};

const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  // if (prev.setDevolutionAmount !== next.setDevolutionAmount) return false;
  // if (prev.setHumanAmountChanged !== next.setHumanAmountChanged) return false;
  // if (!isEqual(prev.totalOutputs, next.totalOutputs)) return false;
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.currentDevolution !== next.currentDevolution) return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (prev.humanAmountChanged !== next.humanAmountChanged) return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (!isEqual(prev.invoiceDoc, next.invoiceDoc)) return false;

  return true;
});

function DevolutionBase({
  outputs,
  productDoc,
  invoiceDoc,
  customPrice,
  setDevolutionAmount,
  setRemainStock,
  humanAmountChanged,
  setHumanAmountChanged,
  // totalOutputs,
  seletedSeller,
  sellerHasInventory,
  currentDevolution,
}: devolutionBase) {
  const [devo, setDevo] = useState(0);
  const devoDebounce = useDebounce(devo);
  const inventory_outputs = [] as DocumentSnapshot<outputType>[];

  // effect to set the debouce to the devo
  useEffect(() => {
    setDevolutionAmount(devoDebounce as number);
    console.log("devo debounce setted", devoDebounce);
  }, [devoDebounce, setDevolutionAmount]);

  useEffect(() => {
    if (devoDebounce != currentDevolution) setDevo(currentDevolution);
    console.log(
      "current devo and devo debounce",
      currentDevolution,
      devoDebounce
    );
  }, [currentDevolution]);

  // effect to save the devolution
  useEffect(() => {
    async function saveDevo() {
      console.log("starting to save the devo");
      if (!invoiceDoc)
        return console.log("invoice doc is not ready, operation canceled");
      if (!productDoc)
        return console.log("product doc is not ready, operation canceled");
      if (!seletedSeller)
        return console.log("seller doc is not ready, operation canceled");

      const allOutputs = [...inventory_outputs, ...[...outputs].reverse()];
      const stock = allOutputs.map((el) =>
        createStockFromOutputType(el.data() as outputType)
      );

      console.log(
        "starting to calculate the devolution",
        devoDebounce,
        allOutputs,
        stock
      );
      const outputsWorked = amountListener(
        devoDebounce as number,
        stock,
        productDoc as QueryDocumentSnapshot<productDoc>,
        customPrice
      );
      console.log("outputs worked in devo", outputsWorked);

      // save sold product
      console.log("setting the total sold", outputsWorked.remainingStocks);
      setRemainStock(outputsWorked.remainingStocks);

      // check if a human make the changes
      if (!humanAmountChanged) {
        console.log("Human change not detected, saving cancelated");
        return;
      }
      // check if the current devo is the same in the input
      console.log("is equal current devo?", {
        devoDebounce,
        currentDevolution,
      });
      if (devoDebounce === currentDevolution) return;
      console.log("saving devo");
      console.log("ramain stock (product sold)", outputsWorked.remainingStocks);

      let inventoryRef = invoiceDoc.data()?.devolution;
      if (!inventoryRef) {
        inventoryRef = await createInventory(
          invoiceDoc.ref,
          seletedSeller?.ref
        );
      }

      const q = query(
        collection(inventoryRef, "products"),
        where("product_ref", "==", productDoc.ref)
      );

      const oldDevo = await getDocs(q);
      if (oldDevo.size > 0) {
        console.log("disable old devolution");

        oldDevo.forEach(async (el) => {
          await updateDoc(el.ref, {
            disabled: true,
          });
        });
      }

      const newInventory = outputsWorked.outputsToCreate.map(
        async (el) =>
          await addInventoryProduct(inventoryRef, {
            ...el,
            inventory_ref: inventoryRef,
            disabled: false,
          } as inventory_output)
      );

      console.log("the new inventory (the current devo)", newInventory);

      await Promise.all(newInventory);

      await updateDoc(invoiceDoc.ref, {
        devolution: inventoryRef,
      });
    }

    saveDevo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    outputs,
    // inventory_outputs,
    // humanAmountChanged,
    invoiceDoc,
    productDoc,
    devoDebounce,
    customPrice,
    seletedSeller,
    // setRemainStock,
    // currentDevolution,
  ]);

  // useEffect(() => {
  //   const outputsParsedToStockType = totalOutputs.map((output) => {
  //     const data = output.data() as outputType;

  //     const parsed = createStockFromOutputType(data);
  //     return parsed;
  //   });
  // }, []);

  if (sellerHasInventory) {
    return (
      <Column>
        <Input
          value={devo}
          onChange={(e) => {
            setDevo(Number(e.target.value));
            setHumanAmountChanged(true);
          }}
          type="number"
        />
      </Column>
    );
  }
}

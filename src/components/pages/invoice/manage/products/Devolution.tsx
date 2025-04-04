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
import { useInvoice } from "@/contexts/InvoiceContext";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { someHumanChangesDetected } from "./Product";

type devolutionBase = {
  outputs: DocumentSnapshot<outputType>[];
  productDoc: DocumentSnapshot<productDoc>;
  invoiceDoc: DocumentSnapshot<invoiceType> | undefined;
  setRemainStock: Dispatch<SetStateAction<rawOutput[]>>;
  setDevolutionAmount: Dispatch<SetStateAction<number>>;
  customPrice: number | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  sellerHasInventory: boolean | undefined;
  currentDevolution: number;
  setSomeHumanChangeDetected: Dispatch<
    SetStateAction<someHumanChangesDetected>
  >;
};

export const Devolution = (
  props: Omit<devolutionBase, "currentDevolution" | "outputs" | "invoiceDoc">
) => {
  const currentInventory = useGetCurrentDevolutionByProduct(
    props.productDoc.id
  );
  const outputs = useGetProductOutputByID(props.productDoc.id);
  const { invoice: invoiceDoc } = useInvoice();
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
    />
  );
};

const DevolutionMemo = memo(DevolutionBase, (prev, next) => {
  if (prev.productDoc.id !== next.productDoc.id) return false;
  if (prev.sellerHasInventory !== next.sellerHasInventory) return false;
  if (prev.currentDevolution !== next.currentDevolution) return false;
  if (!isEqual(prev.outputs, next.outputs)) return false;
  if (!isEqual(prev.invoiceDoc, next.invoiceDoc)) return false;
  if (!isEqual(prev.customPrice, next.customPrice)) return false;
  if (!isEqual(prev.seletedSeller, next.seletedSeller)) return false;
  if (!isEqual(prev.sellerHasInventory, next.sellerHasInventory)) return false;
  if (!isEqual(prev.currentDevolution, next.currentDevolution)) return false;

  return true;
});

function DevolutionBase({
  outputs,
  productDoc,
  invoiceDoc,
  customPrice,
  setDevolutionAmount,
  setRemainStock,
  seletedSeller,
  sellerHasInventory,
  currentDevolution,
  setSomeHumanChangeDetected,
}: devolutionBase) {
  const [devo, setDevo] = useState(0);
  const [humanAmountChanged, setHumanAmountChanged] = useState(false);
  const [lastCustomPrice, setLastCustomPrice] = useState(customPrice);
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

  // effect to detect custom price changes
  useEffect(() => {
    if (customPrice === lastCustomPrice) return;
    setHumanAmountChanged(true);
    setLastCustomPrice(customPrice);
  }, [customPrice, lastCustomPrice]);

  // effect to save the devolution
  useEffect(() => {
    async function saveDevo() {
      if (!invoiceDoc) return;
      if (!productDoc) return;
      if (!seletedSeller) return;

      const allOutputs = [...inventory_outputs, ...[...outputs].reverse()];
      const stock = allOutputs.map((el) =>
        createStockFromOutputType(el.data() as outputType)
      );

      const outputsWorked = amountListener(
        devoDebounce as number,
        stock,
        productDoc as QueryDocumentSnapshot<productDoc>,
        customPrice
      );

      // save sold product
      setRemainStock(outputsWorked.remainingStocks);

      // check if a human make the changes
      if (!humanAmountChanged) {
        console.log("Human change not detected, saving cancelated");
        return;
      }
      setHumanAmountChanged(false);

      // check if the current devo is the same in the input
      if (devoDebounce === currentDevolution) return;

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

      await Promise.all(newInventory);

      await updateDoc(invoiceDoc.ref, {
        devolution: inventoryRef,
      });

      console.log("devo saved");
    }

    saveDevo();
  }, [
    outputs,
    humanAmountChanged,
    invoiceDoc,
    productDoc,
    devoDebounce,
    customPrice,
    seletedSeller,
    currentDevolution,
    inventory_outputs,
    setRemainStock,
  ]);

  if (sellerHasInventory) {
    return (
      <Column>
        <Input
          value={devo}
          onChange={(e) => {
            setDevo(Number(e.target.value));
            setHumanAmountChanged(true);
            setSomeHumanChangeDetected((prev) => ({
              ...prev,
              devolution: true,
            }));
          }}
          type="number"
        />
      </Column>
    );
  }
}

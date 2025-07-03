import { numberParser } from "@/tools/numberPaser";
import { Column } from "../../Product";
import {
  Dispatch,
  memo,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useEffect,
} from "react";
import { addOutputs, outputType } from "@/tools/products/addOutputs";
import {
  collection,
  CollectionReference,
  DocumentSnapshot,
  getDocs,
  query,
  QueryDocumentSnapshot,
  updateDoc,
  where,
} from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { debounce, isEqual, isPlainObject } from "lodash";
import { SellersDoc } from "@/tools/sellers/create";
import { rawOutput } from "./AddOutput";
import { someHumanChangesDetected } from "./Product";
import { productResult } from "@/components/pages/invoice/ProductList";
import { useInvoice } from "@/contexts/InvoiceContext";
import { getAuth } from "firebase/auth";
import { checkInventoryInOutputsSold } from "@/tools/invoices/checkInventoryInOutputsSold";

type props = {
  product_doc: QueryDocumentSnapshot<productDoc>;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
  remainStock: rawOutput[];
  remainStockTotals: productResult;
  setWarn: Dispatch<SetStateAction<boolean>>;
  sellerHasInventory: boolean | undefined;
  seletedSeller: QueryDocumentSnapshot<SellersDoc> | undefined;
  invOutputs: DocumentSnapshot<outputType>[];
  amount: number;
  devoAmount: number;
};

export const ProductSold = (props: Omit<props, "outputs">) => {
  return <MemoProductSold {...props} />;
};

export const MemoProductSold = memo(ProductSoldBase, (prev, next) => {
  if (prev.sellerHasInventory != next.sellerHasInventory) return false;
  if (!isEqual(prev.product_doc.id, next.product_doc.id)) return false;
  if (!isEqual(prev.remainStock, next.remainStock)) return false;
  if (!isEqual(prev.remainStockTotals, next.remainStockTotals)) return false;
  if (!isEqual(prev.invOutputs, next.invOutputs)) return false;

  return true;
});

export function ProductSoldBase({
  invOutputs,
  remainStock,
  product_doc,
  remainStockTotals,
  setWarn,
  sellerHasInventory,
  someHumanChangesDetected,
  amount,
  devoAmount,
}: props) {
  const { invoice } = useInvoice();

  useEffect(() => {
    setWarn(remainStockTotals.amount < 0);
  }, [remainStockTotals.amount, setWarn]);

  const debouncedSave = useCallback(
    debounce(async (currentRemainStock: rawOutput[]) => {
      if (!invoice) {
        console.log("no invoice in product sold");
        return;
      }

      let refresh_data;
      if (isPlainObject(invoice?.data()?.refresh_data))
        refresh_data = invoice?.data()?.refresh_data as Record<string, boolean>;
      else refresh_data = {};

      try {
        const onlyInvSetted = !amount && !devoAmount && invOutputs.length > 0;
        let invIsAlreadySavedAsSold = false;

        if (onlyInvSetted) {
          invIsAlreadySavedAsSold = await checkInventoryInOutputsSold(
            invoice,
            invOutputs,
            product_doc.ref
          );
        }

        // --- Lógica de Decisión de Guardado Refactorizada ---
        const hasHumanChanges = someHumanChangesDetected.current.outputsSolds;
        const needsForceRefresh = refresh_data[product_doc.id] === false;
        // Venta implícita: Solo hay inventario seteado y este aún NO ha sido guardado como vendido.
        const isImplicitSale = onlyInvSetted && !invIsAlreadySavedAsSold;

        // Si no hay cambios humanos, ni se necesita forzar refresco, ni es una venta implícita, entonces no guardamos.
        if (!hasHumanChanges && !needsForceRefresh && !isImplicitSale) {
          console.log(
            "No changes detected (human, refresh, or implicit), skipping save outputs solds"
          );
          return;
        }

        console.log("######## saving outputs solds ########");

        const coll = collection(
          invoice.ref,
          "outputs_sold"
        ) as CollectionReference<outputType>;

        // disable the current outputs sold from the product
        const q = query(
          coll,
          where("disabled", "==", false),
          where("product_ref", "==", product_doc.ref)
        );
        const old_outputs_sold = await getDocs(q);

        if (old_outputs_sold.size > 0) {
          old_outputs_sold.forEach(async (doc) => {
            await updateDoc(doc.ref, {
              disabled: true,
            });
          });
        }

        // outputs totalSold
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        await addOutputs({
          invoice,
          product_doc,
          rawOutputs: currentRemainStock,
          outputColl: coll,
          uid: currentUser.uid,
        });

        console.log("######## outputs solds saved ########");
      } catch (error) {
        console.error(
          "######## An error has been ejected saving the outputs solds ########"
        );
        console.error(error);
      } finally {
        if (
          typeof refresh_data[product_doc.id] === "boolean" &&
          refresh_data[product_doc.id] === false
        )
          // update the refresh data
          await updateDoc(invoice.ref, {
            [`refresh_data.${product_doc.id}`]: true,
          });

        someHumanChangesDetected.current.outputsSolds = false;
      }
    }, 1500), // Debounce de 1.5 segundos
    [invoice, product_doc.id, someHumanChangesDetected]
  );

  useEffect(() => {
    debouncedSave(remainStock);

    return () => {
      debouncedSave.cancel();
    };
  }, [remainStock, debouncedSave]);

  if (sellerHasInventory)
    return (
      <Column $textAlign="center">
        {numberParser(remainStockTotals.amount)}
      </Column>
    );
}

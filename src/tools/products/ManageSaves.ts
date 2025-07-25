import {
  Timestamp,
  DocumentSnapshot,
  DocumentReference,
} from "firebase/firestore";
import { addOutputs, outputType } from "./addOutputs";
import { productDoc } from "./create";
import { stockType } from "./addToStock";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { invoiceType } from "../invoices/createInvoice";
import { defaultCustomPrice } from "../sellers/customPrice/createDefaultCustomPrice";

export function createStockFromOutputType(output: outputType): stockType {
  return {
    created_at: output.created_at,
    amount: output.amount,
    product_ref: output.product_ref,
    entry_ref: output.entry_ref,
    purchase_price: output.purchase_price,
    sale_price: output.sale_price,
    seller_commission: output.commission,
  };
}

export const amountListener = function (
  n: number,
  stocksRoot: Array<stockType>,
  defaultCustomPrice:
    | DocumentSnapshot<defaultCustomPrice>
    | undefined = undefined,
  productDoc: DocumentSnapshot<productDoc>,
  customPrice?: number
): { outputsToCreate: Array<rawOutput>; remainingStocks: Array<rawOutput> } {
  let remainingAmount = n;
  const outputsToCreate: Array<rawOutput> = [];
  let remainingStocks: Array<rawOutput> = [];
  const stocks = [...stocksRoot].sort(
    (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
  );
  const mostRecentStockPrice = stocks[0]?.sale_price;
  const priceToUse =
    customPrice || defaultCustomPrice?.data()?.price || mostRecentStockPrice;

  if (remainingAmount < 0) return { outputsToCreate, remainingStocks };
  if (stocks.length === 0) return { outputsToCreate, remainingStocks };

  for (let index = 0; index < stocks.length; index++) {
    const stock = stocks[index];
    const remaining = remainingAmount - stock.amount;

    if (remaining > 0) {
      remainingAmount = remaining;
      outputsToCreate.push({
        amount: stock.amount,
        product_ref: productDoc.ref,
        entry_ref: stock.entry_ref,
        sale_price: priceToUse,
        default_custom_price_ref: defaultCustomPrice?.ref || null,
        purchase_price: stock.purchase_price,
        commission: stock.seller_commission,
      });
    } else {
      // Si no necesitamos todo el stock actual
      if (remainingAmount > 0) {
        outputsToCreate.push({
          amount: remainingAmount,
          product_ref: productDoc.ref,
          entry_ref: stock.entry_ref,
          sale_price: priceToUse,
          default_custom_price_ref: defaultCustomPrice?.ref || null,
          purchase_price: stock.purchase_price,
          commission: stock.seller_commission,
        });

        // Agregamos el stock restante del lote actual
        const remainingStockAmount = stock.amount - remainingAmount;
        if (remainingStockAmount > 0) {
          remainingStocks.push({
            amount: remainingStockAmount,
            product_ref: productDoc.ref,
            entry_ref: stock.entry_ref,
            sale_price: stock.sale_price,
            default_custom_price_ref: null,
            purchase_price: stock.purchase_price,
            commission: stock.seller_commission,
          });
        }
      } else {
        // Si no necesitamos nada del stock actual, lo agregamos completo a remainingStocks
        remainingStocks.push(stockToRawOutput(stock));
      }

      // Agregamos los stocks restantes, filtrando los que tengan cantidad 0
      remainingStocks = [
        ...remainingStocks,
        ...stocks
          .slice(index + 1)
          .map((e) => stockToRawOutput(e, defaultCustomPrice?.ref || null))
          .filter((stock) => stock.amount > 0),
      ];
      break;
    }
  }

  return { outputsToCreate, remainingStocks };
};

function stockToRawOutput(
  stock: stockType,
  default_custom_price_ref: DocumentReference<defaultCustomPrice> | null = null
): rawOutput {
  return {
    amount: stock.amount,
    product_ref: stock.product_ref,
    entry_ref: stock.entry_ref,
    sale_price: stock.sale_price,
    purchase_price: stock.purchase_price,
    commission: stock.seller_commission,
    default_custom_price_ref,
  };
}

export async function saveNewOutputs(
  invoice: DocumentSnapshot<invoiceType>,
  productDoc: DocumentSnapshot<productDoc>,
  outputs: Array<rawOutput>,
  uid: string
) {
  await addOutputs({
    invoice,
    product_doc: productDoc,
    rawOutputs: outputs,
    uid,
  });
}

export function rawOutputToStock(output: rawOutput): stockType {
  return {
    created_at: Timestamp.now(),
    amount: output.amount,
    product_ref: output.product_ref,
    entry_ref: output.entry_ref,
    purchase_price: output.purchase_price,
    sale_price: output.sale_price,
    seller_commission: output.commission,
  };
}

// type props = {
//   productDoc: QueryDocumentSnapshot<productDoc>;
//   customPrice: number | undefined;
//   stocks: Array<stockType>;
//   outputs_amount_added: number | undefined;
// };

// export async function ManageProductOutputsSaves({
//   productDoc,
//   customPrice,
//   stocks,
//   outputs_amount_added,
// }: props) {
//   const invoice = await getInvoiceByQuery();

//   if (
//     !invoice ||
//     typeof outputs_amount_added != "number" ||
//     Number.isNaN(outputs_amount_added)
//   )
//     return;

//   const outputs = await getProductOutputsByID(productDoc.id);
//   const lastPrice = outputs?.outputs[0]?.data()?.sale_price;

//   if (outputs?.totalAmount === outputs_amount_added) {
//     console.log("same amount, checking prices");
//     if (!customPrice) {
//       return console.log("customPrice not provided");
//     } else if (customPrice === lastPrice) {
//       return console.log(
//         "custom price is equal to the current price, saving cancelled",
//         customPrice,
//         lastPrice
//       );
//     }
//     console.log("custom price is not equal", customPrice, lastPrice);
//   }

//   const outputsToCreate = amountListener(
//     outputs_amount_added,
//     stocks,
//     undefined,
//     productDoc,
//     customPrice
//   );

//   console.log("outputs to create", outputsToCreate);
//   console.log("remaining stocks", outputsToCreate.remainingStocks);

//   await updateDoc(productDoc.ref, {
//     stock: outputsToCreate.remainingStocks.map(rawOutputToStock),
//   });

//   await addOutputs(invoice, productDoc, outputsToCreate.outputsToCreate);
//   console.log("------- outputs saved");
// }

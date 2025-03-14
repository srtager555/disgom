import { QueryDocumentSnapshot } from "firebase/firestore";
import { addOutputs, outputType } from "./addOutputs";
import { productDoc } from "./create";
import { stockType } from "./addToStock";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";
import { getInvoiceByQuery } from "../invoices/getInvoiceByQuery";
import { getProductOutputsByID } from "./getOutputs";

type props = {
  productDoc: QueryDocumentSnapshot<productDoc>;
  customPrice: number | undefined;
  stocks: Array<stockType>;
  outputs_amount_added: number | undefined;
};

export async function ManageProductOutputsSaves({
  productDoc,
  customPrice,
  stocks,
  outputs_amount_added,
}: props) {
  const invoice = await getInvoiceByQuery();

  console.log(outputs_amount_added);

  if (
    !invoice ||
    typeof outputs_amount_added != "number" ||
    Number.isNaN(outputs_amount_added)
  )
    return;

  const outputs = await getProductOutputsByID(productDoc.id);
  const lastPrice = outputs?.outputs[0]?.data()?.sale_price;

  console.log("total amount", outputs?.totalAmount, outputs_amount_added);
  console.log("prices", customPrice, lastPrice);

  if (outputs?.totalAmount === outputs_amount_added) {
    if (!customPrice || customPrice === lastPrice) return;
  }

  const outputsToCreate = amountListener(
    outputs_amount_added,
    stocks,
    productDoc,
    customPrice
  );

  console.log(outputsToCreate);

  addOutputs(invoice, productDoc, outputsToCreate);
}

export const amountListener = function (
  n: number,
  stocks: Array<stockType>,
  productDoc: QueryDocumentSnapshot<productDoc>,
  customPrice?: number
): Array<rawOutput> {
  let remainingAmount = n;
  const outputsToCreate: Array<rawOutput> = [];

  if (remainingAmount <= 0) return outputsToCreate;
  if (!stocks) return outputsToCreate;

  for (let index = 0; index < stocks.length; index++) {
    const stock = stocks[index];

    const remaining = remainingAmount - stock.amount;

    if (remaining > 0) {
      remainingAmount = remaining;
      outputsToCreate.push({
        amount: stock.amount,
        product_ref: productDoc.ref,
        entry_ref: stock.entry_ref,
        sale_price: customPrice || stock.sale_price,
        purchase_price: stock.purchase_price,
        commission: stock.seller_commission,
      });
    } else {
      outputsToCreate.push({
        amount: remainingAmount,
        product_ref: productDoc.ref,
        entry_ref: stock.entry_ref,
        sale_price: customPrice || stock.sale_price,
        purchase_price: stock.purchase_price,
        commission: stock.seller_commission,
      });

      break;
    }
  }

  return outputsToCreate;
};

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

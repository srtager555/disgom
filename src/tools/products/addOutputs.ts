import { productResult } from "@/components/pages/invoice/ProductList";
import {
  addDoc,
  arrayUnion,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { productDoc } from "./create";
import { entryDoc } from "./addEntry";
import { invoiceType } from "../invoices/createInvoice";
import { updateStock } from "./updateStock";
import { rawOutput } from "@/components/pages/invoice/manage/products/AddOutput";

export type outputType = {
  created_at: Timestamp;
  amount: number;
  purchase_price: number;
  purchase_value: number;
  sale_price: number;
  sale_value: number;
  commission: number;
  commission_value: number;
  entry_ref: DocumentReference<entryDoc>;
  invoice_ref: DocumentReference<invoiceType>;
  product_ref: DocumentReference<productDoc>;
  disabled: boolean;
};

export async function a(
  invoice_ref: DocumentReference<invoiceType>,
  product_id: string,
  productOutputData: productResult
) {
  const db = Firestore();
  const productRef = doc(
    db,
    ProductsCollection.root,
    product_id
  ) as DocumentReference<productDoc>;
  const outputColl = collection(
    productRef,
    ProductsCollection.output
  ) as CollectionReference<outputType>;

  const productSnap = await getDoc(productRef);
  const { stock: stocky } = productSnap.data() as productDoc;
  const stocks = stocky && [...stocky];

  productOutputData.sold.variations.forEach(async (element, index) => {
    let remainingAmount = element.amount;
    if (remainingAmount <= 0) return;
    // const finalData = [];

    const data = (
      amount: number,
      cost_price: number,
      entry_ref: DocumentReference<entryDoc>
    ) => {
      const purchase_cost = amount * cost_price;
      const normal_price = element.price;
      const seller_price =
        productOutputData.seller_sold.variations[index].price;
      const normal_sale_value = normal_price * amount;
      const seller_sale_value = seller_price * amount;

      return {
        created_at: Timestamp.fromDate(new Date()),
        amount,
        cost_price,
        purchase_cost,
        sale_prices: {
          normal: normal_price,
          seller: seller_price,
        },
        sales_values: {
          normal: normal_sale_value,
          seller: seller_sale_value,
        },
        profit: {
          normal: normal_sale_value - purchase_cost,
          seller: seller_sale_value - normal_sale_value,
        },
        entry_ref,
        invoice_ref,
        disabled: false,
      };
    };

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];

      const remaining = remainingAmount - stock.amount;

      if (remaining > 0) {
        remainingAmount = remaining;

        const outputRef = await addDoc(
          outputColl,
          data(stock.amount, stock.purchase_price, stock.entry_ref)
        );

        await updateStock(productRef, stock, undefined);

        await updateDoc(invoice_ref, {
          products_outputs: arrayUnion(outputRef),
        });
      } else {
        const outputRef = await addDoc(
          outputColl,
          data(remainingAmount, stock.purchase_price, stock.entry_ref)
        );

        await updateStock(productRef, stock, {
          ...stock,
          amount: stock.amount - remainingAmount,
        });

        await updateDoc(invoice_ref, {
          products_outputs: arrayUnion(outputRef),
        });

        break;
      }
    }
  });
}

export async function addOutputs(
  invoice_ref: DocumentReference<invoiceType>,
  product_ref: DocumentReference<productDoc>,
  rawOutputs: rawOutput[]
) {
  const outputColl = collection(
    product_ref,
    ProductsCollection.output
  ) as CollectionReference<outputType>;

  const outputParser = (rawOutput: rawOutput): outputType => {
    const purchase_value = rawOutput.amount * rawOutput.purchase_price;
    const sale_value = rawOutput.amount * rawOutput.sale_price;
    const commission_value = rawOutput.amount * rawOutput.commission;

    return {
      created_at: Timestamp.fromDate(new Date()),
      amount: rawOutput.amount,
      purchase_price: rawOutput.purchase_price,
      purchase_value,
      sale_price: rawOutput.sale_price,
      sale_value,
      commission: rawOutput.commission,
      commission_value,
      entry_ref: rawOutput.entry_ref,
      invoice_ref,
      product_ref,
      disabled: false,
    };
  };

  const outputsReady = rawOutputs.map((el) => {
    return outputParser(el);
  });

  const outputsRefsPromise = outputsReady.map(async (el) => {
    return await addDoc(outputColl, el);
  });

  const outputsRefs = await Promise.all(outputsRefsPromise);
  const outputs_id = "products_outputs." + product_ref.id;

  await updateDoc(invoice_ref, {
    [outputs_id]: outputsRefs,
  });
}
// const amountListener =
//     function (n: number) {
//       let remainingAmount = n;

//       setCostRequestData([]);
//       if (remainingAmount <= 0) return;
//       if (!stocks) return;

//       for (let index = 0; index < stocks.length; index++) {
//         const stock = stocks[index];

//         const remaining = remainingAmount - stock.amount;

//         if (remaining > 0) {
//           remainingAmount = remaining;
//           setCostRequestData((props) => [
//             ...props,
//             { amount: stock.amount, stockPosition: index },
//           ]);
//         } else {
//           setCostRequestData((props) => [
//             ...props,
//             { amount: remainingAmount, stockPosition: index },
//           ]);
//           break;
//         }
//       }
//     }

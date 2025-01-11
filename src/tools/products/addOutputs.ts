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

export type outputType = {
  created_at: Timestamp;
  amount: number;
  cost_price: number;
  purchase_cost: number;
  sale_prices: {
    normal: number;
    seller: number;
  };
  sales_values: {
    normal: number;
    seller: number;
  };
  entry_ref: DocumentReference<entryDoc>;
  invoice_ref: DocumentReference<invoiceType> | null;
  disabled: boolean;
};

export async function addOutputs(
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

        await updateDoc(invoice_ref, {
          products_outputs: arrayUnion(outputRef),
        });
      } else {
        const outputRef = await addDoc(
          outputColl,
          data(remainingAmount, stock.purchase_price, stock.entry_ref)
        );

        await updateDoc(invoice_ref, {
          products_outputs: arrayUnion(outputRef),
        });

        break;
      }
    }
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

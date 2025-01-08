import { productResult } from "@/components/pages/invoice/ProductList";
import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  getDoc,
} from "firebase/firestore";
import { Firestore } from "../firestore";
import { ProductsCollection } from "../firestore/CollectionTyping";
import { productDoc } from "./create";
import { entryDoc } from "./addEntry";

export async function addOutputs(
  product_id: string,
  productOutputData: productResult
) {
  const db = Firestore();
  const productRef = doc(
    db,
    ProductsCollection.root,
    product_id
  ) as DocumentReference<productDoc>;
  const outputColl = collection(productRef, ProductsCollection.output);

  const productSnap = await getDoc(productRef);
  const { stock: stocky } = productSnap.data() as productDoc;
  const stocks = stocky && [...stocky];

  productOutputData.sold.variations.forEach(async (element, index) => {
    let remainingAmount = element.amount;
    if (remainingAmount <= 0) return;
    let finalData;

    const data = (amount: number, entry_ref: DocumentReference<entryDoc>) => ({
      created_at: new Date(),
      amount,
      cost_price: productOutputData.cost,
      sale_prices: {
        normal: element.amount,
        seller: productOutputData.seller_sold.variations[index].price,
      },
      entry_ref,
      invoice_ref: null,
      disabled: false,
    });

    for (let index = 0; index < stocks.length; index++) {
      const stock = stocks[index];

      const remaining = remainingAmount - stock.amount;

      if (remaining > 0) {
        remainingAmount = remaining;

        finalData = data(stock.amount, stock.entry_ref);
        console.log(finalData);
      } else {
        finalData = data(remainingAmount, stock.entry_ref);
        console.log(finalData);

        break;
      }
    }

    return;
    await addDoc(outputColl, finalData);
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

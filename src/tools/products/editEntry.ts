import {
  arrayRemove,
  arrayUnion,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  updateDoc,
} from "firebase/firestore";
import { productDoc } from "./create";
import { stockProps, stockType } from "./addToStock";
import { entryDoc } from "./addEntry";
import { removeEntry } from "./removeEntry";

export async function EditEntry(
  product_ref: DocumentReference<productDoc>,
  currentStockData: stockType,
  newStockData: Omit<stockType, "created_at" | "entry_ref">,
  withParent: boolean = false
) {
  const diff = newStockData.amount - currentStockData.amount;
  const newStockamount = currentStockData.amount + diff;

  const newStockToReplace: stockProps & { created_at: Date } = {
    ...newStockData,
    created_at: currentStockData.created_at.toDate(),
    entry_ref: currentStockData.entry_ref,
    amount: newStockamount,
  };

  // udpate the entry
  await updateDoc(currentStockData.entry_ref, {
    amount: newStockData.amount,
  });

  if (withParent || currentStockData.amount > 0)
    // remove the outdated stock
    await updateDoc(product_ref, {
      stock: arrayRemove(currentStockData),
    });

  // add the new stock
  await updateDoc(product_ref, {
    stock: arrayUnion(newStockToReplace),
  });
}

export async function EditEntryFromManageEntryAndOutputs(
  amount: number,
  product: DocumentSnapshot<productDoc>,
  entry: QueryDocumentSnapshot<entryDoc>
) {
  const stock = product.data()?.stock as stockType[];
  const currentStock = stock.filter((el) => el.entry_ref.id === entry.id);
  const entryData = entry.data();
  const diff = amount - entryData.amount;
  const newAmount = entryData.amount + diff;

  if (amount === 0) {
    removeEntry(currentStock[0], product.ref, false);

    return;
  }
  if (diff === 0) return;

  // check if the entry has stock yet
  if (currentStock.length > 0) {
    const stockUpdated = {
      ...currentStock[0],
      amount: currentStock[0].amount + diff,
    };

    // remove the outdated stock
    await updateDoc(product.ref, {
      stock: arrayRemove(currentStock[0]),
    });

    // add the new stock
    await updateDoc(product.ref, {
      stock: arrayUnion(stockUpdated),
    });
  } /* the entry havent stock  */ else {
    // the product has stock
    if (stock.length > 0) {
      const stockUpdated = { ...stock[0], amount: stock[0].amount + diff };

      // remove the outdated stock
      await updateDoc(product.ref, {
        stock: arrayRemove(stock[0]),
      });

      // add the new stock
      await updateDoc(product.ref, {
        stock: arrayUnion(stockUpdated),
      });
    } /* the product havent stock */ else {
      const newStock: stockType = {
        ...entryData,
        amount: diff, // diff is a positive number here
        entry_ref: entry.ref,
        product_ref: product.ref,
      };

      // add the new stock
      await updateDoc(product.ref, {
        stock: arrayUnion(newStock),
      });
    }
  }

  // update the entry
  await updateDoc(entry.ref, {
    amount: newAmount,
  });
}

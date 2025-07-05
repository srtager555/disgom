import { useEffect, useState } from "react";
import { useGetAllSellers } from "../getAllSellers";
import {
  collection,
  CollectionReference,
  DocumentReference,
  getDocs,
} from "firebase/firestore";
import { SellersDoc } from "@/tools/sellers/create";
import { getAllCreditBunldes } from "@/tools/sellers/credits/getAllCreditsBundle";
import { SellersCollection } from "@/tools/firestore/CollectionTyping";
import { CreditInBundle } from "@/tools/sellers/credits/createOrUpdateCreditInBundle";

type creditTotals = {
  seller_ref: DocumentReference<SellersDoc>;
  total: number;
  seller_name: string;
};

export function useGetAllSellersCreditsTotals() {
  const sellers = useGetAllSellers();
  const [totals, setTotals] = useState<creditTotals[]>([]);

  useEffect(() => {
    const sellersFilteredByInventory =
      sellers?.docs.filter((seller) => {
        const data = seller.data();

        return data.hasInventory && !data.exclude;
      }) || [];

    sellersFilteredByInventory.map(async (seller) => {
      // 1. Get all available credits bundles from every container
      const bundles = await getAllCreditBunldes(seller.ref);

      //
      const credits = await Promise.all(
        bundles.map(async (bundle) => {
          const coll = collection(
            bundle.ref,
            SellersCollection.creditBundles.bundles.credits
          ) as CollectionReference<CreditInBundle>;

          const credits = await getDocs(coll);

          return credits;
        })
      );

      const amountTotals = credits.map((query) => {
        return query.docs.reduce((prev, curr) => {
          return prev + curr.data().amount;
        }, 0);
      });

      const amountReduced = amountTotals.reduce((prev, curr) => {
        return prev + curr;
      }, 0);

      setTotals((prev) => {
        return [
          ...prev,
          {
            seller_ref: seller.ref,
            total: amountReduced,
            seller_name: seller.data().name,
          },
        ];
      });
    });
  }, [sellers]);

  return totals;
}

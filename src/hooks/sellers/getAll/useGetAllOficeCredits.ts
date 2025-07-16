import { useEffect, useState } from "react";
import { SellersDoc } from "@/tools/sellers/create";
import { useGetSellers } from "../getSellers";
import {
  collection,
  DocumentReference,
  getDocs,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import {
  InvoiceCollection,
  SellersCollection,
} from "@/tools/firestore/CollectionTyping";
import { CollectionReference } from "firebase/firestore";
import { client } from "@/tools/sellers/createClient";
import { invoiceType } from "@/tools/invoices/createInvoice";

type clientsCreditsTotals = {
  total: number;
  client_name: string;
  client_Ref: DocumentReference<client>;
};

export function useGetAllOficeCredits() {
  const sellers = useGetSellers();
  const [office, setOffice] = useState<
    QueryDocumentSnapshot<SellersDoc> | undefined
  >();
  const [clients, setClients] = useState<QueryDocumentSnapshot<client>[]>([]);
  const [totals, setTotals] = useState<clientsCreditsTotals[]>([]);

  // effect to get the office
  useEffect(() => {
    const office = sellers?.docs.find((el) => !el.data().hasInventory);
    if (!office) return;

    setOffice(office);
  }, [sellers]);

  // efffect to manage the clients
  useEffect(() => {
    async function getClients() {
      if (!office) return;

      const coll = collection(
        office.ref,
        SellersCollection.clients
      ) as CollectionReference<client>;

      const q = query(coll, where("disabled", "==", false));

      const clients = await getDocs(q);
      setClients(clients.docs);
    }

    getClients();
  }, [office]);

  // effect to fetch each invoice with debt not paid from the clients
  useEffect(() => {
    clients.map(async (client) => {
      const coll = collection(
        client.ref.firestore,
        InvoiceCollection.root
      ) as CollectionReference<invoiceType>;

      const q = query(
        coll,
        where("client_ref", "==", client.ref),
        where("credit.paid", "==", false)
      );

      const invoices = await getDocs(q);

      const InvoiceInDebtReduced = invoices.docs.map(
        (invoice) => invoice.data().total_sold
      );

      const debtsReduced = InvoiceInDebtReduced.reduce((prev, curr) => {
        return prev + curr;
      }, 0);

      setTotals((prev) => {
        return [
          ...prev,
          {
            total: debtsReduced,
            client_name: client.data().name,
            client_Ref: client.ref,
          },
        ];
      });
    });
  }, [clients]);

  return totals;
}

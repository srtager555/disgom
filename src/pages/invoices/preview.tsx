import useQueryParams from "@/hooks/getQueryParams";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type rawProduct = {
  purchases_amounts: Array<{
    amount: number;
    price: number;
    total: number;
  }>;
  sales_amounts: Array<{
    amount: number;
    normal_price: number;
    normal_total: number;
    seller_price: number;
    seller_total: number;
  }>;
};

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [rawProducts, setRawProducts] = useState<
    Record<string, rawProduct> | undefined
  >();
  const data = useMemo(() => invoiceDoc?.data(), [invoiceDoc]);

  // effect to get the invoice
  useEffect(() => {
    async function getInvoice() {
      if (!id) return;

      const db = Firestore();
      const invcRef = doc(
        db,
        InvoiceCollection.root,
        id
      ) as DocumentReference<invoiceType>;
      const invoiceDoc = await getDoc(invcRef);

      setInvoiceDoc(invoiceDoc);
    }

    getInvoice();
  }, [id]);

  useEffect(() => {
    console.log(rawProducts);
  }, [rawProducts]);

  // effect to get outputs
  useEffect(() => {
    data?.products_outputs?.forEach(async (element) => {
      const output = await getDoc(element);
      const data = output.data();

      if (!data) return;

      setRawProducts((props) => {
        return {
          ...props,
          [element.id]: {
            purchases_amounts: props
              ? [
                  ...(props[element.id]?.purchases_amounts || []),
                  {
                    amount: data.amount,
                    price: data.cost_price,
                    total: data.purchase_cost,
                  },
                ]
              : [
                  {
                    amount: data.amount,
                    price: data.cost_price,
                    total: data.purchase_cost,
                  },
                ],
            sales_amounts: props
              ? [
                  ...(props[element.id]?.sales_amounts || []),
                  {
                    amount: data.amount,
                    normal_price: data.sale_prices.normal,
                    normal_total: data.sales_values.normal,
                    seller_price: data.sale_prices.seller,
                    seller_total: data.sales_values.seller,
                  },
                ]
              : [
                  {
                    amount: data.amount,
                    normal_price: data.sale_prices.normal,
                    normal_total: data.sales_values.normal,
                    seller_price: data.sale_prices.seller,
                    seller_total: data.sales_values.seller,
                  },
                ],
          },
        };
      });
    });
  }, [data?.products_outputs]);

  return <>{id}</>;
}

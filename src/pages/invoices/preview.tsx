import { ProductPreview } from "@/components/pages/invoice/Product/preview";
import useQueryParams from "@/hooks/getQueryParams";
import { Container } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

export type purchases_amounts = {
  amount: number;
  price: number;
  total: number;
};

export type sales_amounts = {
  amount: number;
  normal_price: number;
  normal_total: number;
  seller_price: number;
  seller_total: number;
};

export type rawProduct = {
  purchases_amounts: Array<purchases_amounts>;
  sales_amounts: Array<sales_amounts>;
};

export type invoiceOwners = {
  seller: DocumentSnapshot<SellersDoc>;
  client: DocumentSnapshot<client> | undefined;
};

export default function Page() {
  const { id } = useQueryParams();
  const [invoiceDoc, setInvoiceDoc] = useState<DocumentSnapshot<invoiceType>>();
  const [rawProducts, setRawProducts] = useState<
    Record<string, rawProduct> | undefined
  >();
  const [owners, setOwners] = useState<invoiceOwners>();
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

  // effect to get the seller
  useEffect(() => {
    async function getOwners() {
      if (!data) return;
      let client;

      if (data.client_ref) {
        client = await getDoc(data.client_ref);
      }
      const seller = await getDoc(data.seller_ref);

      setOwners({
        seller,
        client,
      });
    }

    getOwners();
  }, [data]);

  // effect to get outputs
  useEffect(() => {
    data?.products_outputs?.forEach(async (element) => {
      const output = await getDoc(element);
      const data = output.data();

      if (!data) return;
      const product_id = data.entry_ref.path.split("/")[1];

      setRawProducts((props) => {
        return {
          ...props,
          [product_id]: {
            purchases_amounts: props
              ? [
                  ...(props[product_id]?.purchases_amounts || []),
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
                  ...(props[product_id]?.sales_amounts || []),
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

    return () => {
      setRawProducts(undefined);
    };
  }, [data?.products_outputs]);

  if (!owners || !rawProducts) return <h2>Cargando...</h2>;

  return (
    <Container>
      {id}
      <Container>
        {Object.entries(rawProducts).map((el, i) => {
          const product_id = el[0];
          const data = el[1];
          return (
            <ProductPreview
              owners={owners}
              product_id={product_id}
              data={data}
              key={i}
            />
          );
        })}
      </Container>
    </Container>
  );
}

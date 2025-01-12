import { ProductPreview } from "@/components/pages/invoice/Product/preview";
import { Result } from "@/components/pages/invoice/Product/preview/Result";
import { Descriptions } from "@/components/pages/invoice/ProductList";
import useQueryParams from "@/hooks/getQueryParams";
import { Button } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import { Firestore } from "@/tools/firestore";
import { InvoiceCollection } from "@/tools/firestore/CollectionTyping";
import { invoiceType } from "@/tools/invoices/createInvoice";
import { disableInvoice } from "@/tools/invoices/disableInvoice";
import { paidInvoice } from "@/tools/invoices/paid";
import { SellersDoc } from "@/tools/sellers/create";
import { client } from "@/tools/sellers/createClient";
import {
  doc,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/router";
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
  const [timeOut, setTimeOut] = useState<NodeJS.Timeout>();
  const data = useMemo(() => invoiceDoc?.data(), [invoiceDoc]);
  const router = useRouter();

  async function paid() {
    if (invoiceDoc) await paidInvoice(invoiceDoc.ref);

    router.push("/invoices");
  }

  function removeInvoice() {
    setTimeOut(
      setTimeout(async () => {
        if (!invoiceDoc) return;

        await disableInvoice(invoiceDoc);

        router.push("/invoices");
      }, 5000)
    );
  }

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

  if (!owners || !rawProducts || !data) return <h2>Cargando...</h2>;

  return (
    <Container>
      <Container styles={{ marginBottom: "20px" }}>
        <h2>Factura de {owners.client?.data()?.name}</h2>
        <p>
          Esta factura se hizo el{" "}
          {data.created_at.toDate().toLocaleDateString()}
        </p>
        {data.credit?.paid ? (
          <p>
            La factura esta actualmente pagadá, se pagó el{" "}
            {data.credit.paid_at?.toDate().toLocaleDateString()}
          </p>
        ) : (
          <p>La factura esta pendiente</p>
        )}
      </Container>
      <Container>
        <Descriptions hasInventory={owners.seller.data()?.hasInventory} />
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
      <Result
        hasInventory={owners.seller.data()?.hasInventory}
        rawProducts={rawProducts}
      />
      <FlexContainer
        styles={{ justifyContent: "space-between", marginBottom: "200px" }}
      >
        <Button disabled={data.credit?.paid} onClick={paid}>
          Pagar factura
        </Button>
        <Button
          onPointerDown={removeInvoice}
          onPointerUp={() => clearTimeout(timeOut)}
          onMouseUp={() => clearTimeout(timeOut)}
          onMouseLeave={() => clearTimeout(timeOut)}
          $warn
          $hold
        >
          Eliminar factura
        </Button>
      </FlexContainer>
    </Container>
  );
}

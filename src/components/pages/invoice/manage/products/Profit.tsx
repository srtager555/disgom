import { Column } from "../../Product";
import { useEffect, useState } from "react";
import { getDoc } from "firebase/firestore";
import { numberParser } from "@/tools/numberPaser";
import { useGetInvoiceByQueryOnSnapshot } from "@/hooks/invoice/getInvoiceByQueryOnSnapshot";

type props = { id: string };

export function Profit({ id }: props) {
  const invoice = useGetInvoiceByQueryOnSnapshot();
  const [total, setTotal] = useState("0.00");

  useEffect(() => {
    async function getResults() {
      const data = invoice?.data();
      const product_outputs_refs = data?.products_outputs[id];
      if (!product_outputs_refs) return setTotal("0.00");

      const product_outputs = await Promise.all(
        product_outputs_refs?.map(async (el) => getDoc(el))
      );

      const results = product_outputs?.reduce(
        (acc, next) => {
          const data = next.data();

          return {
            purchase_total:
              acc.purchase_total + (data?.purchase_value as number),
            sale_total: acc.sale_total + (data?.sale_value as number),
          };
        },
        {
          purchase_total: 0,
          sale_total: 0,
        }
      );

      setTotal(numberParser(results.sale_total - results.purchase_total));
    }

    getResults();
  }, [invoice, id]);

  return <Column>{total}</Column>;
}

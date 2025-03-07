import { Column } from "../../Product";
import { useEffect, useState } from "react";
import { numberParser } from "@/tools/numberPaser";
import { useGetProductOutputByID } from "@/hooks/invoice/getProductOutputsByID";

type props = { id: string };

export function Profit({ id }: props) {
  const [total, setTotal] = useState("0.00");
  const outputs = useGetProductOutputByID(id);

  useEffect(() => {
    async function getResults() {
      if (!outputs) return setTotal("0.00");

      const results = outputs.reduce(
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
  }, [outputs]);

  return <Column title={total}>{total}</Column>;
}

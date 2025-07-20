import { MutableRefObject, useEffect, useRef, useState } from "react";
import { DocumentReference, DocumentSnapshot } from "firebase/firestore";
import { productDoc } from "@/tools/products/create";
import { useInvoice } from "@/contexts/InvoiceContext";
import { useNewDefaultCustomPricesContext } from "@/hooks/invoice/useNewDefaultCustomPricesContext";
import { parseNumberInput } from "@/tools/parseNumericInput";
import { getTheOutputsSoldByID } from "@/tools/invoices/getTheOutputsSoldByID";
import { someHumanChangesDetected } from "@/components/pages/invoice/manage/products/Product";
import { getParentStock } from "@/tools/products/getParentStock";
import { getDocFromCacheOnce } from "@/tools/firestore/fetch/getDocFromCacheOnce";

type props = {
  product_doc: DocumentSnapshot<productDoc>;
  product_ref: DocumentReference<productDoc>;
  defaultCustomPrice: number | undefined;
  someHumanChangesDetected: MutableRefObject<someHumanChangesDetected>;
};

export function useManagePrice({
  product_doc,
  product_ref,
  defaultCustomPrice,
  someHumanChangesDetected,
}: props) {
  const { invoice } = useInvoice();
  const invoiceType = invoice?.data()?.invoice_type;
  const priceMultiplier = invoiceType !== "normal" ? -1 : 1;

  const [isDefaultCustomPrice, setIsDefaultCustomPrice] = useState({
    isThat: false,
    areTheSame: false,
  });
  const [normalPrice, setNormalPrice] = useState(0);
  const [priceValue, setPriceValue] = useState("0");
  const [customPrice, setCustomPrice] = useState<number | undefined>();
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const { setNewDefaultCustomPrices } = useNewDefaultCustomPricesContext();
  const isInitialFetchDone = useRef(false);

  // Effect 1: Get normal price from product doc. Stores the raw, positive price.
  useEffect(() => {
    async function getNormalPrice() {
      const productData = product_doc.data();
      if (productData) {
        let price: number;

        if (productData.product_parent) {
          const parentProduct = await getDocFromCacheOnce(
            productData.product_parent
          );

          const data = parentProduct.data();

          // if the persistent price arent available check the stock
          if (!data?.last_sales_amounts) {
            const stock = await getParentStock(productData.product_parent);

            const stockSorted =
              stock.sort(
                (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
              ) ?? [];

            price = stockSorted[0]?.sale_price || 0;
          } else {
            // if the persistent price are up, set it!
            price = data.last_sales_amounts.sale_price;
          }
        } else {
          if (productData.last_sales_amounts) {
            price = productData.last_sales_amounts.sale_price;
          } else {
            const stockSorted =
              productData.stock.sort(
                (a, b) => b.created_at.toMillis() - a.created_at.toMillis()
              ) ?? [];

            price = stockSorted[0]?.sale_price || 0;
          }
        }
        setNormalPrice(price);
      }
    }
    getNormalPrice();
  }, [product_doc]);

  // Effect 2: Set initial price from history, defaults, or normal price.
  useEffect(() => {
    // Wait for dependencies to be ready. normalPrice is a good indicator.
    if (isInitialFetchDone.current || !invoice || normalPrice === 0) return;

    const initializePrice = async () => {
      let priceToSet: number | undefined;

      // 1. Try to get from history
      const outputsSold = await getTheOutputsSoldByID(product_ref, invoice.ref);
      if (outputsSold && !outputsSold.empty) {
        const firstSoldDoc = outputsSold.docs[0].data();
        priceToSet = firstSoldDoc.sale_price as number;
      }

      // 2. If no history, use default custom price
      if (priceToSet === undefined && defaultCustomPrice !== undefined) {
        priceToSet = defaultCustomPrice;
        setIsDefaultCustomPrice({ isThat: true, areTheSame: true });
      }

      // 3. Fallback to normal price
      if (priceToSet === undefined) {
        priceToSet = normalPrice;
      }

      // 4. Set states
      setPriceValue(String(priceToSet * priceMultiplier));
      if (Math.abs(priceToSet - normalPrice) > 0.001) {
        setCustomPrice(priceToSet);
      } else {
        setCustomPrice(undefined);
      }
      isInitialFetchDone.current = true;
      setIsPriceLoading(false);
    };

    initializePrice();
  }, [invoice, product_ref, priceMultiplier, normalPrice, defaultCustomPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(() => {}, e, { returnRaw: true });
    if (value === undefined) return;
    setPriceValue(value);
  };

  const handlePriceBlur = () => {
    const numericValue = Number(priceValue);
    if (isNaN(numericValue)) return;

    const effectiveNormalPrice = normalPrice * priceMultiplier;
    const tolerance = 0.001;

    if (Math.abs(numericValue - effectiveNormalPrice) < tolerance) {
      setCustomPrice(undefined);
    } else {
      setCustomPrice(numericValue / priceMultiplier);
    }

    if (numericValue !== normalPrice && !isDefaultCustomPrice.areTheSame) {
      setNewDefaultCustomPrices((prev) => ({
        ...prev,
        [product_ref.id]: {
          price: numericValue / priceMultiplier,
          product_ref,
        },
      }));
    } else {
      setNewDefaultCustomPrices((prev) => {
        const newPrev = { ...prev };
        delete newPrev[product_ref.id];
        return newPrev;
      });
    }
    someHumanChangesDetected.current.price = true;
  };

  return {
    isPriceLoading,
    customPrice,
    priceValue,
    normalPrice,
    priceMultiplier,
    isDefaultCustomPrice,
    handlePriceChange,
    handlePriceBlur,
  };
}

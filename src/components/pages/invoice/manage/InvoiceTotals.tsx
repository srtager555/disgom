import { ProductContainer } from "@/components/pages/invoice/ProductList";
import { Column } from "@/components/pages/invoice/Product";
import { numberParser } from "@/tools/numberPaser";
import { TotalResults } from "@/hooks/useProductResults";
import { Container } from "@/styles/index.styles";

interface Props {
  totalResults: TotalResults;
  hasInventory?: boolean;
}

export function InvoiceTotals({ totalResults, hasInventory }: Props) {
  return (
    <Container styles={{ marginBottom: "50px" }}>
      <ProductContainer $hasInventory={hasInventory} $withoutStock={1}>
        <Column gridColumn={hasInventory ? "9 / 10" : "10 / 11"}>
          <b>Totales</b>
        </Column>
        <Column gridColumn="" title={numberParser(totalResults.totalSold)}>
          <b>{numberParser(totalResults.totalSold)}</b>
        </Column>
        <Column gridColumn="" title={numberParser(totalResults.totalProfit)}>
          <b>{numberParser(totalResults.totalProfit)}</b>
        </Column>
        {hasInventory && (
          <>
            <Column
              gridColumn=""
              title={numberParser(totalResults.totalSellerProfit)}
            >
              <b>{numberParser(totalResults.totalSellerProfit)}</b>
            </Column>
          </>
        )}
      </ProductContainer>
    </Container>
  );
}

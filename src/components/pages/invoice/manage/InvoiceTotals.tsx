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
        <Column gridColumn={"9 / 10"}>{""}</Column>
        <Column gridColumn={"10 / 11"}>
          <b>Total</b>
        </Column>
        <Column
          gridColumn={!hasInventory ? "span 2" : ""}
          title={numberParser(totalResults.totalSold)}
        >
          <Container styles={{ textAlign: "end" }}>
            <b>{numberParser(totalResults.totalSold)}</b>
          </Container>
        </Column>
        <Column
          gridColumn={!hasInventory ? "span 2" : ""}
          title={numberParser(totalResults.totalProfit)}
        >
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
            <Column>{""}</Column>
          </>
        )}
      </ProductContainer>
    </Container>
  );
}

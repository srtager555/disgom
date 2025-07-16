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
        <Column
          gridColumn={hasInventory ? "8 / 9" : "6 / 7"}
          printGridColumn={"7 / 8"}
        >
          {""}
        </Column>
        <Column
          gridColumn={"span 1"}
          printGridColumn={hasInventory ? "9 / 10" : "10 / 11"}
          $textAlign="center"
        >
          <b>TOTAL</b>
        </Column>
        <Column
          gridColumn={!hasInventory ? "span 3" : ""}
          printGridColumn={!hasInventory ? "span 3" : "span 2"}
          title={numberParser(totalResults.totalSold)}
          $textAlign="center"
        >
          <Container styles={{ textAlign: "end" }}>
            <b>{numberParser(totalResults.totalSold)}</b>
          </Container>
        </Column>
        <Column
          hideOnPrint
          gridColumn={!hasInventory ? "span 2" : ""}
          title={numberParser(totalResults.totalProfit)}
          $textAlign="center"
        >
          <b>{numberParser(totalResults.totalProfit)}</b>
        </Column>
        {hasInventory && (
          <>
            <Column
              hideOnPrint
              gridColumn=""
              title={numberParser(totalResults.totalSellerProfit)}
              $textAlign="center"
            >
              <b>{numberParser(totalResults.totalSellerProfit)}</b>
            </Column>
          </>
        )}
        <Column></Column>
      </ProductContainer>
    </Container>
  );
}

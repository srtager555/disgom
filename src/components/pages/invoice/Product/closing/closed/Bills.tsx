import { globalCSSVars } from "@/styles/colors";
import { Container, FlexContainer } from "@/styles/index.styles";
import { useEffect, useState } from "react";
import { numberParser } from "@/tools/numberPaser";

export type bill = {
  reason: string;
  amount: number;
};

type props = {
  bills: Array<bill> | null;
};

export function Bills({ bills }: props) {
  const [total, setTotal] = useState(0);

  // effecto to reduce the bills
  useEffect(() => {
    const total = bills?.reduce((before, now) => {
      return before + now.amount;
    }, 0);

    setTotal(total || 0);
  }, [bills]);

  return (
    <Container styles={{ display: "inline-block" }}>
      <h2>Gastos</h2>
      {bills?.map((el, i) => {
        return (
          <FlexContainer
            key={i}
            styles={{
              width: "400px",
              borderBottom: "1px solid " + globalCSSVars["--detail"],
              marginBottom: "20px",
            }}
          >
            <Container styles={{ width: "300px", marginRight: "10px" }}>
              {el.reason}
            </Container>
            <Container styles={{ width: "90px" }}>
              {numberParser(el.amount)}
            </Container>
          </FlexContainer>
        );
      })}
      <FlexContainer
        styles={{
          justifyContent: "flex-end",
          width: "400px",
          alignItems: "flex-end",
        }}
      >
        <h3>Total</h3>
        <p style={{ width: "90px", marginLeft: "10px" }}>
          {numberParser(total)}
        </p>
      </FlexContainer>
    </Container>
  );
}

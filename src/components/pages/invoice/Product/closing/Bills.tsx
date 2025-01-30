import { globalCSSVars } from "@/styles/colors";
import { Button, Form } from "@/styles/Form.styles";
import { Container, FlexContainer } from "@/styles/index.styles";
import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Input } from "..";
import { numberParser } from "@/tools/numberPaser";

export type bill = {
  reason: string;
  amount: number;
};

type props = {
  bills: Record<string, bill>;
  setBills: Dispatch<SetStateAction<Record<string, bill>>>;
};

export function Bills({ bills, setBills }: props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [total, setTotal] = useState(0);

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    const { reason, amount } = e.target as typeof e.target & {
      reason: HTMLTextAreaElement;
      amount: HTMLInputElement;
    };

    setBills((props) => {
      return {
        ...props,
        [reason.value.replaceAll(" ", "_")]: {
          reason: reason.value,
          amount: Number(amount.value),
        },
      };
    });

    formRef.current?.reset();
  }

  function removeBill(id: string) {
    setBills((props) => {
      const all = { ...props };
      delete all[id];

      return all;
    });
  }

  // effecto to reduce the bills
  useEffect(() => {
    const total = Object.values(bills).reduce((before, now) => {
      return before + now.amount;
    }, 0);

    setTotal(total);
  }, [bills]);

  return (
    <Container styles={{ display: "inline-block" }}>
      <h2>Gastos</h2>
      <Form ref={formRef} onSubmit={onSubmit} style={{ marginBottom: "20px" }}>
        <FlexContainer styles={{ alignItems: "flex-start" }}>
          <Container styles={{ width: "300px", marginRight: "10px" }}>
            <h3>Razón</h3>
            <textarea name="reason" style={{ padding: "5px", width: "100%" }} />
          </Container>
          <Container styles={{ width: "90px", marginRight: "10px" }}>
            <h3>Cantidad</h3>
            <Container styles={{ height: "40px" }}>
              <Input name="amount" type="number" />
            </Container>
          </Container>
          <Button
            style={{
              border: "none",
              borderBottom: "1px solid " + globalCSSVars["--detail"],
            }}
          >
            Añadir
          </Button>
        </FlexContainer>
      </Form>
      {Object.values(bills).map((el, i) => {
        return (
          <FlexContainer
            key={i}
            styles={{
              width: "400px",
              borderBottom: "1px solid " + globalCSSVars["--detail"],
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <Container styles={{ width: "255px", marginRight: "10px" }}>
              {el.reason}
            </Container>
            <Container
              styles={{ width: "80px", marginRight: "10px", textAlign: "end" }}
            >
              {numberParser(el.amount)}
            </Container>
            <Container styles={{ width: "45px" }}>
              <Button
                onClick={() => removeBill(el.reason.replaceAll(" ", "_"))}
              >
                X
              </Button>
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
        <p style={{ width: "90px", marginRight: "55px", textAlign: "end" }}>
          {numberParser(total)}
        </p>
      </FlexContainer>
    </Container>
  );
}

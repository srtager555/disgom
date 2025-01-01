import { Container } from "@/styles/index.styles";
import { DetailedHTMLProps, InputHTMLAttributes } from "react";
import styled from "styled-components";

const Input = styled.input`
  padding: 5px;
  font-size: 1rem;
`;

interface props
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  children?: children;
  inline?: boolean;
  marginBottom?: string;
}

export function InputNumber({
  children,
  width,
  marginBottom,
  inline,
  ...props
}: props) {
  return (
    <Container
      styles={{
        display: inline ? "inline-block" : "block",
        marginBottom: marginBottom || "20px",
        marginRight: inline ? "10px" : "0px",
        width,
      }}
    >
      <p>
        {children}
        {props.required && "*"}
      </p>
      <Input style={{ width: "100%" }} {...props} type="number" />
    </Container>
  );
}

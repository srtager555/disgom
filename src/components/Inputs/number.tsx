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
  children?: string;
  inline?: boolean;
}

export function InputNumber({ children, inline, ...props }: props) {
  return (
    <Container
      styles={{
        display: inline ? "inline-block" : "block",
        marginBottom: "20px",
        marginRight: inline ? "10px" : "0px",
      }}
    >
      <p>
        {children}
        {props.required && "*"}
      </p>
      <Input {...props} type="number" />
    </Container>
  );
}

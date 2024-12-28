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
}

export function InputText({ children, ...props }: props) {
  return (
    <Container styles={{ marginBottom: "20px" }}>
      <p>
        {children}
        {props.required && "*"}
      </p>
      <Input {...props} type="text" />
    </Container>
  );
}

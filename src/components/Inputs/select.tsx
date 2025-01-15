import { Container } from "@/styles/index.styles";
import { DetailedHTMLProps, SelectHTMLAttributes } from "react";
import styled from "styled-components";

const SelectStyles = styled.select`
  padding: 5px;
  font-size: 1rem;
`;

interface props
  extends DetailedHTMLProps<
    SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  children?: children;
  inline?: boolean;
  marginBottom?: string;
  options: Array<{
    name: string;
    value: string;
    selected?: boolean;
    disabled?: boolean;
  }>;
}

export function Select({
  children,
  inline,
  marginBottom,
  options,
  ...props
}: props) {
  return (
    <Container
      styles={{
        display: inline ? "inline-block" : "block",
        marginBottom: marginBottom || "20px",
        marginRight: inline ? "10px" : "0px",
      }}
    >
      <p>{children}</p>
      <SelectStyles {...props}>
        {options.map((el, i) => {
          return (
            <option
              key={i}
              value={el.value}
              selected={el.selected}
              disabled={el.disabled}
            >
              {el.name}
            </option>
          );
        })}
      </SelectStyles>
    </Container>
  );
}

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
  options: Array<{ name: string; value: string; selected?: boolean }>;
}

export function Select({ children, inline, options, ...props }: props) {
  return (
    <Container
      styles={{
        display: inline ? "inline-block" : "block",
        marginBottom: "20px",
        marginRight: inline ? "10px" : "0px",
      }}
    >
      <p>{children}</p>
      <SelectStyles {...props}>
        {options.map((el, i) => {
          return (
            <option key={i} value={el.value} selected={el.selected}>
              {el.name}
            </option>
          );
        })}
      </SelectStyles>
    </Container>
  );
}

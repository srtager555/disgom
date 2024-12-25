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
  options: Array<{ name: string; value: string; selected?: boolean }>;
}

export function Select({ children, options, ...props }: props) {
  return (
    <Container styles={{ marginBottom: "20px" }}>
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

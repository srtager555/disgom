import { Container } from "@/styles/index.styles";
import {
  DetailedHTMLProps,
  SelectHTMLAttributes,
  useEffect,
  useState,
} from "react";
import styled from "styled-components";

const SelectStyles = styled.select`
  padding: 5px;
  font-size: 1rem;
`;

type optionsFields = {
  name: string;
  value: string;
  selected?: boolean;
  disabled?: boolean;
};

interface props
  extends DetailedHTMLProps<
    SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  children?: children;
  inline?: boolean;
  marginBottom?: string;
  options: Array<optionsFields> | Promise<Array<optionsFields>>;
}

export function Select({
  children,
  inline,
  marginBottom,
  options,
  ...props
}: props) {
  const [optionsWaited, setOptionsWaited] = useState<Array<optionsFields>>([]);

  useEffect(() => {
    async function waitOptions() {
      if (options instanceof Promise) {
        const result = await options;
        setOptionsWaited(result);
      } else {
        setOptionsWaited(options);
      }
    }

    waitOptions();
  }, [options]);

  return (
    <Container
      styles={{
        display: inline ? "inline-block" : "block",
        marginBottom: marginBottom || "20px",
        marginRight: inline ? "10px" : "0px",
      }}
    >
      {children && <p>{children}</p>}
      <SelectStyles {...props}>
        {optionsWaited.map((el, i) => {
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

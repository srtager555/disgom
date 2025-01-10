import {
  DetailedHTMLProps,
  FormHTMLAttributes,
  forwardRef,
  LegacyRef,
  MutableRefObject,
} from "react";
import { Container, deleteRepeatedValues } from "./index.styles";
import styled, { css } from "styled-components";
import { globalCSSVars } from "./colors";

interface FormType
  extends DetailedHTMLProps<
    FormHTMLAttributes<HTMLFormElement>,
    HTMLFormElement
  > {
  $font?: string;
  ref?: MutableRefObject<HTMLFormElement | null>;

  loading?: boolean;
}

export const Form = forwardRef(function awa(
  props: FormType,
  ref: LegacyRef<HTMLFormElement> | undefined
) {
  const { children, className, loading } = props;
  const clone = deleteRepeatedValues(props);

  return (
    <Container>
      <Container
        styles={{
          position: "absolute",
          top: "0",
          left: "0",
          opacity: loading ? "1" : "0",
          pointerEvents: !loading ? "none" : "all",
          width: "100%",
          height: "100%",
          zIndex: "100",
          transition: "200ms",
        }}
      >
        {/* <Loader /> */}
      </Container>
      <form
        style={{
          opacity: loading ? "0.5" : "1",
          transition: "200ms",
          pointerEvents: loading ? "none" : "all",
        }}
        className={className}
        {...clone}
        ref={ref}
      >
        {children}
      </form>
    </Container>
  );
});

export const Button = styled.button<{
  $warn?: boolean;
  $primary?: boolean;
  $hold?: boolean;
}>`
  position: relative;
  display: inline-block;
  padding: 10px 15px;
  background-color: transparent;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: 200ms all ease;

  &:hover {
    transform: scale(1.1);
  }
  &:active {
    transform: scale(0.9);

    ${(props) =>
      props.$hold &&
      css`
        &::before {
          width: 100%;
          transition: 5000ms width ease;
        }
      `}
  }
  &:disabled {
    opacity: 0.5;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0%;
    transition: 200ms width ease;
    background-color: #ff000080;
  }

  ${(props) => {
    if (props.$primary) {
      return css`
        background-color: ${globalCSSVars["--highlight"]};
        color: #fff;
      `;
    } else if (props.$warn) {
      return css`
        background-color: ${globalCSSVars["--warn"]};
        color: #fff;
      `;
    } else
      return css`
        border: 2px solid ${globalCSSVars["--foreground"]};
      `;
  }};
`;

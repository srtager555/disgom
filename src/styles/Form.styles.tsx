import {
  DetailedHTMLProps,
  FormHTMLAttributes,
  forwardRef,
  LegacyRef,
  MutableRefObject,
} from "react";
import { Container, deleteRepeatedValues } from "./index.styles";

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

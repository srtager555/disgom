/* eslint-disable react/display-name */
import { globalCSSVars } from "@/styles/colors";
import {
  styled,
  CSSObject,
  DefaultTheme,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
} from "styled-components";
import { CSSProperties, LegacyRef, MutableRefObject, forwardRef } from "react";
import { Noto_Sans_Display } from "next/font/google";
import Link from "next/link";

type ThemedStyledProps<P, T> = P & { theme: T };

// const JS = Josefin_Sans({ weight: "500", subsets: ["latin"] });
const Noto = Noto_Sans_Display({
  weight: ["200", "400", "600"],
  subsets: ["latin"],
});

// Function to process props and convert them into valid css styles
export function processStyles(
  props: ThemedStyledProps<
    { styles?: CSSProperties; children?: children },
    DefaultTheme
  >
): CSSObject {
  const styleProps: CSSObject = {};

  if (!props.styles) return styleProps;

  // checking if the key is valid
  Object.keys(props.styles).forEach((key) => {
    // the camel case will process to the correct syntax, for example: maxWidth => max-width
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    styleProps[cssKey as string] =
      props.styles && props.styles[key as keyof typeof props.styles];
  });

  return styleProps;
}

/**
 *  this function will delete values that I don't want to overwrite when I use the destructuring
 */
export function deleteRepeatedValues(props: object) {
  const attributesToDelete = [
    "children",
    "font",
    "className",
    "theme",
    "styles",
  ];
  const clone: { [key: string]: unknown } = { ...props };

  for (const attribute in clone) {
    if (
      // eslint-disable-next-line no-prototype-builtins
      clone.hasOwnProperty(attribute) &&
      attributesToDelete.includes(attribute)
    ) {
      delete clone[attribute];
    }
  }

  return clone;
}

// the main tags can receive any attribute from css into the style attribute
// main div

interface DivType extends React.HTMLAttributes<HTMLDivElement> {
  font?: string;
  ref?: MutableRefObject<HTMLDivElement>;
}

const Div = forwardRef(
  (props: DivType, ref: LegacyRef<HTMLDivElement> | undefined) => {
    const { children, font, className } = props;
    const clone = deleteRepeatedValues(props);

    return (
      <div
        ref={ref}
        className={`${className} ${font ?? Noto.className}`}
        {...clone}
      >
        {children}
      </div>
    );
  }
);

export const StyledDiv = styled(Div)<{ styles?: CSSProperties }>((props) => ({
  position: props.styles?.position || "relative",
  ...processStyles(props),
}));

const BaseBaseText = (props: { children?: children; className?: string }) => {
  const { children, className } = props;
  const clone = deleteRepeatedValues(props);

  return (
    <span className={`${className}`} {...clone}>
      {children}
    </span>
  );
};

export const BaseText = styled(BaseBaseText)<{ styles?: CSSProperties }>(
  (props) => ({
    display: "inline-flex",
    fontSize: "inherit",
    fontFamily: "inherit",
    fontWeight: "inherit",
    fontStyle: "inherit",
    ...processStyles(props),
  })
);

//
// starting with styles
//

// Simple name to StyledDiv
export const Container = styled(StyledDiv)``;

export const FlexContainer = styled(StyledDiv)<{ $inline?: boolean }>`
  display: ${(props) => (props.$inline ? "inline-flex" : "flex")};
`;

export const SpaceBeetwenContainer = styled(StyledDiv)`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`;

export const Line = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 1px;
  width: 100vw;
  background-color: ${globalCSSVars["--foreground"]};
  z-index: -1;
`;

export const TransparentLink = styled(Link)`
  position: relative;
  display: inline-block;
  text-decoration: none;
  cursor: pointer;
`;

export const BGlass = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.bg || "#ffffff09"};
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(25px);
  z-index: -1;
`;

export const GridContainer = styled(StyledDiv)<{
  grisTemplateColumns?: string;
  customWidth?: string;
}>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.grisTemplateColumns || "repeat(auto-fill, minmax(30px, 60px))"};
  grid-auto-flow: column;
  grid-auto-columns: ${(props) => props.customWidth || "80px"};

  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid ${globalCSSVars["--detail"]};
  background-color: ${globalCSSVars["--background"]};

  &:nth-child(odd) {
    background-color: ${globalCSSVars["--background-highlight"]};
  }
`;

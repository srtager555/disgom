import Link, { LinkProps } from "next/link";
import styled, { css } from "styled-components";
import { globalCSSVars } from "./colors";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Container, FlexContainer } from "./index.styles";

const LinkBase = styled(Link)<{ $active: boolean }>`
  position: relative;
  display: inline-block;
  font-style: italic;
  transition: 200ms all ease;

  &:active {
    transform: scale(0.9);
  }

  &:after {
    content: "";
    height: 3px;
    width: ${(props) => (props.$active ? "100%" : "0%")};
    background-color: #0099ff;
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    transition: all 200ms ease;
  }
  &:hover {
    &:after {
      width: 100%;
    }
  }
`;

interface props extends LinkProps {
  actived?: boolean;
  children?: children;
}

export function CustomLink({ children, ...props }: props) {
  const [actived, setActived] = useState(false);
  const asPath = useRouter().asPath;

  useEffect(() => {
    if (props.href === asPath) {
      setActived(true);
    } else setActived(false);
  }, [asPath, props.href]);

  return (
    <LinkBase {...props} $active={actived}>
      {children}
    </LinkBase>
  );
}

export const Nav = styled.nav`
  display: flex;
  justify-content: flex-start;
  align-items: center;

  width: 100%;
  position: sticky;
  top: 0;
  z-index: 1000;
  background: ${globalCSSVars["--background"]};
  border-bottom: 1px solid ${globalCSSVars["--detail"]};

  @media print {
    display: none;
  }
`;

export const NavAnchor = styled(Link)<{ $active?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 10px;
  transition: all 200ms ease;
  background-color: ${globalCSSVars["--background"]};

  ${(props) =>
    props.$active &&
    css`
      background-color: ${globalCSSVars["--foreground-hover"]};
    `}
  & > * {
    transition: all 200ms ease;
    ${(props) =>
      props.$active &&
      css`
        transform: scale(1.2);
      `}

    &:hover {
      transform: scale(1.2);
    }

    &:active {
      transform: scale(0.9);
    }
  }

  &:hover {
    background-color: ${globalCSSVars["--foreground-hover"]};
  }
`;

export const NavContainer = styled.div<{
  $deployNav: boolean;
  $removeMaxWith: boolean;
}>`
  max-width: ${({ $removeMaxWith }) => ($removeMaxWith ? "100%" : "1100px")};
  width: 100%;
  margin: 0 auto;
  height: 100vh;
  overflow: scroll;
  transition: all 200ms ease;
  padding: 10px;
  padding-top: 0px;

  @media print {
    display: block;
    padding: 0px;
  }
`;

export const AnchorNavigators = styled(CustomLink)`
  margin-right: 15px;
`;

export const AnchorContainer = styled(Container)`
  border-bottom: dashed 1px ${globalCSSVars["--detail"]};
  background-color: inherit;

  &:last-child {
    border-bottom: none;
  }

  &:hover > .list {
    opacity: 1;
    pointer-events: all;
  }
`;

export const Anchor = styled(Link)`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 5px;
  padding: 10px;

  &:hover {
    background-color: ${globalCSSVars["--foreground-hover"]};
  }
`;

export const SimpleAnchor = styled.a`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  gap: 5px;
  padding: 10px;

  &:hover {
    background-color: ${globalCSSVars["--foreground-hover"]};
  }
`;

export const AnchorList = styled(FlexContainer)`
  flex-direction: column;
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: inherit;
  opacity: 0;
  pointer-events: none;
  transition: 200ms all;
  z-index: 1;
  border: 1px solid ${globalCSSVars["--detail"]};
  box-shadow: 0px 16px 20px #0002;

  &.child {
    top: 0;
    left: 100%;
  }
`;

export const AnchorPlus = styled.span`
  position: relative;
  display: inline-block;
  min-width: 10px;
  height: 10px;
  margin-left: 5px;

  &:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    border-right: 2px solid ${globalCSSVars["--foreground"]};
    border-top: 2px solid ${globalCSSVars["--foreground"]};
    transform: translate(-50%, -50%) rotate(45deg);
  }
`;

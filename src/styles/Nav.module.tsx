import Link, { LinkProps } from "next/link";
import styled, { css } from "styled-components";
import { globalCSSVars } from "./colors";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

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
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 50px;
  width: 100%;
  padding: 10px 0;
  background: ${globalCSSVars["--background"]};
  border: 2px ${globalCSSVars["--foreground"]} solid;
  border-radius: 15px;

  @media print {
    display: none;
  }
`;

export const NavAnchor = styled(Link)<{ $active?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  transition: all 200ms ease;
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
  display: grid;
  grid-template-columns: ${({ $deployNav }) => ($deployNav ? "200px" : "60px")} 1fr 60px;
  max-width: ${({ $removeMaxWith }) => ($removeMaxWith ? "100%" : "1100px")};
  width: 100%;
  margin: 0 auto;
  height: 100vh;
  overflow: scroll;
  transition: all 200ms ease;
  padding: 10px;

  @media print {
    display: block;
    padding: 0px;
  }
`;

export const AnchorNavigators = styled(CustomLink)`
  margin-right: 15px;
`;

"use client";

import { globalCSSVars } from "@/styles/colors";
import React, { useRef } from "react";
import styled from "styled-components";

const StyledTextarea = styled.textarea`
  field-sizing: content;
  width: 100%;
  min-height: 60px;
  resize: none;
  overflow: hidden;
  font-size: 1.5rem;
  font-family: inherit;
  border: none;
  padding: 10px;
  box-sizing: border-box;
  line-height: 1.5;
  border-radius: 0px;
  outline: none;
  overflow-wrap: break-word;
  word-break: break-word;
  transition: height 0.1s ease-out; /* opcional para suavidad */
  background-color: transparent;
  border-bottom: 1px solid ${globalCSSVars["--detail"]};
`;

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoResizeTextarea: React.FC<Props> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <StyledTextarea
      {...props}
      ref={textareaRef}
      onInput={(e) => {
        props.onInput?.(e);
      }}
      wrap="soft"
    />
  );
};

export default AutoResizeTextarea;

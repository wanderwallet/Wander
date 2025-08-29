import type { DragControls } from "framer-motion";
import { DotsIcon } from "@iconicicons/react";
import type { PointerEvent } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";

export default function ReorderIcon({ dragControls }: Props) {
  function handler(e: PointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    dragControls.start(e);
  }

  return (
    <Wrapper onPointerDown={handler} title={browser.i18n.getMessage("click_and_drag")}>
      <Icon width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M4.25 8.75H19.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.25 15.25H19.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Icon>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  color: rgb(${(props) => props.theme.secondaryText});
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const Icon = styled.svg`
  font-size: 1.4rem;
  width: 1em;
  height: 1em;
`;

interface Props {
  dragControls: DragControls;
}

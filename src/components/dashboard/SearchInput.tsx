import { Input } from "@arconnect/components-rebrand";
import type { HTMLProps } from "react";
import styled from "styled-components";

export default function SearchInput(
  props: HTMLProps<HTMLInputElement> & Props
) {
  return (
    <Wrapper sticky={props.sticky}>
      <Input variant="search" {...(props as any)} search={true} fullWidth />
    </Wrapper>
  );
}

const Wrapper = styled.div<Props>`
  position: ${(props) => (props.sticky ? "sticky" : "relative")};

  ${(props) =>
    props.sticky
      ? `
    top: 0;
    left: 0;
    right: 0;
  `
      : ""};
`;

interface Props {
  sticky?: boolean;
  small?: boolean;
}

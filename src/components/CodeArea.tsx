import type { DisplayTheme } from "@arconnect/components-rebrand";
import type { PropsWithChildren } from "react";
import styled from "styled-components";
import { useTheme } from "~components/embed/contexts/ThemeContext";

export default function CodeArea({ children }: PropsWithChildren<{}>) {
  // display theme
  const { displayTheme } = useTheme();

  return (
    <Wrapper displayTheme={displayTheme}>
      <Code>{children}</Code>
    </Wrapper>
  );
}

const Wrapper = styled.pre<{ displayTheme: DisplayTheme }>`
  padding: 0.2rem 0.3rem;
  background-color: ${(props) => (props.displayTheme === "light" ? "#FAFAFA" : "#050505")};
  overflow: auto;
`;

const Code = styled.code`
  font-size: 0.8rem;
  color: rgb(${(props) => props.theme.secondaryText});
`;

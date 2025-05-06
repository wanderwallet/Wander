import { Text, type DisplayTheme } from "@arconnect/components";
import styled from "styled-components";

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: none;
  align-self: stretch;
  flex-grow: 0;
`;

export const ContentWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: space-between;
`;

export const CenterText = styled(Text).attrs({
  noMargin: true,
})<{ displayTheme?: DisplayTheme }>`
  width: 245px;
  text-align: center;
  color: ${(props) => (props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF")};
  font-weight: 500;
  font-size: 11px;
  line-height: 16px;
  align-self: stretch;
  flex: none;
  flex-grow: 0;

  a {
    color: rgb(${(props) => props.theme.theme});
    text-decoration: none;
  }
`;

export const HeaderText = styled(Text)<{ displayTheme?: DisplayTheme }>`
  font-size: 18px;
  font-weight: 500;
  color: ${(props) => (props.theme.displayTheme === "light" ? "#191919" : "#FFFFFF")};
`;

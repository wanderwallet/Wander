import { AnimatedQRPlayer as Player } from "@arconnect/keystone-sdk";
import styled, { useTheme } from "styled-components";
import { type ComponentProps, useMemo } from "react";
import { Loading } from "@wanderapp/components";

export default function AnimatedQRPlayer(props: ComponentProps<typeof Player>) {
  // global theme
  const theme = useTheme();

  // qr style config
  const config = useMemo(
    () => ({
      bgColor: "#fff",
      fgColor: "#000",
      maxFragmentLength: 400,
      size: 288,
      level: "L" as any,
      speed: 300,
    }),
    [theme],
  );

  return (
    <Wrapper>
      {props.data ? (
        <Player {...config} {...props} />
      ) : (
        <Loading
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "24px",
            height: "24px",
            color: theme.secondaryText,
          }}
        />
      )}
    </Wrapper>
  );
}

// padding on dark theme
const qrPadding = "15px";

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%;
  background-color: #fff;
  border-radius: ${(props) => (props.theme.displayTheme === "dark" ? "14px" : "0")};

  canvas {
    position: absolute;
    top: ${(props) => (props.theme.displayTheme === "dark" ? qrPadding : "0")};
    left: ${(props) => (props.theme.displayTheme === "dark" ? qrPadding : "0")};
    right: ${(props) => (props.theme.displayTheme === "dark" ? qrPadding : "0")};
    bottom: ${(props) => (props.theme.displayTheme === "dark" ? qrPadding : "0")};
    width: ${(props) => (props.theme.displayTheme === "dark" ? `calc(100% - ${qrPadding} * 2)` : "100%")} !important;
    height: ${(props) => (props.theme.displayTheme === "dark" ? `calc(100% - ${qrPadding} * 2)` : "100%")} !important;
  }
`;

import styled, { keyframes } from "styled-components";

const shime = keyframes`
  0% {
    background-position: -600px 0;
  }
  
  to {
    background-position: 600px 0;
  }
`;

const Skeleton = styled.div<{
  width?: string;
  height?: string;
  addMargin?: boolean;
}>`
  background: rgb(138, 145, 158, 0.17);
  background-image: linear-gradient(
    to right,
    rgb(138, 145, 158, 0.095) 0%,
    rgb(138, 145, 158, 0.075) 25%,
    rgb(138, 145, 158, 0.175) 50%,
    rgb(138, 145, 158, 0.075) 75%,
    rgb(138, 145, 158, 0.095) 100%
  );
  background-repeat: no-repeat;
  animation-name: ${shime};
  animation-duration: 2s;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-fill-mode: forwards;
  width: ${(props) => props.width || "100%"};
  height: ${(props) => props.height || "1em"};
  margin-bottom: ${(props) => (props.addMargin ? ".3em" : "0")};
`;

export default Skeleton;

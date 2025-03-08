import type { DragControls } from "framer-motion";
import { SettingsIcon } from "@iconicicons/react";
import { Text } from "@arconnect/components-rebrand";
import type { HTMLProps, ReactNode } from "react";
import Squircle from "~components/Squircle";
import ReorderIcon from "../ReorderIcon";
import styled from "styled-components";

export default function BaseElement({
  children,
  title,
  description,
  active,
  img,
  dragControls,
  ao = false,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <SettingWrapper active={active} {...(props as any)} ao={ao}>
      <ContentWrapper>
        <SettingIconWrapper img={img}>{children}</SettingIconWrapper>
        <div>
          <SettingName>{title}</SettingName>
          <SettingDescription>{description}</SettingDescription>
        </div>
      </ContentWrapper>
      {dragControls && <ReorderIcon dragControls={dragControls} />}
    </SettingWrapper>
  );
}

export const setting_element_padding = ".8rem";

const SettingWrapper = styled.div<{ active: boolean; ao?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${setting_element_padding};
  border-radius: 20px;
  overflow: hidden;
  cursor: ${(props) => (props.ao ? "default" : "pointer")};
  background-color: rgba(
    ${(props) => props.theme.theme},
    ${(props) =>
      props.active ? (props.theme.displayTheme === "light" ? ".2" : ".1") : "0"}
  );
  transition: all 0.23s ease-in-out;
  ${(props) =>
    !props.ao &&
    `
    &:hover {
      background-color: rgba(
        ${
          props.theme.theme +
          ", " +
          (props.active
            ? props.theme.displayTheme === "light"
              ? ".24"
              : ".14"
            : props.theme.displayTheme === "light"
            ? ".14"
            : ".04")
        }
      );
    }
  `}
`;

const ContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${setting_element_padding};
`;

export const SettingIconWrapper = styled(Squircle)<{
  bg?: string;
  customSize?: string;
}>`
  position: relative;
  flex-shrink: 0;
  width: ${(props) => props.customSize || "2.6rem"};
  height: ${(props) => props.customSize || "2.6rem"};

  color: rgb(${(props) => props.bg || props.theme.theme});
`;

export const SettingIcon = styled(SettingsIcon)`
  position: absolute;
  font-size: 1.5rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const SettingName = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  font-weight: 500;
  font-size: 1.2rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 250px;
`;

const SettingDescription = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.82rem;
`;

export const SettingImage = styled.img.attrs({
  alt: "icon",
  draggable: false
})`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.5rem;
  user-select: none;
  transform: translate(-50%, -50%);
`;

interface Props {
  title: string | ReactNode;
  description: string | ReactNode;
  active?: boolean;
  img?: string;
  ao?: boolean;
  dragControls?: DragControls;
}

export const SettingsList = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
`;

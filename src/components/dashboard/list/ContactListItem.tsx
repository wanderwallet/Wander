import { ListItem } from "@arconnect/components-rebrand";
import { User01 } from "@untitled-ui/icons-react";
import type { HTMLProps } from "react";
import styled from "styled-components";

export default function ContactListItem({
  name,
  address,
  profileIcon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem
      title={name}
      subtitle={address}
      img={profileIcon}
      active={active}
      height={64}
      {...props}
    >
      {!profileIcon && <User01 />}
    </ListItem>
  );
}

interface Props {
  name: string;
  address: string;
  profileIcon: string;
  active: boolean;
  small?: boolean;
}

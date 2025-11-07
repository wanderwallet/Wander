import { ListItem } from "@arconnect/components-rebrand";
import type { HTMLProps } from "react";
import { NoAvatarIcon } from "~components/Avatar";

export default function ContactListItem({
  name,
  address,
  profileIcon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem title={name} subtitle={address} img={profileIcon} active={active} height={64} {...props}>
      {!profileIcon && <NoAvatarIcon size={props.small ? "1.4rem" : "2rem"} />}
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

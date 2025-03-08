import { ListItem } from "@arconnect/components-rebrand";
import { GridIcon } from "@iconicicons/react";
import type { HTMLProps } from "react";
import Image from "~components/common/Image";

export default function AppListItem({
  name,
  url,
  icon,
  active,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  return (
    <ListItem
      title={name}
      subtitle={url}
      active={active}
      icon={icon && <Image height={40} width={40} src={icon} />}
      height={64}
      hideSquircle={!!icon}
      {...props}
    >
      {!icon && <GridIcon />}
    </ListItem>
  );
}

interface Props {
  icon?: string;
  name: React.ReactNode;
  url: React.ReactNode;
  active: boolean;
  small?: boolean;
  squircleSize?: number;
  showArrow?: boolean;
}

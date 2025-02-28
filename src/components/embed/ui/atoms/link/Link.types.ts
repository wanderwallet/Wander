import { Sizes } from "../../../types";

export type LinkBaseProps = {
  linkText?: string;
  href?: string;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
  ) => void;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
};

import React, { type MouseEventHandler } from "react";
import type { Alignments, ButtonVariants, Sizes } from "../../../types";
import type { ExternalURL, WanderRoutePath } from "~wallets/router/router.types";

export type ButtonType = "button" | "submit" | "reset";

export interface ButtonProps {
  /**
   * Required prop for the content to be rendered within the ButtonBase
   */
  children: React.ReactNode | string;

  /**
   * Optional prop for additional CSS classes to be applied to the ButtonBase component.
   * These classes will be merged with the component's default classes using twMerge.
   */
  className?: string;

  /**
   * Optional prop for the size of the ButtonBase component. Default value is ButtonBaseSize.Md
   */
  size?: Sizes;

  /**
   * Optional prop to set the ButtonBase component to full width
   */
  isFullWidth?: boolean;

  /**
   * Optional prop to set the ButtonBase component as disabled
   */
  isDisabled?: boolean;

  /**
   * Optional prop to set the ButtonBase component as blurred
   */
  isBlurry?: boolean;

  /**
   * Optional prop to set the ButtonBase component as loading
   */
  isLoading?: boolean;

  /**
   * Optional prop for the variant of the ButtonBase component. Default value is ButtonVariant.Primary
   */
  variant?: ButtonVariants;

  /**
   * Optional prop for the icon to be displayed within the ButtonBase component
   */
  icon?: React.ReactNode;

  /**
   * Optional prop for the icon to be displayed within the ButtonBase component
   */
  hasBorder?: boolean;

  /**
   * Optional prop for the alignment of the ButtonBase component
   */
  alignment?: Alignments;

  /**
   * Optional prop for the style of the ButtonBase component
   */
  style?: React.CSSProperties;

  /**
   * Optional prop for the tabIndex of the ButtonBase component
   */
  tabIndex?: number;

  // Actually a link:

  /**
   * Optional prop for the href of the ButtonBase component
   */
  href?: WanderRoutePath | ExternalURL;

  // Actually a button:

  type?: ButtonType;

  /**
   * Optional prop for the onClick event handler for the ButtonBase component
   */
  onClick?: MouseEventHandler<HTMLButtonElement> | MouseEventHandler<HTMLAnchorElement>;
}

import React from "react";
import { Alignments, ButtonVariants, Sizes } from "../../../types";
import { ButtonIconPositionVariants } from "../../../types/variants";

export type ButtonBaseProps = {
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
   * Optional prop for the text to be displayed when the ButtonBase component is in a loading state
   */
  loadingChildren?: React.ReactNode | string;
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
   * Optional prop for the position of the icon within the ButtonBase component. Default value is ButtonIconPosition.Start
   */
  iconPosition?: ButtonIconPositionVariants;
  /**
   * Optional prop for the onClick event handler for the ButtonBase component
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Optional prop for the ref of the ButtonBase component
   */
  testId?: string;
  /**
   * Optional prop for the accessibility-label of the ButtonBase component
   */
  accessibilityLabel?: string;
  /**
   * Optional prop for the href of the ButtonBase component
   */
  href?: string;
  /**
   * Optional prop for the alignment of the ButtonBase component
   */
  alignment?: Alignments;

  color?: string;
};

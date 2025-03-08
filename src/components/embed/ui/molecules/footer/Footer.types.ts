export type FooterBaseProps = {
  /**
   * Optional prop for the position of the title in the Footer component
   * Default value is 'center'
   */
  childrenPosition?: "left" | "center" | "right";
  /**
   * Optional prop for the title of the Footer component
   * Default value is an empty string
   */
  children?: React.ReactNode;
  /**
   * Optional prop for the subtitle of the Footer component
   * Default value is an empty string
   */
  subtext?: string;
  /**
   * Optional prop for additional CSS classes to be applied to the Footer component.
   */
  className?: string;
};

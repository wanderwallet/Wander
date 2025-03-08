export type HeaderBaseProps = {
  /**
   * Optional prop for the position of the title in the Header component
   * Default value is 'center'
   */
  titlePosition?: "left" | "center" | "right";
  /**
   * Optional prop for the title of the Header component
   * Default value is an empty string
   */
  title?: string;
  /**
   * Optional prop for the subtitle of the Header component
   * Default value is an empty string
   */
  subtitle?: string;
  /**
   * Optional prop for additional CSS classes to be applied to the Header component.
   */
  className?: string;
  /**
   * Optional prop for the icon of the Header component
   */
  icon?: React.ReactNode;
};

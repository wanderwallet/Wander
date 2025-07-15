import type { SVGProps } from "react";
const SvgSuccessCheckSimple = ({ width = 19, height = 19, ...props }: SVGProps<SVGSVGElement>) => (
  <svg width={width} height={height} viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.75004 0.333374C4.68743 0.333374 0.583374 4.43743 0.583374 9.50004C0.583374 14.5626 4.68743 18.6667 9.75004 18.6667C14.8126 18.6667 18.9167 14.5626 18.9167 9.50004C18.9167 4.43743 14.8126 0.333374 9.75004 0.333374ZM14.0893 7.5893C14.4147 7.26386 14.4147 6.73622 14.0893 6.41078C13.7639 6.08535 13.2362 6.08535 12.9108 6.41078L8.50004 10.8215L6.5893 8.91078C6.26386 8.58535 5.73622 8.58535 5.41078 8.91078C5.08535 9.23622 5.08535 9.76386 5.41078 10.0893L7.91078 12.5893C8.23622 12.9147 8.76386 12.9147 9.0893 12.5893L14.0893 7.5893Z"
      fill="#04AA3E"
    />
  </svg>
);
export default SvgSuccessCheckSimple;

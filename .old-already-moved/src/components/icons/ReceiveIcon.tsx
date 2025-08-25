export const ReceiveIcon = ({ flipped = false }: { flipped?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 57 56"
    fill="none"
    style={flipped && { transform: "rotate(180deg)", flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M25.6415 9.86579L16.6545 39.3722C16.3165 40.6939 16.6632 41.3116 18.0827 40.9486L47.6499 31.9368L34.2169 25.5655L19.479 38.1054L32.019 23.3676L25.6415 9.86579Z"
      fill="currentColor"
    />
  </svg>
);
